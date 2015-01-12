from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table, DateTime
from sqlalchemy.orm import relationship, backref
import datetime

import ckan.model as model
from IPython import embed
import json
import ckan.logic as logic

get_action = logic.get_action

Base = declarative_base()

class CommunityProfile(Base):
    __tablename__ = 'ctdata_community_profiles'

    id            = Column(Integer, primary_key=True)
    name          = Column(String)
    indicator_ids = Column(String)
    user_id       = Column(String, ForeignKey('ctdata_user_info.ckan_user_id'))
    default_url   = Column(String)

    def __init__(self, name, indicator_ids, user_id, default_url):
        self.name = name
        self.indicator_ids = indicator_ids
        self.user_id = user_id
        self.default_url = default_url

    def __repr__(self):
        return "Community %s %s %s %s" % (self.name, self.indicator_ids, self.user_id, self.default_url)


class Town(Base):
    __tablename__ = 'ctdata_towns'

    fips = Column(BigInteger, primary_key=True)
    name = Column(String)

    def __init__(self, fips, name):
        self.fips = fips
        self.name = name

    def __repr__(self):
        return "Town %s (%d)" % (self.name, self.fips)


#Error:
#   sqlalchemy.exc.NoReferencedTableError:
#       Foreign key associated with column 'ctdata_group_indicators.group_id' could not find table 'group'
#       with which to generate a foreign key to target column 'id'

# class GroupIndicator(Base):
#     __tablename__ = 'ctdata_group_indicators'

#     id           = Column(Integer, primary_key=True)
#     indicator_id = Column(String, ForeignKey("ctdata_profile_indicators.id"), nullable = False)
#     group_id     = Column(Text, ForeignKey('group.id'), nullable = False)

#     indicator = relationship("ProfileIndicator", backref=backref("groups", cascade="save-update, merge, "
#                                                                                         "delete, delete-orphan"))
#     group     = relationship("UserInfo", backref="indicators")

#     def __init__(self, indicator_id, group_id):
#         self.indicator_id = indicator_id
#         self.group_id = group_id

#     def __repr__(self):
#         return "Group Indicator %s (%d)" % (self.indicator_id, self.group_id)


class ProfileIndicator(Base):
    __tablename__ = 'ctdata_profile_indicators'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(String)
    is_global  = Column(Boolean)
    data_type  = Column(String)
    year       = Column(Integer)
    variable   = Column(String)
    filters    = Column(Text)
    name       = Column(String)
    ind_type   = Column(String)
    temp       = Column(Boolean)
    permission = Column(String)
    group_ids  = Column(String)
    created_at = Column(DateTime)
    visualization_type = Column(String)

    def __init__(self, name, filters, dataset_id, is_global, data_type, year, variable, temp, ind_type, visualization_type, permission, group_ids):
        self.name       = name
        self.filters    = filters
        self.dataset_id = dataset_id
        self.is_global  = is_global
        self.data_type  = data_type
        self.year       = year
        self.variable   = variable
        self.ind_type   = ind_type
        self.temp       = temp
        self.permission = permission
        self.group_ids  = group_ids
        self.visualization_type  = visualization_type
        self.created_at = datetime.datetime.now()

    def __repr__(self):
        return "[Indicator: %s; %s; %s; %s; %s; %s;]" % (self.name, self.id, self.dataset_id, self.data_type, self.year, self.permission)

    def groups(self, c):
        group_ids = self.group_ids.split(',') if self.group_ids else []
        context   = {'model': model, 'session': model.Session,
                     'user': c.user or c.author, 'for_view': True,
                     'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict, groups_dict = {}, {}

        users_groups = get_action('group_list_authz')(context, data_dict)

        return filter(lambda g: g['id'] in group_ids, users_groups)

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