# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.ext.associationproxy import association_proxy
# from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table, DateTime
# from sqlalchemy.orm import relationship, backref
# import datetime

# import ckan.model as model
# from IPython import embed

# Base = declarative_base()

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table, DateTime
from sqlalchemy.orm import relationship, backref
import datetime

import ckan.model as model
from IPython import embed
import json
import ckan.logic as logic
import ckan.plugins.toolkit as toolkit

get_action = logic.get_action

Base = declarative_base()


class Location(Base):
    __tablename__ = 'ctdata_locations'

    id     = Column(Integer, primary_key=True)
    fips   = Column(BigInteger)
    name   = Column(String)
    public = Column(Boolean, default=False)

    def __init__(self, name, fips):
        self.fips   = fips
        self.name   = name
        self.public = True

    def __repr__(self):
        return "Location %s %s %s" % (self.id, self.name, self.fips)


class CtdataProfile(Base):
    __tablename__ = 'ctdata_profiles'

    id             = Column(Integer, primary_key=True)
    name           = Column(String)
    global_default = Column(Boolean, default=False)

    user_id        = Column(String, ForeignKey('ctdata_user_info.ckan_user_id'))

    locations      = relationship(Location, secondary='ctdata_locations_profiles',
                      backref=backref('profiles', lazy='dynamic'))

    # indicators     = relationship('ctdata_profile_indicators',
    #                   backref=backref('profile', lazy='joined'), lazy='dynamic')

    def __init__(self, name, user_id):
        self.name = name
        self.user_id = user_id

    def __repr__(self):
        return "Profile %s %s" % (self.name, self.user_id)



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