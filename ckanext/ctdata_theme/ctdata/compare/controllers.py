import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, c, request as http_request
import ckan.lib.helpers as h

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..topic.services import TopicSerivce
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..location.services import LocationService
from services import CompareService

from IPython import embed
from termcolor import colored

class CompareController(base.BaseController):
    def __init__(self):
        self.compare_service = CompareService

    def admin_compare(self):
        dataset_names = toolkit.get_action('package_list')(data_dict={})
        years = self.compare_service.get_years()
        return base.render('compare/admin_compare.html', extra_vars={'dataset_names': dataset_names, 'years': years})

    def compare(self):
        datasets   = []
        domains    = []
        geo_types  = []
        dataset_names = toolkit.get_action('package_list')(data_dict={})

        for dataset_name in dataset_names:
            domain   = DatasetService.get_dataset_meta_domain(dataset_name)
            geo_type = DatasetService.get_dataset_meta_geo_type(dataset_name)

            if domain   not in domains:   domains.append(domain)
            if geo_type not in geo_types: geo_types.append(geo_type)

            datasets.append({ 'name': dataset_name, 'domain': domain, 'geo_type': geo_type })

        return base.render('compare/compare.html', extra_vars={'datasets': datasets, 'geo_types': geo_types, 'domains': domains})

    def load_comparable_dataset_data(self, dataset_name):
        data     = self.compare_service.get_comparable_dataset_data(dataset_name)
        geo_type = http_request.GET.get('geo_type')

        data['filtering_html'] = base.render('compare/snippets/filter_dataset_popup_body.html', extra_vars={'data': data, 'geo_type': geo_type})

        for dim in data['dims']:
            dim['filter_html'] = base.render('compare/snippets/dimension_filter_body.html', extra_vars={'dim': dim})

        return json.dumps({'success': True, 'dataset_data': data})

    def load_comparable_datasets(self, dataset_name):
        print colored('collect data for dataset', 'green')
        comparable, dataset_info, matches = self.compare_service.get_comparable_datasets(dataset_name)
        # main_geo_type = DatasetService.get_dataset_meta_geo_type(dataset_name)

        main_geo_type = http_request.GET.get('geo_type')

        if 'admin' in c.environ['HTTP_REFERER']:
            html = base.render('compare/snippets/table_of_matches.html', extra_vars={'comparable': comparable, 'dataset_info': dataset_info})
        else:
            html = ''
            # html = base.render('compare/snippets/dataset_matches.html', extra_vars={'comparable': comparable})
        return json.dumps({'success': True, 'html': html, 'matches': matches, 'main_geo_type': main_geo_type, 'comparable': comparable, 'dataset_info': dataset_info})

    def compare_datasets(self):
        json_data = json.loads(http_request.POST.items()[0][0])
        dataset_1 = json_data['dataset_1']
        dataset_2 = json_data['dataset_2']
        filters   = []
        matches   = []

        for data_item_1 in filter(lambda i: i['matches'] == True, dataset_1['dims_data']):
                match = {}
                data_item_2 = filter(lambda i: i['name'] == data_item_1['name'], dataset_2['dims_data'])[0]
                if data_item_2:
                    match[data_item_1['name']] = list(set(data_item_1['possible_values']).intersection(data_item_2['possible_values']))
                    matches.append(match)
                    values = list(set(data_item_1['possible_values']).intersection(data_item_2['possible_values']))
                    filters.append({'field': data_item_2['name'], 'values': values})

        for data_item_1 in filter(lambda i: i['matches'] == False, dataset_1['dims_data']):
            try:
                value = data_item_1['selected_value'] if data_item_1['selected_value'] else data_item_1['possible_values'][0]
            except KeyError:
                value = data_item_1['possible_values'][0]
            filters.append({'field': data_item_1['name'], 'values': [value]})

        for data_item_2 in filter(lambda i: i['matches'] == False, dataset_2['dims_data']):
            try:
                value = data_item_2['selected_value'] if data_item_2['selected_value'] else data_item_2['possible_values'][0]
            except KeyError:
                value = data_item_2['possible_values'][0]
            filters.append({'field': data_item_2['name'], 'values': [value]})


        data, minimum, maximum = self.compare_service.get_join_data_for_two_datasets(dataset_1['name'], dataset_2['name'], filters, matches)

        return json.dumps({'success': True, 'data': data, 'min': minimum, 'max': maximum})

    def join_for_two_datasets(self):
        json_body    = json.loads(http_request.body, encoding=http_request.charset)
        data, minimum, maximum = self.compare_service.get_join_data_for_two_datasets(json_body)

        return json.dumps({'success': True, 'data': data, 'min': minimum, 'max': maximum})

    def create_year_matches(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name or not c.userobj.sysadmin:
            abort(401)
        if http_request.method == 'POST':

            json_body = json.loads(http_request.body, encoding=http_request.charset)
            year      = json_body.get('year')
            matches   = json_body.get('year_matches')

            year = self.compare_service.create_year_matches(year, matches)
            html = base.render('compare/snippets/table_row.html', extra_vars={'year': year})

        return json.dumps({'success': True, 'html': html })

    def update_years_matches(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name or not c.userobj.sysadmin:
            abort(401)

        if http_request.method == 'POST':
            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            names_hash  = json_body.get('names_hash')
            years_to_remove  = json_body.get('years_to_remove')

            for year_id, matches in names_hash.iteritems():
                self.compare_service.udpdate_year_matches(int(year_id), matches)

            for year_id in years_to_remove:
                self.compare_service.remove_year(int(year_id))

        return json.dumps({'success': True })
