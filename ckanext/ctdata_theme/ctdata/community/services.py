import json
import datetime

from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError

import ckan.plugins.toolkit as toolkit

from models import CommunityProfile, ProfileIndicator, ProfileIndicatorValue, Town, UserIndicatorLink
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..visualization.services import DatasetService
from ..utils import dict_with_key_value, OrderedSet
from IPython import embed

class ProfileAlreadyExists(Exception):
    pass


class CantDeletePrivateIndicator(Exception):
    pass


class CommunityProfileService(object):

    def __init__(self, session):
        self.session = session

    ################ TOWNS ############################################

    def get_town(self, town_name):
        town = self.session.query(Town).filter(Town.name == town_name).first()
        if not town:
            raise toolkit.ObjectNotFound("No town with this name was found")
        return town

    def get_all_towns(self):
        return self.session.query(Town).order_by(Town.name).all()


    def get_towns_by_names(self, town_names):
        return self.session.query(Town).filter(Town.name.in_(set(towns_names))).all()

    ################ COMMUNITY PROFILES #################################

    def get_all_profiles(self):
        all = self.session.query(CommunityProfile).order_by(CommunityProfile.name).all()
        conn = self.session.query(CommunityProfile).filter(CommunityProfile.name == 'Connecticut').first()
        all.remove(conn)
        return [conn] + all

    def get_community_profile(self, community_name):
        community = self.session.query(CommunityProfile).filter(CommunityProfile.name == community_name).first()
        if not community:
            raise toolkit.ObjectNotFound("No community with this name was found")

        return community

    def get_community_profile_by_id(self, community_id):
        community = self.session.query(CommunityProfile).get(community_id)
        if not community:
            raise toolkit.ObjectNotFound("No community with this id was found")

        return community

    def create_community_profile(self, name, indicator_ids, user_id, default_url):
        new_profile = CommunityProfile(name, str(indicator_ids), user_id, default_url)
        self.session.add(new_profile)

        ### update indicators temp column to True
        temp_indicators = self.get_temp_user_indicators(map(int,indicator_ids.split(',')))
        for indicator in temp_indicators:
            indicator.temp = False

        self.session.commit()
        new_profile.default_url += '?p=' + str(new_profile.id)
        self.session.commit()
        return new_profile

    def update_community_profile_name(self, community_id, name, user_id ):
        community = self.session.query(CommunityProfile).get(community_id)
        if community and community.user_id == user_id:
            community.name = name
            self.session.commit()

    def remove_community_profile(self, community_id, user_id ):
        community = self.session.query(CommunityProfile).get(community_id)
        if community.user_id == user_id:
            self.session.delete(community)
            self.session.commit()

    def get_town(self, town_name):
        town = self.session.query(Town).filter(Town.name == town_name).first()
        if not town:
            raise toolkit.ObjectNotFound("No town with this name was found")

        return town

    def get_all_towns(self):
        return self.session.query(Town).order_by(Town.name).all()


    def get_all_profiles(self):
        all = self.session.query(CommunityProfile).order_by(CommunityProfile.name).all()
        conn = self.session.query(CommunityProfile).filter(CommunityProfile.name == 'Connecticut').first()
        all.remove(conn)
        return [conn] + all

    ##### Public community profiles that were made from towns names by system.
    def get_profiles_for_data_by_location(self):
        towns = self.get_all_towns()
        towns_names = map(lambda val: val.name, towns)
        all = self.session.query(CommunityProfile).filter(CommunityProfile.name.in_(towns_names)).order_by(CommunityProfile.name).all()
        conn = self.session.query(CommunityProfile).filter(CommunityProfile.name == 'Connecticut').first()
        all.remove(conn)
        return [conn] + all

    def get_user_profiles(self, user_id):
        profiles = self.session.query(CommunityProfile).filter(CommunityProfile.user_id == user_id).all()
        return profiles

    ################ PROFILE INDICATORS #################################

    def remove_temp_user_indicators(self, indicator_ids):
        temp_indicators = self.get_temp_user_indicators(map(int,indicator_ids.split(',')))
        for indicator in temp_indicators:
            self.session.delete(indicator)

        self.session.commit()

    def create_indicator(self, name, filters, dataset_id, owner, headline):
        # assert owner is not None, "User must be passed in order for indicator creation to work"

        dataset = DatasetService.get_dataset(dataset_id)

        user_indicators_id = self.session.query(UserIndicatorLink.indicator_id)\
            .filter(and_(UserIndicatorLink.user_id == owner.ckan_user_id,
                         UserIndicatorLink.deleted == False)).all()
        existing_inds = self.session.query(ProfileIndicator)\
            .filter(and_(ProfileIndicator.dataset_id == dataset.ckan_meta['id'],
                         ProfileIndicator.id.in_(user_indicators_id)))

        # check that there're currently no such indicators in the db
        # there's a JSON type for fields in postgre, so maybe there's a way to do it using SQL
        for ex_ind in existing_inds:
            ex_fltrs = json.loads(ex_ind.filters)
            # python allows us to compare lists of dicts
            if sorted(filters) == sorted(ex_fltrs):
                raise ProfileAlreadyExists("Profile with such dataset and filters already exists")
        try:
            data_type = dict_with_key_value("field", "Measure Type", filters)['values'][0]
            years = dict_with_key_value("field", "Year", filters)['values'][0]
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

        is_global = False
        temp      = False if headline else True
        indicator = ProfileIndicator(name, json.dumps(filters), dataset.ckan_meta['id'], is_global, data_type, int(years),
                                     variable, headline, temp)
        owner.indicators.append(indicator)

        self.session.add(indicator)

    def remove_indicator_id_from_profiles(self, indicator_id):
        community_profiles = self.get_all_profiles()

        for profile in community_profiles:
            if profile.indicator_ids != None:
                ids = profile.indicator_ids.split(',')
                if str(indicator_id) in ids:
                    ids.remove(str(indicator_id))
                profile.indicator_ids =  ','.join(str(x) for x in ids)

        self.session.commit()

    def update_indicator_name(self, indicator_id, name):
        ind = self.session.query(ProfileIndicator).get(indicator_id)
        ind.name = name

        self.session.commit()

    def remove_indicator(self, user, indicator_id):
        # in case someone accidentally forgot to pass a valid user object
        assert user is not None, "User must be passed in order for indicator removal to work"
        ind = self.session.query(ProfileIndicator).get(indicator_id)

        if ind and user.is_admin and ind.headline:
            self.session.delete(ind)
            self.remove_indicator_id_from_profiles(ind.id)

        if ind:
            if ind.is_global:
                # users don't actually remove global indicators, but only mark them as removed
                link = self.session.query(UserIndicatorLink).\
                    filter(and_(UserIndicatorLink.indicator_id == indicator_id,
                                UserIndicatorLink.user_id == user.ckan_user_id)).first()
                if link:
                    link.deleted = True
            else:
                if not ind in user.indicators:
                    # regular user tries to delete someone else's indicator
                    raise CantDeletePrivateIndicator("The indicator you're trying to delete is not yours")

                # regular users can permanently delete their own indicators
                self.session.delete(ind)
                self.remove_indicator_id_from_profiles(ind.id)
        else:
            raise toolkit.ObjectNotFound("Indicator not found")

    def get_headline_indicators_for_dataset(self, dataset_id):
        indicators = self.session.query(ProfileIndicator).filter(and_(ProfileIndicator.headline == True,
                                                                      ProfileIndicator.dataset_id == dataset_id)).all()
        return indicators

    def get_indicators_by_ids(self, ids):
        indicators = self.session.query(ProfileIndicator).filter(ProfileIndicator.id.in_(ids)).all()
        return indicators

    def get_default_indicators(self):
        indicators = self.session.query(ProfileIndicator).filter(ProfileIndicator.is_global == True).all()
        return indicators

    def get_temp_user_indicators(self, ids):
        indicators = self.session.query(ProfileIndicator).filter(and_(ProfileIndicator.temp == True,
                                                                    ProfileIndicator.id.in_(ids))).all()
        return indicators

    def get_indicators(self, community, towns_names, location, user=None):
        location  = self.get_town(location)
        towns, existing_towns, existing_indicators = set([location]), set(), set()

        ####### load all needed towns
        if towns_names:
            towns.update(self.get_towns_by_names(towns_names))
        towns_fipses = map(lambda x: x.fips, list(towns))

        ####### load user or community indicators and values
        indicators_filter, existing_values = self._indicators_filter(community, user, towns_fipses )

        ####### fill existing_values towns and existing_indicators
        for val in existing_values:
            existing_towns.update([val.town])
            existing_indicators.update([val.indicator])

        #######  load all indicators:  user or community indicators + default
        if user and user.is_admin:
            all_indicators = self.session.query(ProfileIndicator).filter(ProfileIndicator.id.in_(indicators_filter)).all()
        else:
            all_indicators = self.session.query(ProfileIndicator).filter(or_(ProfileIndicator.id.in_(indicators_filter),
                                                                         ProfileIndicator.is_global == True)).all()
        new_indicators = list(set(all_indicators) - existing_indicators)
        new_towns      = list(towns - existing_towns)

        ####### add new global indicators to the list of user's indicators
        if user:
            user.indicators += filter(lambda ind: ind.is_global, new_indicators)
        existing_towns, existing_indicators, towns = list(existing_towns), list(existing_indicators), list(towns)

        ####### values for the requested towns may not have been added to the db yet
        if new_towns and existing_indicators:
            self._add_indicator_values(existing_indicators, new_towns)

        ######## also there may had been added indicators adding values for those also
        if new_indicators:
            self._add_indicator_values(new_indicators, towns)

        ######### gather the indicators data for the frontend
        result, last_id, current_ind = [], None, None
        user_indicators              = indicators_filter

        ######## hide indicators that was marked as deleted if user on default community profile
        if community.name == location.name and not user.is_admin:
            user_indicators = self.session.query(UserIndicatorLink.indicator_id).\
                filter(and_(UserIndicatorLink.user_id == user.ckan_user_id,
                            UserIndicatorLink.deleted == False))

        ######## finaly load needed values
        indicators_values = self.session.query(ProfileIndicatorValue).\
            filter(and_(ProfileIndicatorValue.town_id.in_(towns_fipses),
                        ProfileIndicatorValue.indicator_id.in_(user_indicators))).\
            order_by(ProfileIndicatorValue.indicator_id, ProfileIndicatorValue.town_id).all()

        ######## add empty indicator values if no value for some town
        self._add_empty_indicator_values(indicators_values, existing_towns)

        ######## create hash with RESULT
        for val in indicators_values:
            if val.indicator.id != last_id:
                filters = filter(lambda fl: fl['field'] not in ('Town', 'Year', 'Variable', 'Measure Type'),
                                 json.loads(val.indicator.filters))
                for f in filters:
                    f['value'] = f['values'][0]
                    del f['values']
                dataset_name = DatasetService.get_dataset_meta(val.indicator.dataset_id)['title']
                current_ind = {'indicator': val.indicator, 'filters': filters, 'values': [],
                               'dataset': dataset_name, 'is_global': val.indicator.is_global, 'temp': val.indicator.temp}
                result.append(current_ind)
                last_id = val.indicator.id
            current_ind['values'].append(val.value)


        towns.sort(key=lambda t: t.fips)

        return result, towns

    def _indicators_filter(self,community, user, towns_fipses):
        if community.indicator_ids != None and community.indicator_ids != '':
            ######## load indicators from community (case when location != community name)
            indicator_ids = community.indicator_ids.split(',')
            if indicator_ids[-1] == '':
                indicator_ids.pop(-1)

            indicators_filter = map(lambda x: x.id, self.get_indicators_by_ids(indicator_ids))
        else:
            ######## load user indicators or default
            if user:
                indicator_ids     = map(lambda ind: ind.id, user.indicators)
                deleted = self.session.query(UserIndicatorLink.indicator_id).\
                    filter(and_(UserIndicatorLink.user_id == user.ckan_user_id,
                            UserIndicatorLink.deleted == True)).all()

                deleted = map(lambda x: x[0], deleted)
                if deleted !=[]:
                    indicator_ids = list(set(indicator_ids) - set(deleted))
                indicators_filter = map(lambda x: x.id, self.get_indicators_by_ids(indicator_ids))
            else:
                indicators_filter = map(lambda x: x.id, self.get_default_indicators())

        existing_values = self.session.query(ProfileIndicatorValue).\
                filter(and_(ProfileIndicatorValue.town_id.in_(towns_fipses),
                    ProfileIndicatorValue.indicator_id.in_(indicators_filter))).all()

        return indicators_filter, existing_values

    def _add_indicator_values(self, indicators, towns):
        for indicator in indicators:
            filters = json.loads(indicator.filters)
            dataset = DatasetService.get_dataset(indicator.dataset_id)
            qb      = QueryBuilderFactory.get_query_builder('profile', dataset)
            view    = ViewFactory.get_view('profile', qb)

            filters.append({'field': 'Town', 'values': map(lambda t: t.name, towns)})
            data         = view.get_data(filters)
            town_ind_ids = map(lambda v: (v.town_id, v.indicator_id), indicator.values)

            for value, town in zip(data['data'], sorted(towns, key=lambda x: x.name)):
                if not (town.fips, indicator.id) in town_ind_ids:
                    self.session.add(ProfileIndicatorValue(indicator, town, value['data'][0]))

    def _add_empty_indicator_values(self,indicators_values, existing_towns):
        towns_inds_hash = map(lambda val: {val.town: val.indicator}, indicators_values)
        inds = map(lambda val: val.indicator, indicators_values)
        inds = list(set(inds))

        for town in existing_towns:
            for ind in inds:
                h = {}
                h[town] = ind
                try:
                    towns_inds_hash.index(h)
                except ValueError:
                    new_item = ProfileIndicatorValue(ind,town, None)
                    self.session.add(new_item)
                    indicators_values.append(new_item)
