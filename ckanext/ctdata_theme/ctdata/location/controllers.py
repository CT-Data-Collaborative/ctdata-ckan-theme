import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, c, request as http_request
import ckan.lib.helpers as h
from models import Location, CtdataProfile, LocationProfile

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
    #end

    def show(self, location_name):
        location = self.location_service.get_location(location_name)
        default_profile = location.default_profile()
        towns           = self.location_service.get_all_locations()
        towns_names     = ','.join( l for l in  [location.name])

        if default_profile.locations:
            towns_names = ','.join( l for l in map(lambda t: t.name, default_profile.locations))
        else:
            location_profile = LocationProfile(location.id, default_profile.id)
            self.session.add(location_profile)

        return base.render('location/show.html', extra_vars={'location': location, 'towns': towns, 'towns_names': towns_names, 'default_profile_id': default_profile.id, 'default_profile': default_profile})
    #end

    def data_by_location(self):
        locations = self.location_service.get_all_locations()

        return base.render('location/data_by_location.html', extra_vars={'locations': locations})
    #end

    def manage_locations(self):
        locations = self.location_service.get_all_locations()

        return base.render('location/manage_locations.html', extra_vars={'locations': locations})
    #end

    def create_location(self):
        if http_request.method == 'POST':
            json_body = json.loads(http_request.body, encoding=http_request.charset)
            name      = json_body.get('name')
            fips      = json_body.get('fips')

            location = self.location_service.create(name, fips)
            profile  = CtdataProfile(str(location.name), True, None)
            self.session.add(profile)
            self.session.commit()

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'location_name': location.name, 'location_fips': location.fips})
    #end

    def new_profile(self, location_name):
        location = self.location_service.get_location(location_name)

        return base.render('location/new_profile.html', extra_vars={'location': location})
    #end

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

            if locations:
                locations = locations.split(',')
                locations_names = locations
            else:
                locations = [location]
                locations_names = map(lambda t: t.name, locations)
                locations = locations_names

            if not filters or not dataset_id:
                abort(400)

            try:
                indicator =  self.location_service.new_indicator(name, filters, dataset_id, user, ind_type, visualization_type, permission, description, group_ids)
                values    =  self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, locations)

                ind_data = {
                         'id': indicator.id,
                    'filters': indicator.filters,
                  'data_type': indicator.data_type,
                       'year': indicator.year,
                    'link_to': indicator.link_to_visualization_with_locations(locations_names),
                    'dataset': indicator.dataset_name(),
                 'dataset_id': indicator.dataset_id,
                   'variable': indicator.variable,
                   'values'  : values
                }

                return json.dumps({'success': True, 'indicator': ind_data })
            except toolkit.ObjectNotFound, e:
                return json.dumps({'success': False, 'error': str(e)})
            except ProfileAlreadyExists, e:
                return json.dumps({'success': False, 'error': str(e)})

        return json.dumps({'success': False, 'error': str('Indicator cannot be saved')})

        return base.render('location/new_profile.html', extra_vars={'location': location})
    #end

    def create_location_profile(self, location_name):
        http_response.headers['Content-type'] = 'application/json'
        location   = self.location_service.get_location(location_name)
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id

        if http_request.method == 'POST':
            user       = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
            json_body  = json.loads(http_request.body, encoding=http_request.charset)
            locations  = json_body.get('locations').split(',')
            indicators = json_body.get('indicators')
            name       = json_body.get('name')
            global_default  = json_body.get('global_default')

            profile    = self.location_service.create_profile(user, name, indicators, locations, global_default, location)

            redirect_link = '/community/' + str(profile.id)
            return json.dumps({'success': True,  'redirect_link': redirect_link})

        return json.dumps({'success': False, 'error': str('Profile cannot be saved')})
    #end

    def community_profile(self, profile_id):

        default_profile = self.location_service.get_profile(profile_id)

        if not default_profile:
            abort(404)
        towns           = self.location_service.get_all_locations()
        towns_names = ','.join( l for l in map(lambda t: t.name, default_profile.locations))


        return base.render('location/show.html', extra_vars={'location': default_profile.locations[0], 'towns': towns, 'towns_names': towns_names, 'default_profile_id': default_profile.id, 'default_profile': default_profile})
    #end

    def load_profile_indicators(self, profile_id):
        http_response.headers['Content-type'] = 'application/json'

        session_id     = session.id
        user_name      = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        json_body      = json.loads(http_request.body, encoding=http_request.charset)
        location_names = json_body.get('locations')
        location_names = location_names.split(',')
        profile        = self.location_service.get_profile(profile_id)
        user           = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
        locations      = []

        if (not profile.user and user.is_admin) or profile.user == user:
            ######### save new towns
            for profile_location in profile.locations:
                if profile_location.name not in location_names:
                    self.location_service.remove_location_profile(profile_location.id, profile.id)
                    profile.locations.remove(profile_location)

            for location_name in location_names:
                location = self.location_service.get_location(location_name)
                locations.append( location )
                if location not in profile.locations:
                    profile.locations.append(location)
                    location_profile = LocationProfile(location.id, profile.id)
                    self.session.add(location_profile)

            self.session.commit()
            locations_names = map(lambda t: t.name, profile.locations)
        else:
            locations_names = location_names


        ######### load indicators data

        ind_data = []
        for indicator in profile.indicators:
            values = self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, locations_names)

            data  = {}
            data  = {
                     'id': indicator.id,
                'filters': indicator.filters,
              'data_type': indicator.data_type,
                   'year': indicator.year,
                'link_to': indicator.link_to_visualization_with_locations(locations_names),
                'dataset': indicator.dataset_name(),
             'dataset_id': indicator.dataset_id,
               'variable': indicator.variable,
               'values'  : values
            }

            ind_data.append(data)

        return json.dumps({'success': True, 'ind_data': ind_data, 'towns':  locations_names})
    #end

    def save_local_default(self, profile_id):
        http_response.headers['Content-type'] = 'application/json'
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        user       = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
        json_body  = json.loads(http_request.body, encoding=http_request.charset)
        locations  = json_body.get('locations').split(',')
        indicators = json_body.get('indicators')
        profile    = self.location_service.get_profile(profile_id)

        #remove deleted indicators
        for indicator in profile.indicators:
            if not indicator.id in map(lambda i: i['id'], indicators):
                self.session.delete(indicator)
                self.session.commit()

        #save new indicators
        for indicator in indicators:
            if not indicator['id']:
                indicator  = self.location_service.create_indicator(indicator['name'], indicator['filters'], indicator['dataset_id'], user, indicator['ind_type'], 'table', profile.id)
                profile.indicators.append(indicator)


        return json.dumps({'success': True })
    #end

    def remove_location_profile(self, profile_id):
        http_response.headers['Content-type'] = 'application/json'
        if http_request.method == 'POST':
            self.location_service.remove_profile(profile_id, c.userobj.id)

        return json.dumps({'success': True })




