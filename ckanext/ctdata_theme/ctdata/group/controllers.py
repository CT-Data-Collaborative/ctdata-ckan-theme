import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model    as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, c, request as http_request

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from ..topic.services import TopicSerivce
from ckan.controllers.group import GroupController
from IPython import embed
import ckan.lib.navl.dictization_functions as dict_fns

import ckan.lib.helpers as h
import ckan.logic       as logic
import ckan.lib.jsonp   as jsonp

get_action      = logic.get_action
NotFound        = logic.NotFound
NotAuthorized   = logic.NotAuthorized
ValidationError = logic.ValidationError
clean_dict      = logic.clean_dict
tuplize_dict    = logic.tuplize_dict
parse_params    = logic.parse_params

class GroupController(GroupController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)

    def group_indicators(self):
      id = http_request.environ.get('wsgiorg.routing_args')[1]['group_id']
      context = {'model': model, 'session': model.Session,
                 'user':  c.user or c.author, 'for_view': True}
      group            = get_action('group_show')(context, {'id': id})
      c.group_dict     = group
      user_name        = http_request.environ.get("REMOTE_USER")
      group_indicators = self.community_profile_service.get_group_indicators(group['id'])
      user_indicators  = self.community_profile_service.get_gallery_indicators_for_user(c.userobj.id)
      user_indicators  = filter(lambda ind: ind.permission != 'private', user_indicators)

      indicators_to_edit = []
      if c.userobj.sysadmin:
        indicators_to_edit = list(set(group_indicators) - set(user_indicators))

      if not user_name:
        group_indicators = filter(lambda ind: ind.permission == 'public', group_indicators)
      else:
        group_user_names = map(lambda user: user['name'], group['users'])

        if user_name not in group_user_names:
          group_indicators = filter(lambda ind: ind.permission == 'public', group_indicators)

      self.session.close()
      return base.render('group/indicators.html', extra_vars={'group_indicators': group_indicators,
                                                              'indicators_to_edit': indicators_to_edit,
                                                              'user_indicators': user_indicators})

    def update_group_indicators(self):
      json_body             = json.loads(http_request.body, encoding=http_request.charset)
      group_id              = json_body.get('group_id')
      leave_in_group_ids    = json_body.get('leave_in_group_ids')
      remove_from_group_ids = json_body.get('remove_from_group_ids')

      if http_request.method == 'POST':
        for indicator_id in leave_in_group_ids:
          self.community_profile_service.move_or_add_to_group(int(indicator_id), str(group_id), 'add')

        for indicator_id in remove_from_group_ids:
          self.community_profile_service.move_or_add_to_group(int(indicator_id), str(group_id), 'remove')

      http_response.headers['Content-type'] = 'application/json'
      self.session.close()
      return json.dumps({'success': True})

    def members(self, id):
        context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author}

        try:
            members    = self._action('member_list')(context, {'id': id, 'object_type': 'user'})
            c.group_dict = self._action('group_show')(context, {'id': id})
            c.members  = []

            for member in members:
              user_id = member[0]
              state   = self.user_service.get_user_state(user_id)
              member  = member + (state,)

              c.members.append(member)

        except NotAuthorized:
            abort(401, _('Unauthorized to delete group %s') % '')
        except NotFound:
            abort(404, _('Group not found'))
        return self._render_template('group/members.html')

    @jsonp.jsonpify
    def user_autocomplete(self):
      q         = http_request.params.get('q', '')
      limit     = http_request.params.get('limit', 20)
      user_list = []
      if q:
          context = {'model': model, 'session': model.Session,
                     'user': c.user or c.author, 'auth_user_obj': c.userobj}

          data_dict = {'q': q, 'limit': limit}
          user_list = get_action('user_autocomplete')(context, data_dict)

          for user in user_list:
            if user['fullname'] and user['name'] != user['fullname']:
              user['name'] = user['fullname'] + ' ( ' + user['name'] + ' )'

      return user_list

    def member_new(self, id):
        context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author}

        #self._check_access('group_delete', context, {'id': id})
        try:
            if http_request.method == 'POST':
                data_dict = clean_dict(dict_fns.unflatten(
                    tuplize_dict(parse_params(http_request.params))))
                data_dict['id'] = id

                email     = data_dict.get('email')
                user_name = data_dict['username'].split(' ')[len(data_dict['username'].split(' ')) - 2]

                if user_name:
                  data_dict['username'] = user_name
                  c.group_dict = self._action('group_member_create')(context, data_dict)

                if email:
                  if not self.user_service.check_if_email_exits(email):
                    user_data_dict = { 'email': email, 'group_id': data_dict['id'], 'role': data_dict['role']}
                    del data_dict['email']
                    user_dict    = self._action('user_invite')(context, user_data_dict)
                    data_dict['username'] = user_dict['name']
                    c.group_dict = self._action('group_member_create')(context, data_dict)

                  else:
                    h.flash_error('User with this email already exists')

                self._redirect_to(controller='group', action='members', id=id)
            else:
                user = http_request.params.get('user')
                if user:
                    c.user_dict = get_action('user_show')(context, {'id': user})
                    c.user_role = new_authz.users_role_for_group_or_org(id, user) or 'member'
                else:
                    c.user_role = 'member'
                c.group_dict = self._action('group_show')(context, {'id': id})
                group_type = 'organization' if c.group_dict['is_organization'] else 'group'
                c.roles = self._action('member_roles_list')(
                    context, {'group_type': group_type}
                )
        except NotAuthorized:
            abort(401, _('Unauthorized to add member to group %s') % '')
        except NotFound:
            abort(404, _('Group not found'))
        except ValidationError, e:
            h.flash_error(e.error_summary)
        return self._render_template('group/member_new.html')





