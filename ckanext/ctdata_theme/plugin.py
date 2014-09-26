import json

from pylons.controllers.util import abort

import routes.mapper

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.lib.base as base
from ckan.common import response as http_response, request as http_request

from ctdata.database import Database
from ctdata.visualization.datasets import DatasetFactory
from ctdata.visualization.querybuilders import QueryBuilderFactory
from ctdata.visualization.views import ViewFactory
from ctdata.utils import dict_with_key_value


class CTDataThemePlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IConfigurable)
    plugins.implements(plugins.IRoutes)

    def update_config(self, config):
        toolkit.add_template_directory(config, 'templates')
        toolkit.add_public_directory(config, 'public')
        toolkit.add_resource('fanstatic', 'ctdata_theme')

    def configure(self, config):
        postgres_url = config['ckan.datastore.write_url']
        db = Database()
        db.set_connection_string(postgres_url)

        db.init_sa(config['sqlalchemy.url'])

    def before_map(self, route_map):
        with routes.mapper.SubMapper(route_map, controller='ckanext.ctdata_theme.plugin:CTDataController') as m:
            m.connect('news', '/news', action='news')
            m.connect('special_projects', '/special_projects', action='special_projects')
            m.connect('data_by_topic', '/data_by_topic', action='data_by_topic')
            m.connect('visualization', '/visualization/{dataset_name}', action='visualization')
            m.connect('get_data', '/data/{dataset_name}', action='get_data')
        return route_map

    def after_map(self, route_map):
        return route_map


class CTDataController(base.BaseController):
    def news(self):
        return base.render('news.html')

    def special_projects(self):
        return base.render('special_projects.html')

    def data_by_topic(self):
        dataset_names = toolkit.get_action('package_list')(data_dict={})

        domains = [{'title': 'Civic Vitality', 'subdomains': [], 'id': 'civic_vitality'},
                   {'title': 'Demographics', 'subdomains': [], 'id': 'demographics'},
                   {'title': 'Economy', 'subdomains': [], 'id': 'economy'},
                   {'title': 'Health', 'subdomains': [], 'id': 'health'},
                   {'title': 'Education', 'subdomains': [], 'id': 'education'},
                   {'title': 'Housing', 'subdomains': [], 'id': 'housing'},
                   {'title': 'Safety', 'subdomains': [], 'id': 'safety'}]

        for dataset_name in dataset_names:
            dataset = toolkit.get_action('package_show')(data_dict={'id': dataset_name})

            if len(dataset['extras']) > 0:
                domain, subdomain = None, None
                for extra in dataset['extras']:
                    if extra['key'].lower() == 'domain':
                        domain = extra['value']
                    if extra['key'].lower() == 'subdomain':
                        subdomain = extra['value']

                if domain and subdomain:
                    dataset_obj = {'name': dataset['name'], 'title': dataset['title']}
                    dmn = dict_with_key_value('title', domain, domains)
                    if dmn:
                        subdmn = dict_with_key_value('title', subdomain, dmn['subdomains'])
                        if subdmn:
                            subdmn['datasets'].append(dataset_obj)
                        else:
                            dmn['subdomains'].append({'title': subdomain, 'datasets': [dataset_obj]})
                    else:
                        domains.append({'title': domain,
                                        'subdomains': [{'title': subdomain, 'datasets': [dataset_obj]}],
                                        'id': "_".join(map(lambda x: x.lower(), domain.split(" ")))})

        domains.sort(key=lambda x: x['title'])

        for domain in domains:
            domain['subdomains'].sort(key=lambda x: x['title'])

        return base.render('data_by_topic.html', extra_vars={'domains': domains})

    def visualization(self, dataset_name):
        try:
            dataset = DatasetFactory.get_dataset(dataset_name)
        except toolkit.ObjectNotFound:
            abort(404)
     
        return base.render('visualization.html', extra_vars={'dataset': dataset, 'dimensions': dataset.dimensions})

    def get_data(self, dataset_name):
        json_body = json.loads(http_request.body, encoding=http_request.charset)
        request_view, request_filters = json_body.get('view'), json_body.get('filters')

        if not request_view or not request_filters:
            abort(400, detail='No view and/or filters specified')

        if not request_view in ('map', 'chart', 'table'):
            abort(400, detail='No such view')

        try:
            dataset = DatasetFactory.get_dataset(dataset_name)
        except toolkit.ObjectNotFound:
            abort(404)

        query_builder = QueryBuilderFactory.get_query_builder(request_view, dataset)
        view = ViewFactory.get_view(request_view, query_builder)

        data = view.get_data(request_filters)
        print data

        http_response.headers['Content-type'] = 'application/json'

        return json.dumps(data)
