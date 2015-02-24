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
    description        = Column(Text)

    def __init__(self, name, filters, dataset_id, data_type, year, variable, ind_type, visualization_type, permission, description, group_ids):
        self.name       = name
        self.filters    = filters
        self.dataset_id = dataset_id
        # self.is_global  = is_global
        self.data_type  = data_type
        self.year       = year
        self.variable   = variable
        self.ind_type   = ind_type
        # self.temp       = temp
        self.permission = permission
        self.group_ids  = group_ids
        self.visualization_type  = visualization_type
        self.description  = description
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

    def dataset_name(self):
        return get_action('package_show')(data_dict={'id': self.dataset_id})['title']

    def link_to_visualization(self):
        view = self.visualization_type or 'table'
        location = ''
        filters_hash = {}

        filters = map(lambda fl: filters_hash.update( {fl['field']: (fl['values'][0] if len(fl['values']) == 1 else fl['values'])}),
                                     json.loads(self.filters))

        dataset = get_action('package_show')(data_dict={'id': self.dataset_id})['title']
        dataset_url  = dataset.replace(' ', '-').replace("'", '').lower()

        link_params  =  "?v=" + view + "&f=" + json.dumps(filters_hash)
        link         = "/visualization/" + str(dataset_url) + link_params

        return link

    def user_id(self):
        ckan_user_id = model.Session.query(UserIndicatorLink.user_id).filter(UserIndicatorLink.indicator_id == self.id).first()
        return ckan_user_id[0]

    def user_name(self):
        ckan_user_id = model.Session.query(UserIndicatorLink.user_id).filter(UserIndicatorLink.indicator_id == self.id).first()
        user = model.User.get(ckan_user_id[0])
        return user.name

class ProfileIndicatorValue(Base):
    __tablename__ = 'ctdata_profile_indicator_values'

    id           = Column(Integer, primary_key=True)
    indicator_id = Column(Integer, ForeignKey('ctdata_profile_indicators.id'))
    town_id      = Column(BigInteger, ForeignKey('ctdata_towns.fips'))
    value        = Column(String)

    town         = relationship("Town", backref=backref('values'))
    indicator    = relationship("ProfileIndicator", backref=backref('values', cascade="save-update, merge, "
                                                                                   "delete, delete-orphan"))

    def __init__(self, indicator, town, value):
        self.indicator = indicator
        self.town = town
        self.value = value

    def __repr__(self):
        return "[Value: %s; %s; %s;]" % (self.town, self.indicator, self.value)


class UserIndicatorLink(Base):
    __tablename__ = 'ctdata_users_indicators'

    id           = Column(Integer, primary_key=True)
    user_id      = Column(String, ForeignKey('ctdata_user_info.ckan_user_id'))
    indicator_id = Column(Integer, ForeignKey('ctdata_profile_indicators.id'))
    deleted      = Column(Boolean, default=False)

    user         = relationship("UserInfo", backref="indicators_links")
    indicator    = relationship("ProfileIndicator", backref=backref("users_links", cascade="save-update, merge, "
                                                                                        "delete, delete-orphan"))

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