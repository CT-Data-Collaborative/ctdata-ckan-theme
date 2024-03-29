import json
import uuid
import datetime
import math

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, c, request as http_request
import ckan.lib.helpers as h
from models import Location, CtdataProfile, LocationProfile, Region, LocationRegion

from ..utils import dict_with_key_value
from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..topic.services import TopicService
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

    def locations_index(self):
        default_profile = self.location_service.get_default_location_profile()

        if not default_profile:
            abort(404)
        locations   = self.location_service.get_all_locations()
        regions     = filter(lambda r: r.user_id == c.userobj.id, self.location_service.get_regions())
        towns_names = ','.join( l for l in map(lambda t: t.name, default_profile.locations))
        geo_types   =  self.location_service.location_geography_types() + ['regions']

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
        return base.render('location/show.html', extra_vars={'regions':   regions,
                                                             'location':  location_name,
                                                             'locations': locations,
                                                             'all_current_locations': all_current_locations,
                                                             'towns_names': towns_names,
                                                             'default_profile_id': default_profile.id,
                                                             'default_profile': default_profile,
                                                             'geo_types': json.dumps(geo_types) ,
                                                             'geo_types_array': geo_types})

    def data_by_location(self):
        locations = self.location_service.get_all_locations()
        self.session.close()
        return base.render('location/data_by_location.html', extra_vars={'locations': locations})

    def manage_locations(self):
        locations = self.location_service.get_all_locations()

        self.session.close()
        return base.render('location/manage_locations.html', extra_vars={'locations': locations})

    def create_location(self):
        if http_request.method == 'POST':
            json_body = json.loads(http_request.body, encoding=http_request.charset)
            name      = json_body.get('name')
            fips      = json_body.get('fips')
            geo_type  = json_body.get('geography_type')
            location  = self.location_service.create(name, fips, geo_type)
            profile   = CtdataProfile(str(location.name), True, None)

            self.session.add(profile)
            self.session.commit()

        self.session.close()
        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'location_name': location.name, 'location_fips': location.fips, 'location_geography_type': location.geography_type})

    def load_indicator(self):
        http_response.headers['Content-type'] = 'application/json'
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        geo_types  = self.location_service.location_geography_types()
        locations_records = self.location_service.get_all_locations()

        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            locations   = json_body.get('locations')
            region_id   = json_body.get('region_id')
            save_as_region   = json_body.get('save_as_region')
            new_region_name  = json_body.get('new_region_name')
            region           = None
            locations_to_put = []
            region_locations = []
            locations_hash   = {'regions': []}
            ind_data         = {}
            all_current_locations = []

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

            if save_as_region != 'true' and region_id and region_id != 'not_selected':
                region = self.location_service.get_region_by_id(region_id)
                region_locations = map(lambda l: l.name, region.locations)
                locations_hash['regions'] = [region.name]

            ######### load indicators data

            for geo_type in geo_types:
                ind_data[geo_type] = []
            if not json_body.get('filters') or not json_body.get('dataset_id'):
                abort(400)

            try:
                params = {
                    'user':        user,
                    'name':        json_body.get('name'),
                    'filters':     json_body.get('filters'),
                    'dataset_id':  json_body.get('dataset_id'),
                    'ind_type':    json_body.get('ind_type'),
                    'permission':  json_body.get('permission'),
                    'description': json_body.get('description'),
                    'group_ids':   json_body.get('group_ids'),
                    'aggregated':  json_body.get('aggregated'),
                    'visualization_type': json_body.get('visualization_type') or 'table'
                }

                indicator = self.location_service.new_indicator(params)
                ind_data  = self.indicator_data_to_dict(indicator, region, locations_to_put, locations_hash, region_locations, region_id, save_as_region, new_region_name)

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
            region     = json_body.get('region')
            indicators = json_body.get('indicators')
            name       = json_body.get('name')
            global_default  = json_body.get('global_default')

            profile    = self.location_service.create_profile(user, name, indicators, locations, region, global_default)

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
        geo_types   =  self.location_service.location_geography_types() + ['regions']
        region      = 'not_selected'
        locations_hash = {}
        all_current_locations = []
        for type in geo_types:
            locations_to_put = filter(lambda t: t.geography_type == type, default_profile.locations)
            locations_hash[type]  = map(lambda t: t.name, locations_to_put)
            all_current_locations += locations_hash[type]

        if default_profile.region_id:
            region = self.location_service.get_region_by_id(default_profile.region_id)
            region_locations = map(lambda l: l.name, region.locations)
            locations_hash['regions'] = [region.name]

        try:
            location_name = towns_names[0]
        except IndexError:
            location_name = 'No Location'

        self.session.close()
        return base.render('location/show.html', extra_vars={'location': location_name,
                                                             'locations': locations,
                                                             'regions': [region],
                                                             'all_current_locations': all_current_locations,
                                                             'towns_names': towns_names,
                                                             'default_profile_id': default_profile.id,
                                                             'default_profile': default_profile,
                                                             'geo_types': json.dumps(geo_types) ,
                                                             'geo_types_array': geo_types})
    #end

    def load_profile_indicators(self, profile_id):
        http_response.headers['Content-type'] = 'application/json'

        try:
            json_body  = json.loads(http_request.body, encoding=http_request.charset)
        except ValueError:
            self.session.close()
            return json.dumps({'success': True, 'ind_data': {}, 'towns':  []})

        session_id        = session.id
        user_name         = http_request.environ.get("REMOTE_USER") or "guest_" + session_id
        location_names    = json_body.get('locations')
        region_id         = json_body.get('region_id')
        save_as_region    = json_body.get('save_as_region')
        new_region_name   = json_body.get('new_region_name')
        location_names    = location_names.split(',')

        profile           = self.location_service.get_profile(profile_id)
        user              = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None
        geo_types         = self.location_service.location_geography_types()
        locations_records = self.location_service.get_all_locations()
        locations         = []
        locations_hash    = {}
        ind_data          = {}
        region            = None
        locations_to_put  = []
        region_locations  = []
        all_current_locations = []

        for geo_type in geo_types:
            ind_data[geo_type] = []

        ind_data['regions'] = []

        for type in geo_types:
            locations_to_put      = filter(lambda t: t.geography_type == type and t.name in location_names, locations_records)
            locations_hash[type]  = map(lambda t: t.name, locations_to_put)
            all_current_locations += locations_hash[type]

        locations_hash['regions'] = []

        if save_as_region != 'true' and region_id and region_id != 'not_selected' and region_id != 'None':
            region = self.location_service.get_region_by_id(region_id)
            region_locations = map(lambda l: l.name, region.locations)
            locations_hash['regions'] = [region.name]

        ######### load indicators data

        if profile:
            for indicator in profile.indicators:
                data = self.indicator_data_to_dict(indicator, region, locations_to_put, locations_hash, region_locations, region_id, save_as_region, new_region_name)
                if indicator.aggregated:
                    ind_data['regions'].append(data)
                else:
                    ind_data[geo_type].append(data)

        self.session.close()
        return json.dumps({'success': True, 'ind_data': ind_data, 'all_current_locations':  all_current_locations, 'locations_hash': locations_hash})
    #end

    def indicator_data_to_dict(self, indicator, region, locations_to_put, locations_hash, region_locations, region_id, save_as_region, new_region_name):
        geo_type  = indicator.dataset_geography_type()
        if indicator.aggregated:
            if save_as_region == 'true':
                if new_region_name == '':
                    new_region_name = 'Region created by ' + c.user
                region = Region(new_region_name, c.userobj.id)
                self.session.add(region)
                self.session.commit()

                for location_to_put in locations_to_put:
                    lr = LocationRegion(location_to_put.id, region.id)
                    self.session.add(lr)

                self.session.commit()
                region_locations = map(lambda l: l.name, region.locations)
                locations_hash['regions'].append(region.name)

            ind_moes_filters = filter(lambda i: i['field'] != 'Variable' , json.loads(indicator.filters) )
            ind_moes_filters.append({'field': 'Variable', 'values': ['Margins of Error']})
            ind_moes_filters = json.dumps(ind_moes_filters)

            values = self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, region_locations)
            values = [sum(map(lambda v: float(v) if v else 0, values))] if len(values) > 0 else []

            moes_vals = self.location_service.load_indicator_value_for_location(ind_moes_filters, indicator.dataset_id, region_locations)
            moes_vals = filter(lambda v: v != None, moes_vals)

            #apply moes formula from http://www.census.gov/content/dam/Census/library/publications/2009/acs/ACSResearch.pdf (page A-14)
            moes_vals = [math.sqrt( sum( map( lambda v: float(v)*float(v), moes_vals) ) )]
        else:
            moes_vals = []
            values = self.location_service.load_indicator_value_for_location(indicator.filters, indicator.dataset_id, locations_hash[geo_type])
            values = map(lambda v: float(v), values)

        ind_data = {
                 'id': indicator.id,
            'filters': indicator.filters,
          'data_type': indicator.data_type,
               'year': dict_with_key_value("field", "Year", json.loads(indicator.filters))['values'][0],
            'link_to': indicator.link_to_visualization_with_locations(locations_hash[geo_type]),
            'dataset': indicator.dataset_name(),
         'dataset_id': indicator.dataset_id,
           'variable': indicator.variable,
           'geo_type': geo_type,
         'aggregated': indicator.aggregated,
             'values': values,
               'moes': moes_vals,
         'locations_names': region.name if region and indicator.aggregated else locations_hash[geo_type]
        }

        return ind_data
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
                params = {
                        'name':       indicator['name'],
                        'filters':    indicator['filters'],
                        'dataset_id': indicator['dataset_id'],
                        'data_type':  indicator['ind_type'],
                        'years':      int(years),
                        'variable':   variable,
                        'visualization_type': 'table',
                        'profile_id': profile.id,
                        'user':       user
                    }

                indicator = self.location_service.create_indicator(params)
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
