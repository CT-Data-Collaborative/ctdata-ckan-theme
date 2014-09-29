import json

import ckan.plugins.toolkit as toolkit

from models import CommunityProfile, ProfileIndicator, ProfileIndicatorValue, Town
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..visualization.services import DatasetService
from ..utils import dict_with_key_value, OrderedSet


class ProfileAlreadyExists(Exception):
    pass


class CommunityProfileService(object):

    def __init__(self, session):
        self.session = session

    def get_community_profile(self, community_name):
        community = self.session.query(CommunityProfile).filter(CommunityProfile.name == community_name).first()
        if not community:
            raise toolkit.ObjectNotFound("No community with this name was found")

        return community

    def get_all_profiles(self):
        all = self.session.query(CommunityProfile).order_by(CommunityProfile.name).all()
        conn = self.session.query(CommunityProfile).filter(CommunityProfile.name == 'Connecticut').first()
        all.remove(conn)
        return [conn] + all

    def create_profile_indicator(self, filters, dataset_id):
        dataset = DatasetService.get_dataset(dataset_id)

        # check that there're currently no such indicators in the db
        # there's a JSON type for fields in postgre, so maybe there's a way to do it using SQL
        existing_inds = self.session.query(ProfileIndicator)\
            .filter(ProfileIndicator.dataset_id == dataset.ckan_meta['id'])
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
        if variable_fltr:
            variable = variable_fltr["values"][0] if "values" in variable_fltr else None

        try:
            years = int(years)
        except ValueError:
            raise toolkit.ObjectNotFound("'Year' filter value must be an integer")

        indicator = ProfileIndicator(json.dumps(filters), dataset.ckan_meta['id'], data_type, int(years),
                                     variable)
        self.session.add(indicator)

        self.session.commit()

    def get_community_indicators(self, community_name):
        community = self.get_community_profile(community_name)

        existing_towns, existing_indicators = set(), set()
        existing_values = community.values
        for val in existing_values:
            existing_towns.update([val.town])
            existing_indicators.update([val.indicator])

        all_indicators = self.session.query(ProfileIndicator).all()

        new_indicators = list(set(all_indicators) - existing_indicators)
        new_towns = list(set(community.towns) - existing_towns)

        existing_towns, existing_indicators = list(existing_towns), list(existing_indicators)

        # there may had been added new towns to the community profile or new global indicators
        # so we're adding new towns for the existing indicators
        if new_towns and existing_indicators:
            self._add_community_values(community, existing_indicators, new_towns)

        # and then adding new indicators for all the towns in the community profile
        if new_indicators:
            self._add_community_values(community, new_indicators, community.towns)

        # gather the indicators data for the frontend
        result, last_id, current_ind = [], None, None
        community_values = community.values[:]
        for val in sorted(community_values, key=lambda x: x.town.fips):
            if val.indicator.id != last_id:
                filters = filter(lambda fl: fl['field'] not in ('Town', 'Year', 'Variable', 'Measure Type'),
                                 json.loads(val.indicator.filters))
                for f in filters:
                    f['value'] = f['values'][0]
                    del f['values']
                dataset_name = DatasetService.get_dataset_meta(val.indicator.dataset_id)['title']
                current_ind = {'indicator': val.indicator, 'filters': filters, 'values': [],
                               'dataset': dataset_name}
                result.append(current_ind)
                last_id = val.indicator.id
            current_ind['values'].append(val.value)

        return community, result

    def _add_community_values(self, community, indicators, towns):
        for indicator in indicators:
            print indicator
            filters = json.loads(indicator.filters)

            dataset = DatasetService.get_dataset(indicator.dataset_id)

            qb = QueryBuilderFactory.get_query_builder('profile', dataset)
            view = ViewFactory.get_view('profile', qb)

            filters.append({'field': 'Town', 'values': map(lambda t: t.name, towns)})
            data = view.get_data(filters)

            for value, town in zip(data['data'], towns):
                val = ProfileIndicatorValue(community, indicator, town, value['data'][0])
                self.session.add(val)

        self.session.commit()

    def add_profile_town(self, community_name, towns):
        community = self.get_community_profile(community_name)
        towns_from_db = self.session.query(Town).filter(Town.name.in_(towns)).order_by(Town.fips).all()
        community.towns = list(set(community.towns) | set(towns_from_db))
        community.towns.sort(key=lambda x: x.fips)
        self.session.commit()