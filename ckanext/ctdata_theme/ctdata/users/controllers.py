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
        logged_user_name = http_request.environ.get("REMOTE_USER")
        requested_user_name = http_request.environ.get('wsgiorg.routing_args')[1]['user_id']
        permission = 'all'

        if not logged_user_name:
            abort(404)

        user = self.user_service.get_or_create_user(requested_user_name) if requested_user_name else None

        if logged_user_name != requested_user_name:
            permission = 'public'

        indicators = self.community_profile_service.get_gallery_indicators_for_user(user.ckan_user_id, permission)

        return base.render('user/my_gallery.html', extra_vars={'gallery_indicators': indicators, 'user_name': requested_user_name})

    def update_gallery_indicators(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None

            json_body          = json.loads(http_request.body, encoding=http_request.charset)
            names_hash         = json_body.get('names_hash')
            permissions_hash   = json_body.get('permissions_hash')
            indicators_to_remove = json_body.get('indicators_to_remove')

            for indicator_id, name in names_hash.iteritems():
                self.community_profile_service.update_indicator_name(int(indicator_id), name)

            for indicator_id, permission in permissions_hash.iteritems():
                self.community_profile_service.update_indicator_permission(int(indicator_id), permission)

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
