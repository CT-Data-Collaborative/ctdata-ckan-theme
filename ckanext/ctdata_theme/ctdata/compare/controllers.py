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
        dataset_names = toolkit.get_action('package_list')(data_dict={})
        return base.render('compare/compare.html', extra_vars={'dataset_names': dataset_names})

    def load_comparable_datasets(self, dataset_name):
        comparable, dataset_info, matches = self.compare_service.get_comparable_datasets(dataset_name)
        main_geo_type = DatasetService.get_dataset_meta_geo_type(dataset_name)

        if 'admin' in c.environ['HTTP_REFERER']:
            html = base.render('compare/snippets/table_of_matches.html', extra_vars={'comparable': comparable, 'dataset_info': dataset_info})
        else:
            html = base.render('compare/snippets/dataset_matches.html', extra_vars={'comparable': comparable})
        return json.dumps({'success': True, 'html': html, 'matches': matches, 'main_geo_type': main_geo_type, 'comparable': comparable})

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
