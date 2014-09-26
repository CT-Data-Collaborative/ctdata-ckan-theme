from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship, backref

Base = declarative_base()

communitytowns_tables = Table('ctdata_communities_towns', Base.metadata,
    Column('community_id', Integer, ForeignKey('ctdata_community_profiles.id')),
    Column('town_id', Integer, ForeignKey('ctdata_towns.fips')),
)


class CommunityProfile(Base):
    __tablename__ = 'ctdata_community_profiles'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    towns = relationship("Town", secondary=lambda: communitytowns_tables)

    def __init__(self, name):
        self.name = name


class Town(Base):
    __tablename__ = 'ctdata_towns'

    fips = Column(Integer, primary_key=True)
    name = Column(String)

    def __init__(self, fips, name):
        self.fips = fips
        self.name = name


class ProfileIndicator(Base):
    __tablename__ = 'ctdata_profile_indicators'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(String)
    profile_id = Column(Integer, ForeignKey('ctdata_community_profiles.id'))
    data_type = Column(String)
    year = Column(Integer)
    filters = Column(Text)

    community_profile = relationship("CommunityProfile", backref=backref('indicators', order_by=id))

    def __init__(self, profile, filters, dataset_id, data_type, year):
        self.filters = filters
        self.community_profile = profile
        self.dataset_id = dataset_id
        self.data_type = data_type
        self.year = year


class ProfileIndicatorValue(Base):
    __tablename__ = 'ctdata_profile_indicator_values'

    id = Column(Integer, primary_key=True)
    indicator_id = Column(Integer, ForeignKey('ctdata_profile_indicators.id'))
    town_id = Column(Integer, ForeignKey('ctdata_towns.fips'))
    value = Column(String)

    indicator = relationship("ProfileIndicator", backref=backref('values', order_by=id))
    town = relationship("Town", backref=backref('values', order_by=id))

    def __init__(self, indicator, town, value):
        self.indicator = indicator
        self.town = town
        self.value = value