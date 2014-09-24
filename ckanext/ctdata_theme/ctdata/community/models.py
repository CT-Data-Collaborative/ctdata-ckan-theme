from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

Base = declarative_base()


class CommunityProfile(Base):
    __tablename__ = 'ctdata_community_profiles'

    id = Column(Integer, primary_key=True)
    name = Column(String)

    def __init__(self, name):
        self.name = name


class ProfileIndicator(Base):
    __tablename__ = 'ctdata_profile_indicators'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(String)
    profile_id = Column(Integer, ForeignKey('ctdata_community_profiles.id'))
    data_type = Column(String)
    year = Column(Integer)

    community_profile = relationship("CommunityProfile", backref=backref('indicators', order_by=id))

    def __init__(self, profile, dataset_id, data_type, year):
        self.community_profile = profile
        self.dataset_id = dataset_id
        self.data_type = data_type
        self.year = year


class ProfileIndicatorField(Base):
    __tablename__ = 'ctdata_profile_indicator_fields'

    id = Column(Integer, primary_key=True)
    indicator_id = Column(Integer, ForeignKey('ctdata_profile_indicators.id'))
    town = Column(String)
    value = Column(String)

    indicator = relationship("ProfileIndicator", backref=backref('fields', order_by=id))

    def __init__(self, indicator, town, value):
        self.indicator = indicator
        self.town = town
        self.value = value
