import json
import datetime

from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError

import ckan.plugins.toolkit as toolkit

from models import Location, CtdataProfile, LocationProfile
from ..community.models import CommunityProfile, ProfileIndicator, ProfileIndicatorValue, Town, UserIndicatorLink
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..visualization.services import DatasetService
from ..utils import dict_with_key_value, OrderedSet
from ..database import Database

from IPython import embed
import ckan.model as model


class LocationService(object):

    def __init__(self, session):
        self.session = session

    ################ TOWNS ############################################

    def get_location(self, location_name):
        location = self.session.query(Location).filter(Location.name == location_name).first()
        if not location:
            raise toolkit.ObjectNotFound("No town with this name was found")
        return location

    def get_all_locations(self):
        return self.session.query(Location).order_by(Location.name).all()

    def get_locations_by_names(self, locations_names):
        return self.session.query(Town).filter(Town.name.in_(set(locations_names))).all()

    def create(self, name, fips):
        location = Location(name, fips)
        self.session.add(location)

        return location

    def find_location_profile(self, location_id, profile_id):
        return self.session.query(LocationProfile).filter(and_(LocationProfile.location_id == location_id, LocationProfile.profile_id == profile_id)).first()

    def remove_location_profile(self, location_id, profile_id):
        location_profile = self.find_location_profile(location_id, profile_id)
        if location_profile:
            self.session.delete(location_profile)

        self.session.commit()

    ################ Profiles   ############################################

    def get_user_profiles(self, user_id):
        profiles = self.session.query(CtdataProfile).filter(CtdataProfile.user_id == user_id).all()

        return profiles

    def create_profile(self, user, name, indicators, locations, global_default, main_location):
        profile = CtdataProfile(name, global_default, user.ckan_user_id)
        self.session.add(profile)

        for location_name in locations:
            profile.locations.append(self.get_location(location_name))

        location_profile = LocationProfile(main_location.id, profile.id)
        self.session.add(location_profile)

        for indicator in indicators:
           indicator  = self.create_indicator(indicator['name'], indicator['filters'], indicator['dataset_id'], user, indicator['ind_type'], 'table', profile.id)
           profile.indicators.append(indicator)

        self.session.commit()
        return profile

    def remove_profile(self, profile_id, user_id):
        profile  = self.get_profile(profile_id)

        self.session.delete(profile)
        self.session.commit()

    def get_profile(self, profile_id):
        profile = self.session.query(CtdataProfile).filter(CtdataProfile.id == profile_id).first()

        return profile

    ################ Indicators ############################################

    def load_indicator_value_for_location(self, filters, dataset_id, location_names):
        db   = Database()
        conn = db.connect()
        curs = conn.cursor()

        dataset = DatasetService.get_dataset(dataset_id)
        dataset_meta    = DatasetService.get_dataset_meta(dataset_id)
        geography       = filter(lambda x: x['key'] == 'Geography', dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

        filters = json.loads(filters)
        arr     = []
        for location_name in location_names:
            query = '''
                        SELECT "Value" FROM "%s" WHERE "%s"='%s' AND %s
                    ''' % (dataset.table_name, geography_param, location_name,  " AND ".join(''' "%s" = '%s' ''' % (f['field'], f['values'][0]) for f in filters))

            curs.execute(query, (dataset.table_name,))
            value = curs.fetchall()
            arr.append(str(value[0][0]) if value else None)

        return arr


    def new_indicator(self, name, filters, dataset_id, owner, ind_type, visualization_type, profile_id = None, permission = 'public', description = '', group_ids = ''):
        dataset = DatasetService.get_dataset(dataset_id)

        if type(filters) is not list:
            filters = json.loads(filters)
        try:
            data_type = dict_with_key_value("field", "Measure Type", filters)['values'][0]
            years     = dict_with_key_value("field", "Year", filters)['values'][0]
        except (TypeError, AttributeError, IndexError):
            raise toolkit.ObjectNotFound("There must be values for the 'Measure Type' and 'Year' filters")

        variable_fltr = dict_with_key_value("field", "Variable", filters)
        variable = ''
        if variable_fltr:
            variable = variable_fltr["values"][0] if "values" in variable_fltr else None

        try:
            years = int(years)
        except ValueError:
            try:
                years = datetime.datetime.strptime("2008-09-03 00:00:00", "%Y-%m-%d %H:%M:%S").year
            except ValueError:
                raise toolkit.ObjectNotFound("'Year' filter value must be an integer "
                                             "or have '%Y-%m-%d %H:%M:%S' format")


        indicator = ProfileIndicator(name, json.dumps(filters), dataset.ckan_meta['id'], data_type, int(years),
                                     variable, ind_type, visualization_type, profile_id, permission, description, group_ids)

        return indicator

    def create_indicator(self, name, filters, dataset_id, owner, ind_type, visualization_type, profile_id = None, permission = 'public', description = '', group_ids = ''):
        indicator = self.new_indicator(name, filters, dataset_id, owner, ind_type, visualization_type, profile_id, permission, description, group_ids)

        self.session.add(indicator)
        self.session.commit()

        return indicator




