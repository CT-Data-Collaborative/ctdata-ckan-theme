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

    def get_all_towns(self):
        return self.session.query(Town).order_by(Town.name).all()

    def get_all_profiles(self):
        all = self.session.query(CommunityProfile).order_by(CommunityProfile.name).all()
        conn = self.session.query(CommunityProfile).filter(CommunityProfile.name == 'Connecticut').first()
        all.remove(conn)
        return [conn] + all

    def create_profile_indicator(self, filters, dataset_id, owner=None):
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
        variable = ''
        if variable_fltr:
            variable = variable_fltr["values"][0] if "values" in variable_fltr else None

        try:
            years = int(years)
        except ValueError:
            raise toolkit.ObjectNotFound("'Year' filter value must be an integer")

        # TODO: check owner's priviligies there, when adding support for global indicators
        is_global = False if owner else True
        indicator = ProfileIndicator(json.dumps(filters), dataset.ckan_meta['id'], is_global, data_type, int(years),
                                     variable)
        owner.indicators.append(indicator)
        self.session.add(indicator)

        self.session.commit()

    def get_indicators(self, community_name, towns_names):
        community = self.get_community_profile(community_name)
        print community.town

        towns = set()
        if towns_names:
            towns.update(self.session.query(Town).filter(Town.name.in_(set(towns_names))).all())
        towns.update([community.town])
        towns_fipses = map(lambda x: x.fips, list(towns))
        print towns

        existing_towns, existing_indicators = set(), set()
        existing_values = self.session.query(ProfileIndicatorValue).\
            filter(ProfileIndicatorValue.town_id.in_(towns_fipses)).all()
        for val in existing_values:
            existing_towns.update([val.town])
            existing_indicators.update([val.indicator])

        all_indicators = self.session.query(ProfileIndicator).all()

        new_indicators = list(set(all_indicators) - existing_indicators)
        new_towns = list(towns - existing_towns)

        # convert sets back to lists
        existing_towns, existing_indicators, towns = list(existing_towns), list(existing_indicators), list(towns)

        # values for the requested towns may not have been added to the db yet
        if new_towns and existing_indicators:
            self._add_indicator_values(existing_indicators, new_towns)

        # also there may had been added indicators
        # adding values for those also
        if new_indicators:
            self._add_indicator_values(new_indicators, towns)

        # TODO: following code should be extracted somewhere, service should only return the data and some other entity
        # (controller?) should convert it for views to use.

        # gather the indicators data for the frontend
        result, last_id, current_ind = [], None, None
        indicators_values = self.session.query(ProfileIndicatorValue).\
            filter(ProfileIndicatorValue.town_id.in_(towns_fipses)).\
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
                               'dataset': dataset_name}
                result.append(current_ind)
                last_id = val.indicator.id
            current_ind['values'].append(val.value)

        towns.sort(key=lambda t: t.fips)

        return community, result, towns

    def _add_indicator_values(self, indicators, towns):
        for indicator in indicators:
            filters = json.loads(indicator.filters)

            dataset = DatasetService.get_dataset(indicator.dataset_id)

            # Chart query builder suits Profile view just fine
            qb = QueryBuilderFactory.get_query_builder('chart', dataset)
            view = ViewFactory.get_view('profile', qb)

            filters.append({'field': 'Town', 'values': map(lambda t: t.name, towns)})
            data = view.get_data(filters)

            for value, town in zip(data['data'], sorted(towns, key=lambda x: x.name)):
                print value, town
                val = ProfileIndicatorValue(indicator, town, value['data'][0])
                self.session.add(val)

        self.session.commit()