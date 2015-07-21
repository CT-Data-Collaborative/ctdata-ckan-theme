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

from ..utils import dict_with_key_value
from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..topic.services import TopicSerivce
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..community.services import ProfileAlreadyExists, CantDeletePrivateIndicator

from services import LocationService


from IPython import embed
from termcolor import colored

class LocationsController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory(expire_on_commit=False)
        self.user_service      = UserService(self.session)
        self.location_service  = LocationService(self.session)

    #end

    def locations_index(self):

        default_profile = self.location_service.get_default_location_profile()

        if not default_profile:
            abort(404)
        locations   = self.location_service.get_all_locations()
        towns_names = ','.join( l for l in map(lambda t: t.name, default_profile.locations))
        geo_types   =  self.location_service.location_geography_types()

        locations_hash = {}
        all_current_locations = []
        for type in geo_types:
            locations_to_put = filter(lambda t: t.geography_type == type, default_profile.locations)
            locations_hash[type]  = map(lambda t: t.name, locations_to_put)
            all_current_locations += locations_hash[type]

        try:
            location_name = towns_names[0]
        except IndexError:
            location_name = 'No Location'

        self.session.close()
        return base.render('location/show.html', extra_vars={'location': location_name,
                                                             'locations': locations,
                                                             'all_current_locations': all_current_locations,
                                                             'towns_names': towns_names,
                                                             'default_profile_id': default_profile.id,
                                                             'default_profile': default_profile,
                                                             'geo_types': json.dumps(geo_types) ,
                                                             'geo_types_array': geo_types})
    #end

    def data_by_location(self):
        locations = self.location_service.get_all_locations()

        self.session.close()
        return base.render('location/data_by_location.html', extra_vars={'locations': locations})
    #end

    def manage_locations(self):
        locations = self.location_service.get_all_locations()

        self.session.close()
        return base.render('location/manage_locations.html', extra_vars={'locations': locations})
    #end

    def create_location(self):
        if http_request.method == 'POST':
            json_body = json.loads(http_request.body, encoding=http_request.charset)
            name      = json_body.get('name')
            fips      = json_body.get('fips')
            geography_type = json_body.get('geography_type')

            location = self.location_service.create(name, fips, geography_type)
            profile  = CtdataProfile(str(location.name), True, None)
            self.session.add(profile)
            self.session.commit()

        self.session.close()
        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'location_name': location.name, 'location_fips': location.fips, 'location_geography_type': location.geography_type})
    #end

    def load_indicator(self):
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        geo_types  = self.location_service.location_geography_types()
        locations_records = self.location_service.get_all_locations()

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
            locations_hash = {}
            all_current_locations=[]

            if locations:
                for type in geo_types:
                    locations_to_put      = filter(lambda t: t.geography_type == type and t.name in locations.split(','), locations_records)
                    locations_hash[type]  = map(lambda t: t.name, locations_to_put)
                    all_current_locations += locations_hash[type]
            else:
                locations = []
                for type in geo_types:
                    locations_hash[type]  = map(lambda t: t.name, locations)
                    all_current_locations += locations_hash[type]

            ######### load indicators data

            ind_data = {}
            for geo_type in geo_types:
                ind_data[geo_type] = []
            if not filters or not dataset_id:
                abort(400)

            try:
                indicator =  self.location_service.new_indicator(name, filters, dataset_id, user, ind_type, visualization_type, permission, description, group_ids)
                geo_type  = indicator.dataset_geography_type()
                values    =  self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, locations_hash[geo_type])

                ind_data = {
                         'id': indicator.id,
                    'filters': indicator.filters,
                  'data_type': indicator.data_type,
                       'year': dict_with_key_value("field", "Year", json.loads(indicator.filters))['values'][0],
                    'link_to': indicator.link_to_visualization_with_locations(locations_hash[type]),
                    'dataset': indicator.dataset_name(),
                 'dataset_id': indicator.dataset_id,
                   'variable': indicator.variable,
                   'geo_type': geo_type,
                   'values'  : values
                }

                self.session.close()
                return json.dumps({'success': True, 'indicator': ind_data })
            except toolkit.ObjectNotFound, e:
                self.session.close()
                return json.dumps({'success': False, 'error': str(e)})
            except ProfileAlreadyExists, e:
                self.session.close()
                return json.dumps({'success': False, 'error': str(e)})

        self.session.close()
        return json.dumps({'success': False, 'error': str('Indicator cannot be saved')})
    #end

    def create_location_profile(self):
        http_response.headers['Content-type'] = 'application/json'
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id

        if http_request.method == 'POST':
            user       = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
            json_body  = json.loads(http_request.body, encoding=http_request.charset)
            locations  = json_body.get('locations').split(',')
            indicators = json_body.get('indicators')
            name       = json_body.get('name')
            global_default  = json_body.get('global_default')

            profile    = self.location_service.create_profile(user, name, indicators, locations, global_default)

            redirect_link = '/community/' + str(profile.id)
            return json.dumps({'success': True,  'redirect_link': redirect_link})

        self.session.close()
        return json.dumps({'success': False, 'error': str('Profile cannot be saved')})
    #end

    def community_profile(self, profile_id):

        default_profile = self.location_service.get_profile(profile_id)

        if not default_profile:
            abort(404)
        locations   = self.location_service.get_all_locations()
        towns_names = ','.join( l for l in map(lambda t: t.name, default_profile.locations))
        geo_types   =  self.location_service.location_geography_types()

        locations_hash = {}
        all_current_locations = []
        for type in geo_types:
            locations_to_put = filter(lambda t: t.geography_type == type, default_profile.locations)
            locations_hash[type]  = map(lambda t: t.name, locations_to_put)
            all_current_locations += locations_hash[type]

        try:
            location_name = towns_names[0]
        except IndexError:
            location_name = 'No Location'

        self.session.close()
        return base.render('location/show.html', extra_vars={'location': location_name,
                                                             'locations': locations,
                                                             'all_current_locations': all_current_locations,
                                                             'towns_names': towns_names,
                                                             'default_profile_id': default_profile.id,
                                                             'default_profile': default_profile,
                                                             'geo_types': json.dumps(geo_types) ,
                                                             'geo_types_array': geo_types})
    #end

    def load_profile_indicators(self, profile_id):
        http_response.headers['Content-type'] = 'application/json'

        session_id     = session.id
        user_name      = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        try:
            json_body  = json.loads(http_request.body, encoding=http_request.charset)
        except ValueError:
            self.session.close()
            return json.dumps({'success': True, 'ind_data': {}, 'towns':  []})

        location_names = json_body.get('locations')
        location_names = location_names.split(',')

        profile        = self.location_service.get_profile(profile_id)
        user           = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
        locations      = []
        geo_types      = self.location_service.location_geography_types()
        locations_hash = {}
        all_current_locations = []


        locations_records = self.location_service.get_all_locations()

        for type in geo_types:
            locations_to_put      = filter(lambda t: t.geography_type == type and t.name in location_names, locations_records)
            locations_hash[type]  = map(lambda t: t.name, locations_to_put)
            all_current_locations += locations_hash[type]

        ######### load indicators data

        ind_data = {}
        for geo_type in geo_types:
            ind_data[geo_type] = []

        if profile:
            for indicator in profile.indicators:
                ######### load indicators values only for locations with corresponding dataset
                geo_type  = indicator.dataset_geography_type()
                values    = self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, locations_hash[geo_type])

                data  = {}
                data  = {
                         'id': indicator.id,
                    'filters': indicator.filters,
                  'data_type': indicator.data_type,
                       'year': dict_with_key_value("field", "Year", json.loads(indicator.filters))['values'][0],
                    'link_to': indicator.link_to_visualization_with_locations(locations_hash[geo_type]),
                    'dataset': indicator.dataset_name(),
                 'dataset_id': indicator.dataset_id,
                   'variable': indicator.variable,
                   'geo_type': geo_type,
                   'values'  : values
                }

                ind_data[geo_type].append(data)
        else:
           data  = {}

        self.session.close()
        return json.dumps({'success': True, 'ind_data': ind_data, 'all_current_locations':  all_current_locations, 'locations_hash': locations_hash})
    #end

    def save_local_default(self, profile_id):
        http_response.headers['Content-type'] = 'application/json'
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        user       = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
        json_body  = json.loads(http_request.body, encoding=http_request.charset)
        location_names = json_body.get('locations').split(',')
        ids_to_remove  = json_body.get('ids_to_remove')
        locations  = []
        indicators = json_body.get('indicators')
        profile    = self.location_service.get_profile(profile_id)

        #remove deleted indicators
        for indicator in profile.indicators:
            # if not indicator.id in map(lambda i: i['id'], indicators):
            if str(indicator.id) in ids_to_remove:
                self.session.delete(indicator)
                self.session.commit()

        #save new indicators
        for indicator in indicators:
            if not indicator['id']:
                indicator  = self.location_service.create_indicator(indicator['name'], indicator['filters'], indicator['dataset_id'], user, indicator['ind_type'], 'table', profile.id)
                profile.indicators.append(indicator)

        if profile.user and profile.user == user:
            ######### save new locations
            for profile_location in profile.locations:
                if profile_location.name not in location_names:
                    self.location_service.remove_location_profile(profile_location.id, profile.id)
                    profile.locations.remove(profile_location)

            for location_name in location_names:
                try:
                    location = self.location_service.get_location(location_name)
                    locations.append( location )

                    if location not in profile.locations:
                        profile.locations.append(location)
                        location_profile = LocationProfile(location.id, profile.id)
                        self.session.add(location_profile)

                except toolkit.ObjectNotFound:
                    pass

            self.session.commit()

        self.session.close()
        return json.dumps({'success': True })
    #end

    def remove_location_profile(self, profile_id):
        http_response.headers['Content-type'] = 'application/json'
        if http_request.method == 'POST':
            self.location_service.remove_profile(profile_id, c.userobj.id)

        self.session.close()
        return json.dumps({'success': True })




