import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model    as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, c, request as http_request, _, g

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
import ckan.new_authz   as new_authz
import ckan.lib.mailer  as mailer
from urlparse import urljoin

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
      try:
        group = get_action('group_show')(context, {'id': id})
      except toolkit.ObjectNotFound:
        abort(404)

      c.group_dict     = group
      user_name        = http_request.environ.get("REMOTE_USER")
      if not c.userobj:
        self.session.close()
        return base.render('group/indicators.html', extra_vars={'group_indicators': [],
                                                              'indicators_to_edit': [],
                                                              'user_indicators': []})

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


    def index(self):
        group_type = self._guess_group_type()

        context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author, 'for_view': True,
                   'with_private': False}

        q = c.q = http_request.params.get('q', '')
        data_dict = {'all_fields': True, 'q': q}

        sort_by = c.sort_by_selected = http_request.params.get('sort')
        if sort_by:
            data_dict['sort'] = sort_by
        try:
            self._check_access('site_read', context)
        except NotAuthorized:
            abort(401, _('Not authorized to see this page'))

        # pass user info to context as needed to view private datasets of
        # orgs correctly
        if c.userobj:
            context['user_id'] = c.userobj.id
            context['user_is_admin'] = c.userobj.sysadmin

        # results = self._action('group_list_authz')(context, data_dict)
        results = self._action('group_list_authz')(context, {'all_fields': True, 'q': q})
        c.page = h.Page(
            collection=results,
            page = self._get_page_number(http_request.params),
            url=h.pager_url,
            items_per_page=21
        )
        return base.render(self._index_template(group_type))

    def read(self, id, limit=20):
        group_type = self._get_group_type(id.split('@')[0])
        if group_type != self.group_type:
            abort(404, _('Incorrect group type'))

        context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author,
                   'schema': self._db_to_form_schema(group_type=group_type),
                   'for_view': True}
        data_dict = {'id': id}

        # unicode format (decoded from utf8)
        q = c.q = http_request.params.get('q', '')

        try:
            # Do not query for the group datasets when dictizing, as they will
            # be ignored and get requested on the controller anyway
            data_dict['include_datasets'] = False
            c.group_dict = self._action('group_show')(context, data_dict)
            c.members    = self._action('member_list')(context, {'id': id, 'object_type': 'user'})
            c.group      = context['group']
            group_admins = filter(lambda u: u['capacity'] == 'admin', c.group_dict['users'])

            c.is_group_author = c.user in map(lambda u: u['name'], group_admins)

        except NotFound:
            abort(404, _('Group not found'))
        except NotAuthorized:
            abort(401, _('Unauthorized to read group %s') % id)

        self._read(id, limit)
        return base.render(self._read_template(c.group_dict['type']))

    def new(self, data=None, errors=None, error_summary=None):
        group_type = self._guess_group_type(True)
        if data:
            data['type'] = group_type

        context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author,
                   'save': 'save' in http_request.params,
                   'parent': http_request.params.get('parent', None)}
        try:
            self._check_access('group_create', context)
        except NotAuthorized:
            abort(401, _('Unauthorized to create a group'))

        if context['save'] and not data:
            return self._save_new(context, group_type)

        data = data or {}
        if not data.get('image_url', '').startswith('http'):
            data.pop('image_url', None)

        errors = errors or {}
        error_summary = error_summary or {}
        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary, 'action': 'new'}

        self._setup_template_variables(context, data, group_type=group_type)
        c.form = base.render(self._group_form(group_type=group_type),
                        extra_vars=vars)
        return base.render(self._new_template(group_type))

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
                # user_name = data_dict['username'].split(' ')[len(data_dict['username'].split(' ')) - 2]

                # if user_name:
                #   data_dict['username'] = user_name
                #   c.group_dict = self._action('group_member_create')(context, data_dict)

                if email:
                  user = self.user_service.get_user_by_email(email)
                  if user:
                    self.send_invite_to_group(user, id)
                    # if not user:
                    #   user_data_dict = { 'email': email, 'group_id': data_dict['id'], 'role': data_dict['role']}
                    #   del data_dict['email']
                    #   user_dict             = self._action('user_invite')(context, user_data_dict)
                    #   data_dict['username'] = user_dict['name']
                    #   c.group_dict = self._action('group_member_create')(context, data_dict)

                  else:
                    h.flash_error('User with this email already invited to this group')
                else:
                  h.flash_error('Please enter correct email.')

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

    def add_member(self, id):
      user_id = http_request.params.get('user_id', '')
      user    = self.user_service.get_user_by_id(user_id)

      try:
        group = get_action('group_show')(context, {'id': id})
      except toolkit.ObjectNotFound:
        abort(404)

      data_dict = {'username': user['name']}

      c.group_dict = self._action('group_member_create')(context, data_dict)
      # user_name = data_dict['username'].split(' ')[len(data_dict['username'].split(' ')) - 2]
      # if user_name:
      #   data_dict['username'] = user_name
      #   c.group_dict = self._action('group_member_create')(context, data_dict)

      embed()
      return ''

    def send_invite_to_group(self, user, group):

      # mailer.create_reset_key(user)
      body    = self.get_group_invite_body(user, group)
      subject = 'Invite in group'
      self.mail_user(user, subject, body)

    def aceept_link(self, user, group):
      key  = uuid.uuid4().hex[:10]
      path = '/group/add_member/%s?user_id=%s&key=%s'%(group, user['id'], unicode(key))
      url  = urljoin(g.site_url, path)

      return url

    def mail_user(self, recipient, subject, body, headers={}):
      if (recipient['email'] is None) or not len(recipient['email']):
          raise MailerException(_("No recipient email address available!"))
      mailer.mail_recipient(recipient['display_name'], recipient['email'], subject,
              body, headers=headers)

    def get_group_invite_body(self, user, group):
      invite_message = _(
      "You have been invited to {group}."
      "\n"
      "To accept this invitiation, please follow the link:\n"
      "\n"
      "   {aceept_link}\n"
      )

      d = {
          'aceept_link': self.aceept_link(user, group),
          'group': group,
          'user_name': user['name'],
          }
      return invite_message.format(**d)




