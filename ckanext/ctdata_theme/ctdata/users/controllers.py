import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, c, request as http_request

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from ..topic.services import TopicSerivce
from ckan.controllers.user import UserController
from IPython import embed

import ckan.logic as logic
get_action = logic.get_action

class UserController(UserController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)

    def community_profiles(self):
        user_name = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(404)

        user = self.user_service.get_or_create_user(user_name) if user_name else None
        community_profiles = self.community_profile_service.get_user_profiles(user.ckan_user_id)

        return base.render('user_community_profiles.html', extra_vars={'community_profiles': community_profiles})

    def my_gallery(self):
        logged_user_name    = http_request.environ.get("REMOTE_USER")
        requested_user_name = http_request.environ.get('wsgiorg.routing_args')[1]['user_id']
        permission = 'public' if logged_user_name != requested_user_name else'all'

        if not logged_user_name:
            abort(404)

        user       = self.user_service.get_or_create_user(requested_user_name) if requested_user_name else None
        indicators = self.community_profile_service.get_gallery_indicators_for_user(user.ckan_user_id, permission)

        # Get list of groups
        context   = {'model': model, 'session': model.Session, 'user': c.user or c.author, 'for_view': True,
                   'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'am_member': True}
        users_groups     = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups ]

        return base.render('user/my_gallery.html', extra_vars={'gallery_indicators': indicators, 'user_name': requested_user_name})

    def update_gallery_indicators(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None

            json_body            = json.loads(http_request.body, encoding=http_request.charset)
            updated_inds         = json_body.get('updated_inds')
            indicators_to_remove = json_body.get('indicators_to_remove')

            for indicator in updated_inds.iteritems():
                id = indicator[0]
                self.community_profile_service.update_indicator(int(id), indicator[1]['name'],
                                                                    indicator[1]['permission'], indicator[1]['group_ids'])

            for indicator_id in indicators_to_remove:
                self.community_profile_service.remove_indicator(user, int(indicator_id))

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'success': True})

    def update_community_profiles(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None

            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            names_hash  = json_body.get('names_hash')
            profiles_to_remove  = json_body.get('profiles_to_remove')

            for community_id, name in names_hash.iteritems():
                self.community_profile_service.update_community_profile_name(int(community_id), name, user.ckan_user_id)

            for community_id in profiles_to_remove:
                self.community_profile_service.remove_community_profile(int(community_id), user.ckan_user_id)

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'success': True})
