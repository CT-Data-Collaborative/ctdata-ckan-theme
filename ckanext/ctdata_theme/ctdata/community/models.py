from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table
from sqlalchemy.orm import relationship, backref

Base = declarative_base()


class CommunityProfile(Base):
    __tablename__ = 'ctdata_community_profiles'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    town_id = Column(BigInteger, ForeignKey('ctdata_towns.fips'))

    town = relationship("Town", uselist=False, backref="community")

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return "Community %s" % (self.name,)


class Town(Base):
    __tablename__ = 'ctdata_towns'

    fips = Column(BigInteger, primary_key=True)
    name = Column(String)

    def __init__(self, fips, name):
        self.fips = fips
        self.name = name

    def __repr__(self):
        return "Town %s (%d)" % (self.name, self.fips)


class ProfileIndicator(Base):
    __tablename__ = 'ctdata_profile_indicators'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(String)
    is_global = Column(Boolean)
    data_type = Column(String)
    year = Column(Integer)
    variable = Column(String)
    filters = Column(Text)

    def __init__(self, filters, dataset_id, is_global, data_type, year, variable):
        self.filters = filters
        self.dataset_id = dataset_id
        self.is_global = is_global
        self.data_type = data_type
        self.year = year
        self.variable = variable

    def __repr__(self):
        return "[Indicator: %s; %s; %s;]" % (self.dataset_id, self.data_type, self.year)


class ProfileIndicatorValue(Base):
    __tablename__ = 'ctdata_profile_indicator_values'

    id = Column(Integer, primary_key=True)
    indicator_id = Column(Integer, ForeignKey('ctdata_profile_indicators.id'))
    town_id = Column(BigInteger, ForeignKey('ctdata_towns.fips'))
    value = Column(String)

    indicator = relationship("ProfileIndicator", backref=backref('values', order_by=id))
    town = relationship("Town", backref=backref('values', order_by=id))

    def __init__(self, indicator, town, value):
        self.indicator = indicator
        self.town = town
        self.value = value

    def __repr__(self):
        return "[Value: %s; %s; %s; %s]" % (self.town, self.community, self.indicator, self.value)


table_users_indicators = Table('ctdata_users_indicators', Base.metadata,
    Column('user_id', String, ForeignKey('ctdata_user_info.ckan_user_id')),
    Column('indicator_id', Integer, ForeignKey('ctdata_profile_indicators.id'))
)


class UserInfo(Base):
    __tablename__ = 'ctdata_user_info'

    ckan_user_id = Column(String, primary_key=True)
    is_admin = Column(Boolean)
    indicators = relationship("ProfileIndicator", secondary=lambda: table_users_indicators)

    def __init__(self, ckan_user_id, is_admin=False):
        self.ckan_user_id = ckan_user_id
        self.is_admin = is_admin

    def __repr__(self):
        str_repr = "User: %s" % self.ckan_user_id
        str_repr += " (admin)" if self.is_admin else ""
        return str_repr