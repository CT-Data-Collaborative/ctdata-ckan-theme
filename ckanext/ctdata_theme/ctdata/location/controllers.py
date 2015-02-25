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
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..community.services import CommunityProfileService, ProfileAlreadyExists, CantDeletePrivateIndicator

from services import LocationService

from IPython import embed
from termcolor import colored

class LocationsController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service     = UserService(self.session)
        self.location_service = LocationService(self.session)

    def show(self, location_name):
        location = self.location_service.get_location(location_name)
        profiles = location.profiles.all()

        return base.render('location/show.html', extra_vars={'location': location, 'profiles': profiles})

    def data_by_location(self):
        locations = self.location_service.get_all_locations()

        return base.render('location/data_by_location.html', extra_vars={'locations': locations})

    def manage_locations(self):
        locations = self.location_service.get_all_locations()

        return base.render('location/manage_locations.html', extra_vars={'locations': locations})

    def create_location(self):
        if http_request.method == 'POST':
            json_body = json.loads(http_request.body, encoding=http_request.charset)
            name      = json_body.get('name')
            fips      = json_body.get('fips')

            location  = self.location_service.create(name, fips)

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'location_name': location.name, 'location_fips': location.fips})

    def new_profile(self, location_name):
        location = self.location_service.get_location(location_name)

        return base.render('location/new_profile.html', extra_vars={'location': location})

    def load_indicator(self, location_name):
        location = self.location_service.get_location(location_name)
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id


        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None

            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            filters     = json_body.get('filters')
            locations   = json_body.get('locations')
            dataset_id  = json_body.get('dataset_id')
            name        = json_body.get('name')
            ind_type    = json_body.get('ind_type')
            permission  = json_body.get('permission')
            description = json_body.get('description')
            group_ids   = json_body.get('group_ids')
            visualization_type   = json_body.get('visualization_type') or 'table'

            http_response.headers['Content-type'] = 'application/json'

            locations = locations.split(',')
            if not filters or not dataset_id:
                abort(400)

            try:
                indicator =  self.location_service.new_indicator(name, filters, dataset_id, user, ind_type, visualization_type, permission, description, group_ids)
                value     =  self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, location_name)

                ind_data = {
                         'id': indicator.id,
                    'filters': indicator.filters,
                  'data_type': indicator.data_type,
                       'year': indicator.year,
                    'link_to': indicator.link_to_visualization(),
                    'dataset': indicator.dataset_name(),
                   'variable': indicator.variable,
                   'values'  : value
                }

                return json.dumps({'success': True, 'indicator': ind_data })
            except toolkit.ObjectNotFound, e:
                return json.dumps({'success': False, 'error': str(e)})
            except ProfileAlreadyExists, e:
                return json.dumps({'success': False, 'error': str(e)})

        return json.dumps({'success': False, 'error': str('Indicator cannot be saved')})

        return base.render('location/new_profile.html', extra_vars={'location': location})


    def create_location_profile(self, location_name):
        location   = self.location_service.get_location(location_name)
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id

        if http_request.method == 'POST':
            http_response.headers['Content-type'] = 'application/json'

            user       = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
            json_body  = json.loads(http_request.body, encoding=http_request.charset)
            locations  = json_body.get('locations').split(',')
            indicators = json_body.get('indicators')
            name       = json_body.get('name')
            global_default  = json_body.get('global_default')

            profile    = self.location_service.create_profile(user, name, indicators, locations, global_default, location)

            # value     =  self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, location_name)

            # 'indicator': ind_data
            return json.dumps({'success': True })


        return json.dumps({'success': False, 'error': str('Profile cannot be saved')})


    # def community_profile(self, community_name):
    #     location        = http_request.environ.get("wsgiorg.routing_args")[1]['community_name']
    #     profile_to_load = http_request.GET.get('p')

    #     if profile_to_load:
    #         community = self.community_profile_service.get_community_profile_by_id(profile_to_load)
    #     else:
    #         community = self.community_profile_service.get_community_profile(community_name)

    #     self.session.commit()
    #     anti_csrf_token = str(uuid.uuid4())
    #     session['anti_csrf'] = anti_csrf_token
    #     session.save()

    #     default_url = '/community/' + location
    #     return base.render('communities/community_profile.html', extra_vars={'location': location,
    #                                                              'community': community,
    #                                                              'displayed_towns': towns_names,
    #                                                              'towns_raw': towns_raw,
    #                                                              'towns': towns,
    #                                                              'anti_csrf_token': anti_csrf_token,
    #                                                              'default_url': default_url})
