import json
import datetime

from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError

import ckan.plugins.toolkit as toolkit

from models import Location, CtdataProfile
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
        self.session.commit()

    ################ Indicators ############################################

    def load_indicator_value_for_location(self, filters, dataset_id, location_name):
        db   = Database()
        conn = db.connect()
        curs = conn.cursor()

        dataset = DatasetService.get_dataset(dataset_id)
        dataset_meta    = DatasetService.get_dataset_meta(dataset_id)
        geography       = filter(lambda x: x['key'] == 'Geography', dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

        filters = json.loads(filters)

        query = '''
                    SELECT "Value" FROM "%s" WHERE "%s"='%s' AND %s
                ''' % (dataset.table_name, geography_param, location_name,  " AND ".join(''' "%s" = '%s' ''' % (f['field'], f['values'][0]) for f in filters))

        curs.execute(query, (dataset.table_name,))
        value = curs.fetchall()

        return str(value[0][0])


    def new_indicator(self, name, filters, dataset_id, owner, ind_type, visualization_type, permission = 'public', description = '', group_ids = ''):
        dataset = DatasetService.get_dataset(dataset_id)

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
                                     variable, ind_type, visualization_type, permission, description, group_ids)


        return indicator