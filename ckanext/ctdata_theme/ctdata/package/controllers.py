import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, request, c

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from ..topic.services import TopicService
from IPython import embed
from ckan.common import _
from ckan.controllers.package import PackageController

import ckan.lib.activity_streams as activity_streams
import ckan.lib.helpers as h
import ckan.logic       as logic
import ckan.lib.dictization as dictization

validators      = logic.validators
render          = base.render
get_action      = logic.get_action
NotFound        = logic.NotFound
NotAuthorized   = logic.NotAuthorized
ValidationError = logic.ValidationError
clean_dict      = logic.clean_dict
tuplize_dict    = logic.tuplize_dict
parse_params    = logic.parse_params
get_or_bust     = logic.get_or_bust

class PackageController(PackageController):
    def activity_stream_string_added_dataset_to_group(context, activity):
        return _("{actor} added the dataset {dataset} to the group {group}")
    def activity_stream_string_removed_dataset_from_group(context, activity):
        return _("{actor} removed the dataset {dataset} from the group {group}")

    activity_streams.activity_stream_string_functions['removed dataset from group'] = activity_stream_string_removed_dataset_from_group
    activity_streams.activity_stream_string_functions['added dataset to group']     = activity_stream_string_added_dataset_to_group

    validators.object_id_validators['added dataset to group'] = validators.group_id_exists
    validators.object_id_validators['removed dataset from group'] = validators.group_id_exists

    def groups(self, id):
        context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author, 'for_view': True,
                   'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'id': id}
        try:
            c.pkg_dict = get_action('package_show')(context, data_dict)
            dataset_type = c.pkg_dict['type'] or 'dataset'
        except NotFound:
            abort(404, _('Dataset not found'))
        except NotAuthorized:
            abort(401, _('Unauthorized to read dataset %s') % id)

        if request.method == 'POST':
            new_group = request.POST.get('group_added')
            if new_group:
                data_dict = {"id": new_group,
                             "object": id,
                             "object_type": 'package',
                             "capacity": 'public'}
                try:
                    get_action('member_create')(context, data_dict)

                    activity_dict = {
                      'user_id': model.User.by_name(c.user.decode('utf8')).id,
                      'object_id': new_group,
                      'activity_type': 'added dataset to group',
                      }
                    activity_dict['data'] = {
                      'group': dictization.table_dictize(model.Group.get(new_group), context),
                      'package': c.pkg_dict
                    }
                    activity_create_context = {
                        'model': model,
                        'user': c.user,
                        'ignore_auth': True,
                        'session': model.Session
                    }
                    get_action('activity_create')(activity_create_context, activity_dict)

                except NotFound:
                    abort(404, _('Group not found'))

            removed_group = None
            for param in request.POST:
                if param.startswith('group_remove'):
                    removed_group = param.split('.')[-1]
                    break
            if removed_group:
                data_dict = {"id": removed_group, "object": id, "object_type": 'package'}
                try:
                    get_action('member_delete')(context, data_dict)

                    activity_dict = {
                      'user_id': model.User.by_name(c.user.decode('utf8')).id,
                      'object_id': removed_group,
                      'activity_type': 'removed dataset from group',
                      }
                    activity_dict['data'] = {
                      'group': dictization.table_dictize(model.Group.get(removed_group), context),
                      'package': c.pkg_dict
                    }
                    activity_create_context = {
                        'model': model,
                        'user': c.user,
                        'ignore_auth': True,
                        'session': model.Session
                    }
                    get_action('activity_create')(activity_create_context, activity_dict)

                except NotFound:
                    abort(404, _('Group not found'))
            redirect(h.url_for(controller='package',
                               action='groups', id=id))

        context['is_member'] = True
        users_groups   = get_action('group_list_authz')(context, data_dict)
        pkg_group_ids  = set(group['id'] for group in c.pkg_dict.get('groups', []))
        user_group_ids = set(group['id'] for group in users_groups)

        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups if group['id'] not in pkg_group_ids]

        for group in c.pkg_dict.get('groups', []):
            group['user_member'] = (group['id'] in user_group_ids)

        return render('package/group_list.html', {'dataset_type': dataset_type})

