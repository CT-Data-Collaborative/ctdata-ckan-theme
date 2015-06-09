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
from ..location.services import LocationService
from ckan.controllers.user import UserController
from IPython import embed

import ckan.logic as logic
get_action = logic.get_action

class UserController(UserController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)
        self.location_service = LocationService(self.session)

    def user_page(self):
        user_name = http_request.environ.get("REMOTE_USER")
        user      = self.user_service.get_or_create_user(user_name) if user_name else None

        if not user:
            return self.login()

        try:
            context = {'model': model, 'session': model.Session, 'user': c.user or c.author}
            c.user_dict = get_action('user_show')(context, {'id': c.user})
        except toolkit.ObjectNotFound:
            abort(404)

        profiles = self.location_service.get_user_profiles(user.ckan_user_id)
        indicators = self.community_profile_service.get_gallery_indicators_for_user(user.ckan_user_id, 'all')

         # Get list of groups
        context   = {'model': model, 'session': model.Session, 'user': c.user or c.author, 'for_view': True,
                   'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'am_member': True}
        users_groups     = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups ]

        return base.render('user/user_page.html', extra_vars={'profiles': profiles, 'gallery_indicators': indicators})


    def community_profiles(self, user_id):
        user_name = http_request.environ.get("REMOTE_USER")

        user    = self.user_service.get_or_create_user(user_name) if user_name else None
        c.user  = user_id
        context = {'model': model, 'session': model.Session, 'user': c.user or c.author}
        try:
            c.user_dict = get_action('user_show')(context, {'id': user_id,'include_num_followers': True})
        except toolkit.ObjectNotFound:
            abort(404)

        profiles = self.location_service.get_user_profiles(c.user_dict['id'])

        return base.render('user_community_profiles.html', extra_vars={'profiles': profiles, 'user_name': user_name, 'requested_user_name': c.user_dict['name']})

    def my_community_profiles(self):
        user_name = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(404)

        user = self.user_service.get_or_create_user(user_name) if user_name else None
        profiles = self.location_service.get_user_profiles(user.ckan_user_id)

        return base.render('user/my_community_profiles.html', extra_vars={'profiles': profiles})

    def my_gallery(self):
        permission = 'all'
        user_name = http_request.environ.get("REMOTE_USER")
        if not user_name:
            abort(404)

        indicators = self.community_profile_service.get_gallery_indicators_for_user(c.userobj.id, permission)

        # Get list of groups
        context   = {'model': model, 'session': model.Session, 'user': c.user or c.author, 'for_view': True,
                   'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'am_member': True}
        users_groups     = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups ]

        self.session.close()
        return base.render('user/my_gallery.html', extra_vars={'gallery_indicators': indicators, 'user_name': user_name})

    def user_gallery(self, user_id):
        user_name = http_request.environ.get("REMOTE_USER")
        indicators, requested_user_name = self._prepare_for_user_gallery(http_request)
        c.user    = user_id
        context = {'model': model, 'session': model.Session, 'user': c.user or c.author}

        try:
            c.user_dict = get_action('user_show')(context, {'id': user_id,'include_num_followers': True})
        except toolkit.ObjectNotFound:
            abort(404)
        return base.render('user/user_gallery.html', extra_vars={'gallery_indicators': indicators, 'user_name': user_name, 'requested_user_name': requested_user_name})

    def _prepare_for_user_gallery(self, http_request):
        logged_user_name    = http_request.environ.get("REMOTE_USER")
        requested_user_name = http_request.environ.get('wsgiorg.routing_args')[1]['user_id']
        permission = 'public' if logged_user_name != requested_user_name else 'all'
        try:
            user = self.user_service.get_or_create_user(requested_user_name) if requested_user_name else None
        except toolkit.ObjectNotFound:
            abort(404)

        indicators = self.community_profile_service.get_gallery_indicators_for_user(user.ckan_user_id, permission)

        # Get list of groups
        context   = {'model': model, 'session': model.Session, 'user': c.user or c.author, 'for_view': True,
                   'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'am_member': True}
        users_groups     = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups ]

        self.session.close()
        return indicators, requested_user_name

    def update_gallery_indicator(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user       = self.user_service.get_or_create_user(user_name) if user_name else None
            json_body  = json.loads(http_request.body, encoding=http_request.charset)
            ind_params = json_body.get('ind_params')
            indicator  = self.community_profile_service.update_indicator(int(ind_params['id']), ind_params['name'],
                                                            ind_params['permission'], ind_params['group_ids'])

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
        return json.dumps({'success': True})

    def remove_gallery_indicators(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user                 = self.user_service.get_or_create_user(user_name) if user_name else None
            json_body            = json.loads(http_request.body, encoding=http_request.charset)
            indicators_to_remove = json_body.get('indicators_to_remove')

            for indicator_id in indicators_to_remove:
                self.community_profile_service.remove_indicator(user, int(indicator_id))

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
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

            # for community_id, name in names_hash.iteritems():
            #     self.community_profile_service.update_community_profile_name(int(community_id), name, user.ckan_user_id)

            for profile_id in profiles_to_remove:
                self.location_service.remove_profile(int(profile_id), user.ckan_user_id)

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
        return json.dumps({'success': True})
