import json
import datetime

from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError

import ckan.plugins.toolkit as toolkit

from models import Location, CtdataProfile, LocationProfile, Region
from ..community.models import CommunityProfile, ProfileIndicator, ProfileIndicatorValue, Town, UserIndicatorLink
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..visualization.services import DatasetService
from ..utils import dict_with_key_value, OrderedSet
from ..database import Database

from IPython import embed
import ckan.model as model
import psycopg2

class LocationService(object):

    def __init__(self, session):
        self.session = session

    ################ TOWNS ############################################

    def location_geography_types(self):
        sql_result = self.session.query(Location.geography_type).distinct().all()
        types = map(lambda x: x[0], sql_result)

        return types

    def get_locations_by_type(self, type):
        return self.session.query(Location).filter(Location.geography_type == type ).all()

    def get_location(self, location_name):
        location = self.session.query(Location).filter(Location.name == location_name).first()
        if not location:
            raise toolkit.ObjectNotFound("No town with this name was found")
        return location

    def get_all_locations(self):
        return self.session.query(Location).order_by(Location.name).all()

    def get_locations_by_names(self, locations_names):
        return self.session.query(Town).filter(Town.name.in_(set(locations_names))).all()

    def create(self, name, fips, geography_type):
        location = Location(name, fips, geography_type)
        self.session.add(location)

        return location

    def find_location_profile(self, location_id, profile_id):
        return self.session.query(LocationProfile).filter(and_(LocationProfile.location_id == location_id, LocationProfile.profile_id == profile_id)).first()

    def remove_location_profile(self, location_id, profile_id):
        location_profile = self.find_location_profile(location_id, profile_id)
        if location_profile:
            self.session.delete(location_profile)

        self.session.commit()

    def get_regions(self):
        return self.session.query(Region).all()

    def get_region_by_id(self, id):
        return self.session.query(Region).filter(Region.id == id).first()

    def get_region_by_name(self, name):
        return self.session.query(Region).filter(Region.id == name).first()

    ################ Profiles   ############################################
    def get_default_location_profile(self):
        profile = self.session.query(CtdataProfile).filter(CtdataProfile.name == 'Location Defauilt Profile').first()
        if not profile:
           profile = CtdataProfile('Location Defauilt Profile', True, None)
           self.session.add(profile)
           self.session.commit()

        return profile

    def get_user_profiles(self, user_id):
        profiles = self.session.query(CtdataProfile).filter(CtdataProfile.user_id == user_id).all()

        return profiles

    def create_profile(self, user, name, indicators, locations, region, global_default):
        profile = CtdataProfile(name, global_default, user.ckan_user_id, region)

        for location_name in locations:
            if location_name != '':
                profile.locations.append(self.get_location(location_name))

        for indicator in indicators:
            years = filter(lambda i: i['field'] == 'Year', json.loads(indicators[0]['filters']))[0]['values']
            years = map( lambda y: int(y), years)

            variable = filter(lambda i: i['field'] == 'Variable', json.loads(indicators[0]['filters']))[0]['values'][0]
            params  = {
                'name':       indicator['name'],
                'filters':    indicator['filters'],
                'dataset_id': indicator['dataset_id'],
                'ind_type':   indicator['ind_type'],
                'aggregated': indicator['aggregated'],
                'years':      years,
                'variable':   variable,
                'visualization_type': 'table',
                'profile_id': profile.id,
                'user':       user}

            indicator = self.create_indicator(params)
            profile.indicators.append(indicator)

        self.session.commit()
        return profile

    def remove_profile(self, profile_id, user_id):
        profile  = self.get_profile(profile_id)

        self.session.delete(profile)
        self.session.commit()

    def get_profile(self, profile_id):
        try:
            int(profile_id)
            profile = self.session.query(CtdataProfile).filter(CtdataProfile.id == profile_id).first()
        except ValueError:
            profile = self.session.query(CtdataProfile).filter(CtdataProfile.name == profile_id).first()

        return profile

    ################ Indicators ############################################

    def load_indicator_value_for_location(self, filters, dataset_id, location_names):
        db   = Database()
        conn = db.connect()
        dataset = DatasetService.get_dataset(dataset_id)
        geography_param = DatasetService.get_dataset_meta_geo_type(dataset_id)

        filters = json.loads(filters)
        arr     = []

        try:
            for location_name in location_names:

                query = '''
                            SELECT "Value" FROM "%s" WHERE "%s"='%s' AND %s
                        ''' % (dataset.table_name, geography_param, location_name,  " AND ".join(''' "%s" = '%s' ''' % (f['field'], f['values'][0]) for f in filters))
                curs = conn.cursor()
                curs.execute(query, (dataset.table_name,))
                value = curs.fetchall()

                val = None
                if value:
                  val = str(value[0][0]) if str(value[0][0]) != '-9999' else '*'  # -9999 - indicator of suppresed value

                arr.append(val)

        except psycopg2.ProgrammingError:
            # del curs
            # conn.close()
            for location_name in location_names:
                arr.append(None)

        # del curs
        conn.close()
        return arr

    def new_indicator(self, params):
        dataset = DatasetService.get_dataset(params['dataset_id'])
        params['dataset_id'] = dataset.ckan_meta['id']

        if params['ind_type'] != 'common':
            user_indicators_id = self.session.query(UserIndicatorLink.indicator_id)\
                .filter(and_(UserIndicatorLink.user_id == params['user'].ckan_user_id,
                             UserIndicatorLink.deleted == False)).all()
            existing_inds = self.session.query(ProfileIndicator)\
                .filter(and_(ProfileIndicator.dataset_id == dataset.ckan_meta['id'],
                             ProfileIndicator.id.in_(user_indicators_id)))

            # check that there're currently no such indicators in the db
            # there's a JSON type for fields in postgre, so maybe there's a way to do it using SQL
            for ex_ind in existing_inds:
                ex_fltrs = json.loads(ex_ind.filters)
                # python allows us to compare lists of dicts
                if sorted(params['filters']) == sorted(ex_fltrs) and params['ind_type'] != 'gallery':
                    raise ProfileAlreadyExists("Profile with such dataset and filters already exists")


        if type(params['filters']) is not list:
            params['filters'] = json.loads(params['filters'])
        try:
            params['data_type'] = dict_with_key_value("field", "Measure Type", params['filters'])['values'][0]
            params['years']     = dict_with_key_value("field", "Year", params['filters'])['values'][0]
        except (TypeError, AttributeError, IndexError):
            raise toolkit.ObjectNotFound("There must be values for the 'Measure Type' and 'Year' filters")

        variable_fltr = dict_with_key_value("field", "Variable", params['filters'])
        params['variable'] = ''

        if variable_fltr:
            params['variable'] = variable_fltr["values"][0] if "values" in variable_fltr else None
        try:
            params['years'] = int(params['years'])
        except ValueError:
            try:
                params['years'] = int(datetime.datetime.strptime("2008-09-03 00:00:00", "%Y-%m-%d %H:%M:%S").year)
            except ValueError:
                raise toolkit.ObjectNotFound("'Year' filter value must be an integer or have '%Y-%m-%d %H:%M:%S' format")

        params['filters'] = json.dumps(params['filters'])

        indicator = ProfileIndicator(params)
        return indicator

    def create_indicator(self, params):
        indicator = self.new_indicator(params)

        if params['ind_type'] != 'common':
            params['user'].indicators.append(indicator)

        self.session.add(indicator)
        self.session.commit()

        return indicator




