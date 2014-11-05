from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table
from sqlalchemy.orm import relationship, backref

Base = declarative_base()


class CommunityProfile(Base):
    __tablename__ = 'ctdata_community_profiles'

    id            = Column(Integer, primary_key=True)
    name          = Column(String)
    indicator_ids = Column(String)

    def __init__(self, name, indicator_ids):
        self.name = name
        self.indicator_ids = indicator_ids

    def __repr__(self):
        return "Community %s %s" % (self.name, self.indicator_ids)


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
        return "[Indicator: %s; %s; %s; %s;]" % (self.id, self.dataset_id, self.data_type, self.year)


class ProfileIndicatorValue(Base):
    __tablename__ = 'ctdata_profile_indicator_values'

    id = Column(Integer, primary_key=True)
    indicator_id = Column(Integer, ForeignKey('ctdata_profile_indicators.id'))
    town_id = Column(BigInteger, ForeignKey('ctdata_towns.fips'))
    value = Column(String)

    indicator = relationship("ProfileIndicator", backref=backref('values', cascade="save-update, merge, "
                                                                                   "delete, delete-orphan"))
    town = relationship("Town", backref=backref('values'))

    def __init__(self, indicator, town, value):
        self.indicator = indicator
        self.town = town
        self.value = value

    def __repr__(self):
        return "[Value: %s; %s; %s;]" % (self.town, self.indicator, self.value)


class UserIndicatorLink(Base):
    __tablename__ = 'ctdata_users_indicators'

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey('ctdata_user_info.ckan_user_id'))
    indicator_id = Column(Integer, ForeignKey('ctdata_profile_indicators.id'))
    deleted = Column(Boolean, default=False)

    indicator = relationship("ProfileIndicator", backref=backref("users_links", cascade="save-update, merge, "
                                                                                        "delete, delete-orphan"))
    user = relationship("UserInfo", backref="indicators_links")

    def __init__(self, indicator=None, user=None, deleted=False):
        self.indicator = indicator
        self.user = user
        self.deleted = deleted


class UserInfo(Base):
    __tablename__ = 'ctdata_user_info'

    ckan_user_id = Column(String, primary_key=True)
    is_admin = Column(Boolean)

    indicators = association_proxy("indicators_links", "indicator")

    def __init__(self, ckan_user_id, is_admin=False):
        self.ckan_user_id = ckan_user_id
        self.is_admin = is_admin

    def __repr__(self):
        str_repr = "User: %s" % self.ckan_user_id
        str_repr += " (admin)" if self.is_admin else ""
        return str_repr