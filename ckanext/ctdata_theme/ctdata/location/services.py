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

        return location