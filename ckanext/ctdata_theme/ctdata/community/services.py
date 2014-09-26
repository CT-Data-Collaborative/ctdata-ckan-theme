import json

import ckan.plugins.toolkit as toolkit

from models import CommunityProfile, ProfileIndicator, ProfileIndicatorValue, Town
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..visualization.services import DatasetService
from ..utils import dict_with_key_value


class CommunityProfileService(object):

    def __init__(self, session):
        self.session = session

    def get_community_profile(self, community_name):
        community = self.session.query(CommunityProfile).filter(CommunityProfile.name == community_name).first()
        if not community:
            raise toolkit.ObjectNotFound("No community with this name was found")

        return community

    def create_profile_indicator(self, community_name, filters, dataset_id):
        community = self.get_community_profile(community_name)

        dataset = DatasetService.get_dataset(dataset_id)

        qb = QueryBuilderFactory.get_query_builder('profile', dataset)
        view = ViewFactory.get_view('profile', qb)
        filters.append({'field': 'Town', 'values': map(lambda t: t.name, community.towns)})
        data = view.get_data(filters)

        indicator = ProfileIndicator(community, json.dumps(filters), dataset.ckan_meta['id'], data['data_type'],
                                     data['years'][0])
        self.session.add(indicator)

        for value in data['data']:
            for town in community.towns:
                val = ProfileIndicatorValue(indicator, town, value['data'][0])
                self.session.add(val)

        self.session.commit()

    def add_profile_town(self, community_name, towns):
        community = self.get_community_profile(community_name)
        db_towns = self.session.query(Town).filter(Town.name.in_(towns)).order_by(Town.fips).all()

        for indicator in community.indicators:
            dataset = DatasetService.get_dataset(indicator.dataset_id)
            qb = QueryBuilderFactory.get_query_builder('profile', dataset)
            view = ViewFactory.get_view('profile', qb)

            filters = json.loads(indicator.filters)
            town_fltr = dict_with_key_value('field', 'Town', filters)
            if not town_fltr:
                town_fltr = {'field': 'Town', 'values': []}
                filters.append(town_fltr)
            town_fltr['values'] = towns

            data = view.get_data(filters)

            for val, town in zip(data['data'], db_towns):
                print val
                value = ProfileIndicatorValue(indicator, town, val['data'][0])
                self.session.add(value)

        community.towns += db_towns

        self.session.commit()