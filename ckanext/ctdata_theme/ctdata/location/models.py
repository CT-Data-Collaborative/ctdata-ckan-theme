from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table, DateTime
from sqlalchemy.orm import relationship, backref
import datetime

from ..community.models import UserInfo, ProfileIndicator

import ckan.model as model
from IPython import embed
import json
import ckan.logic as logic
import ckan.plugins.toolkit as toolkit

get_action = logic.get_action

from ..community.models import Base


class Location(Base):
    __tablename__ = 'ctdata_locations'

    id     = Column(Integer, primary_key=True)
    fips   = Column(BigInteger)
    name   = Column(String)
    public = Column(Boolean, default=False)
    geography_type = Column(String, default='Town')

    def __init__(self, name, fips, geography_type):
        self.fips   = fips
        self.name   = name
        self.public = True
        self.geography_type = geography_type

    def __repr__(self):
        return "Location %s %s %s" % (self.id, self.name, self.fips)


    def default_profile(self):
        profile = model.Session.query(CtdataProfile).filter(CtdataProfile.name == self.name).first()

        return profile



class CtdataProfile(Base):
    __tablename__ = 'ctdata_profiles'

    id             = Column(Integer, primary_key=True)
    name           = Column(String)
    global_default = Column(Boolean, default=False)

    user_id        = Column(String, ForeignKey('ctdata_user_info.ckan_user_id'))

    user           = relationship(UserInfo, backref="user_profiles")
    locations      = relationship(Location, secondary='ctdata_locations_profiles',
                      backref=backref('profiles', lazy='dynamic'))

    indicators     = relationship(ProfileIndicator, backref=backref("profile_indicators", lazy='dynamic'))
    # indicators     = relationship(ProfileIndicator, backref=backref("profile_indicators", lazy='dynamic'))

    def __init__(self, name, global_default, user_id):
        self.name = name
        self.user_id = user_id
        self.global_default = global_default

    def __repr__(self):
        return "Profile %s %s %s" % (self.name, self.user_id, self.global_default)



class LocationProfile(Base):
    __tablename__ = 'ctdata_locations_profiles'

    id            = Column(Integer, primary_key=True)
    location_id   = Column(Integer, ForeignKey('ctdata_locations.id'))
    profile_id    = Column(Integer, ForeignKey('ctdata_profiles.id'))
    local_default = Column(Boolean, default=False)


    def __init__(self, location_id, profile_id):
        self.location_id = location_id
        self.profile_id  = profile_id

    def __repr__(self):
        return "Town %s %s (%d)" % (self.id, self.location_id, self.profile_id)