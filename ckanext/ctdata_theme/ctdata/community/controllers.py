import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, request as http_request
import ckan.lib.helpers as h

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..topic.services import TopicSerivce
from services import CommunityProfileService, ProfileAlreadyExists, CantDeletePrivateIndicator

from IPython import embed
from termcolor import colored

class CommunityProfilesController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)

    def add_indicator(self):
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id

        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None

            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            filters     = json_body.get('filters')
            dataset_id  = json_body.get('dataset_id')
            name        = json_body.get('name')
            ind_type    = json_body.get('ind_type')
            permission  = json_body.get('permission')

            http_response.headers['Content-type'] = 'application/json'

            if not filters or not dataset_id:
                abort(400)

            try:
                self.community_profile_service.create_indicator(name, filters, dataset_id, user, ind_type, permission)
                self.session.commit()
                h.flash_notice('Indicator successfully created.')
                return json.dumps({'success': True})
            except toolkit.ObjectNotFound, e:
                h.flash_error(str(e))
                return json.dumps({'success': False, 'error': str(e)})
            except ProfileAlreadyExists, e:
                h.flash_error(str(e))
                return json.dumps({'success': False, 'error': str(e)})

        h.flash_error('Indicator cannot be saved')
        return json.dumps({'success': False})

    def community_profile(self, community_name):
        session_id      = session.id
        user_name       = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        location        = http_request.environ.get("wsgiorg.routing_args")[1]['community_name']
        profile_to_load = http_request.GET.get('p')
        towns_raw       = http_request.GET.get('towns')
        user            = self.user_service.get_or_create_user_with_session_id(user_name, session_id)
        towns_names     = map(lambda x: x.strip(), towns_raw.split(','))  if towns_raw else []
        towns           = self.community_profile_service.get_all_towns()
        indicators, displayed_towns, displayed_towns_names = [],[],[]

        if profile_to_load:
            community = self.community_profile_service.get_community_profile_by_id(profile_to_load)
        else:
            community = self.community_profile_service.get_community_profile(community_name)

        try:
            indicators, displayed_towns = self.community_profile_service.get_indicators(community,
                                                                                        towns_names,
                                                                                        location,
                                                                                        user)
            displayed_towns_names = map(lambda t: t.name, displayed_towns)

        except toolkit.ObjectNotFound as e:
            abort(404, detail=str(e))


        self.session.commit()

        anti_csrf_token = str(uuid.uuid4())
        session['anti_csrf'] = anti_csrf_token
        session.save()

        default_url = '/community/' + location
        return base.render('communities/community_profile.html', extra_vars={'location': location,
                                                                 'community': community,
                                                                 'indicators': indicators,
                                                                 'displayed_towns': displayed_towns_names,
                                                                 'towns': towns,
                                                                 'anti_csrf_token': anti_csrf_token,
                                                                 'default_url': default_url})

    def update_profile_indicators(self):
        http_response.headers['Content-type'] = 'application/json'

        json_body             = json.loads(http_request.body, encoding=http_request.charset)
        indicators_to_remove  = json_body.get('indicators_to_remove')
        session_id      = session.id
        user_name       = http_request.environ.get("REMOTE_USER") or "guest_" + session_id

        if user_name:
            user = self.user_service.get_or_create_user_with_session_id(user_name,session_id)
        else:
            abort(401)

        if user:
            for indicator_id in indicators_to_remove:
                try:
                    self.community_profile_service.remove_indicator(user, indicator_id)
                    self.session.commit()
                except toolkit.ObjectNotFound:
                    h.flash_error('Indicator not found.')
                    return json.dumps({'success': True})
                except CantDeletePrivateIndicator, e:
                    h.flash_error(str(e))
                    return json.dumps({'success': True})

        h.flash_notice('Indicators successfully updated.')
        return json.dumps({'success': True})

    def get_topics(self):
        http_response.headers['Content-type'] = 'application/json'
        topics  = TopicSerivce.get_topics('community_profile')

        html  = base.render('communities/snippets/indicator_popup.html', extra_vars={'topics': topics})

        return json.dumps({'success': True, 'html': html})

    def save_as_default(self):
        user_name = http_request.environ.get("REMOTE_USER")
        json_body = json.loads(http_request.body, encoding=http_request.charset)
        ids       = json_body.get('indicator_ids').split(',')

        new_indicators = self.community_profile_service.get_indicators_by_ids(ids)
        old_indicators = self.community_profile_service.get_default_indicators()

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None
            if user.is_admin and sorted(new_indicators) != sorted(old_indicators):
                for old_indicator in old_indicators:
                    old_indicator.is_global = False

                for new_indicator in new_indicators:
                    new_indicator.is_global = True
                    new_indicator.temp = False

                for old_indicator in old_indicators:
                    # old_indicator.is_global = False
                    # old_indicator.temp = False
                    if not old_indicator.is_global:
                        self.session.delete(old_indicator)
                        self.community_profile_service.remove_indicator_id_from_profiles(old_indicator.id)

                self.session.commit()

        h.flash_notice('Default indicators successfully updated.')
        return json.dumps({'success': True})

    def add_profile(self):
        session_id = session.id
        user_name = http_request.environ.get("REMOTE_USER") or  "guest_" + session_id
        json_body = json.loads(http_request.body, encoding=http_request.charset)
        ids       = json_body.get('indicator_ids')
        name      = json_body.get('name')
        location  = json_body.get('location')

        if http_request.method == 'POST':
            user        = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
            user_id     = user.ckan_user_id if user else None
            profile = self.community_profile_service.create_community_profile(name, ids, user_id, '/community/' + location)

            if profile:
                host = host = http_request.environ.get('HTTP_HOST')
                h.flash_notice('Profile ' + profile.name + ' has been saved. Url: ' + host + profile.default_url)
                return json.dumps({'success': True, 'redirect_link': profile.default_url })
        else:
            h.flash_error('Profile cannot be saved.')
            return json.dumps({'success': False})

    def remove_temp_indicators(self):
        json_body = json.loads(http_request.body, encoding=http_request.charset)
        ids       = json_body.get('indicator_ids')

        if http_request.method == 'POST':
            self.community_profile_service.remove_temp_user_indicators(ids)

            # h.flash_notice('Indicators successfully removed.')
            return json.dumps({'success': True})
        else:
            # h.flash_error('Indicators cannot be removed.')
            return json.dumps({'success': False})


    def get_filters(self, dataset_id):
        http_response.headers['Content-type'] = 'application/json'

        try:
            dataset = DatasetService.get_dataset(dataset_id)
        except toolkit.ObjectNotFound:
            return json.dumps({'success': False, 'error': 'No datasets with this id'})

        result = []
        for dim in dataset.dimensions:
            if dim.name not in ['Town']:
                if dim.name == 'Race':
                    dim.possible_values.append('all')
                result.append({'name': dim.name, 'values': dim.possible_values})

        return json.dumps({'success': True, 'result': result})