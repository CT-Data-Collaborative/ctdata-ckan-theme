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


class ProfileAlreadyExists(Exception):
    pass


class CantDeletePrivateIndicator(Exception):
    pass


class CommunityProfileService(object):

    def __init__(self, session):
        self.session = session

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

    def remove_temp_user_indicators(self, indicator_ids):
        temp_indicators = self.get_temp_user_indicators(map(int,indicator_ids.split(',')))
        for indicator in temp_indicators:
            self.session.delete(indicator)

        self.session.commit()

    def create_community_profile(self, name, indicator_ids, user_id, default_url):
        new_profile = CommunityProfile(name, str(indicator_ids), user_id, default_url)
        self.session.add(new_profile)

        ### update indicators temp color to True
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


    def get_user_profiles(self, user_id):
        profiles = self.session.query(CommunityProfile).filter(CommunityProfile.user_id == user_id).all()
        return profiles

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
        if ind:
            if ind.is_global or ind.headline:
                if user.is_admin:
                    # admins remove global indicators permanently and from all users
                    self.session.delete(ind)
                    self.remove_indicator_id_from_profiles(ind.id)
                else:
                    # regular users don't actually remove global indicators, but only mark them as removed so we're able
                    # not to show those indicators to them
                    print indicator_id, user.ckan_user_id
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

        towns = set()
        if towns_names:
            towns.update(self.session.query(Town).filter(Town.name.in_(set(towns_names))).all())
        towns.update([location])
        towns_fipses = map(lambda x: x.fips, list(towns))

        existing_towns, existing_indicators = set(), set()

        if community.indicator_ids != None and community.indicator_ids != '':
            indicator_ids = community.indicator_ids.split(',')
            if indicator_ids[-1] == '':
                indicator_ids.pop(-1)

            indicators_filter = map(lambda x: x.id, self.get_indicators_by_ids(indicator_ids))
        else:
            if user:
                indicator_ids     = map(lambda ind: ind.id, user.indicators)
                indicators_filter = map(lambda x: x.id, self.get_indicators_by_ids(indicator_ids))
            else:
                indicators_filter = map(lambda x: x.id, self.get_default_indicators())


        existing_values = self.session.query(ProfileIndicatorValue).\
            filter(and_(ProfileIndicatorValue.town_id.in_(towns_fipses),
                ProfileIndicatorValue.indicator_id.in_(indicators_filter))).all()
        for val in existing_values:
            existing_towns.update([val.town])
            existing_indicators.update([val.indicator])


        all_indicators = self.session.query(ProfileIndicator).filter(or_(ProfileIndicator.id.in_(indicators_filter),
                                                                         ProfileIndicator.is_global == True)).all()

        new_indicators = list(set(all_indicators) - existing_indicators)
        new_towns = list(towns - existing_towns)

        if user :
            # add new global indicators to the list of user's indicators
            user.indicators += filter(lambda ind: ind.is_global, new_indicators)

        # convert sets back to lists
        existing_towns, existing_indicators, towns = list(existing_towns), list(existing_indicators), list(towns)

        # values for the requested towns may not have been added to the db yet
        if new_towns and existing_indicators:
            self._add_indicator_values(existing_indicators, new_towns)

        # also there may had been added indicators
        # adding values for those also
        if new_indicators:
            self._add_indicator_values(new_indicators, towns)

        # gather the indicators data for the frontend
        result, last_id, current_ind = [], None, None

        user_indicators = indicators_filter

        # if user and not user.is_admin and community.name == location.name:
        if user and community.name == location.name:
            user_indicators = self.session.query(UserIndicatorLink.indicator_id).\
                filter(and_(UserIndicatorLink.user_id == user.ckan_user_id,
                            UserIndicatorLink.deleted == False))

        indicators_values = self.session.query(ProfileIndicatorValue).\
            filter(and_(ProfileIndicatorValue.town_id.in_(towns_fipses),
                        ProfileIndicatorValue.indicator_id.in_(user_indicators))).\
            order_by(ProfileIndicatorValue.indicator_id, ProfileIndicatorValue.town_id).all()

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

            ######  show None if no value for some town/indicator colunm
            if len(current_ind['values']) < len(existing_towns):
                size = len(existing_towns) - len(current_ind['values'])
                indicators_values + [None] * size

        towns.sort(key=lambda t: t.fips)

        return result, towns

    def _add_indicator_values(self, indicators, towns):
        for indicator in indicators:
            filters = json.loads(indicator.filters)

            dataset = DatasetService.get_dataset(indicator.dataset_id)

            qb = QueryBuilderFactory.get_query_builder('profile', dataset)
            view = ViewFactory.get_view('profile', qb)

            filters.append({'field': 'Town', 'values': map(lambda t: t.name, towns)})
            data = view.get_data(filters)

            town_ind_ids = map(lambda v: (v.town_id, v.indicator_id), indicator.values)

            for value, town in zip(data['data'], sorted(towns, key=lambda x: x.name)):
                if not (town.fips, indicator.id) in town_ind_ids:
                    self.session.add(ProfileIndicatorValue(indicator, town, value['data'][0]))