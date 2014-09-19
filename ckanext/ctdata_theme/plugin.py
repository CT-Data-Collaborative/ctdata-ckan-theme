import json

from pylons.controllers.util import abort

import routes.mapper

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.lib.base as base
from ckan.common import response as http_response, request as http_request

import psycopg2


class Singleton(type):
    def __init__(cls, name, bases, dict):
        super(Singleton, cls).__init__(name, bases, dict)
        cls.instance = None

    def __call__(cls, *args, **kw):
        if cls.instance is None:
            cls.instance = super(Singleton, cls).__call__(*args, **kw)
        return cls.instance


class Database(object):
    __metaclass__ = Singleton

    def __init__(self):
        self.connection = None
        self.last_error = ""
        self.connection_string = ""

    def set_connection_string(self, connection_string):
        self.connection_string = connection_string

    def connect(self):
        try:
            return psycopg2.connect(self.connection_string)
        except psycopg2.Error:
            self.last_error = "Unable to connect to the database"


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
        d = Database()
        d.set_connection_string(postgres_url)

    def before_map(self, route_map):
        with routes.mapper.SubMapper(route_map, controller='ckanext.ctdata_theme.plugin:CTDataController') as m:
            m.connect('news', '/news', action='news')
            m.connect('special_projects', '/special_projects', action='special_projects')
            m.connect('data_by_topic', '/data_by_topic', action='data_by_topic')
            m.connect('visualization', '/visualization/{dataset_name}', action='visualization')
            m.connect('get_series', '/series/{dataset_name}', action='get_series')
        return route_map

    def after_map(self, route_map):
        return route_map


class CTDataController(base.BaseController):
    def news(self):
        return base.render('news.html')

    def special_projects(self):
        return base.render('special_projects.html')

    def _dict_with_key_value(self, key, value, lst):
        for dictionary in lst:
            if dictionary[key].lower() == value.lower():
                return dictionary
        return None

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
                    dmn = self._dict_with_key_value('title', domain, domains)
                    if dmn:
                        subdmn = self._dict_with_key_value('title', subdomain, dmn['subdomains'])
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
        dataset = None
        try:
            dataset = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
        except toolkit.ObjectNotFound:
            abort(404)

        return base.render('visualization.html', extra_vars={'dataset': dataset})

    def get_series(self, dataset_name):
        d = Database()

        json_body = json.loads(http_request.body, encoding=http_request.charset)
        towns = json_body['towns']

        dataset = None
        try:
            dataset = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
        except toolkit.ObjectNotFound:
            abort(404)

        default_dimensions = self._dict_with_key_value('key', 'Default Dimensions', dataset['extras'])['value']
        default_dimensions = default_dimensions.split(',')
        defaults = {}
        for dd in default_dimensions:
            defaults[dd] = self._dict_with_key_value('key', dd, dataset['extras'])['value']

        default_values = defaults.values()
        default_string = " and ".join(['t."%s" = %%s' % k for k in defaults.keys()])
        print default_string

        resource = None
        if dataset:
            for res in dataset['resources']:
                if res['format'].lower() == 'csv':
                    resource = res

        if resource:
            table_name = resource['id']
            if table_name:
                print table_name
                conn = d.connect()

                # curr = conn.cursor()
                # curr.execute('''
                #     select t."Year", t."Value", t."Town" from public."%s" t
                #     where t."Town" in (%s) and t."Grade" = 'Grade 3' and t."Subject" = 'Reading' and t."Race" = 'White'
                #     order by t."Town", t."Year"
                # ''' % (table_name, ",".join(["%s"]*len(towns))), tuple(towns))

                print '''
                    select t."Year", t."Value", t."Town" from public."%s" t
                    where t."Town" in (%s) and %s
                    order by t."Town", t."Year"
                ''' % (table_name, ",".join(["%s"]*len(towns)), default_string)
                print default_values

                curr = conn.cursor()
                curr.execute('''
                    select t."Year", t."Value", t."Town" from public."%s" t
                    where t."Town" in (%s) and %s
                    order by t."Town", t."Year"
                ''' % (table_name, ",".join(["%s"]*len(towns)), default_string), tuple(towns) + tuple(default_values))

                rows = curr.fetchall()
                print rows

                conn.commit()
                conn.close()

                response = {'data': []}

                current_series = None
                current_town = None
                longest_years_series = []
                for row in rows:
                    print row[2]
                    if row[2] != current_town:
                        current_town = row[2]
                        if current_series:
                            if len(current_series['years']) > len(longest_years_series):
                                longest_years_series = current_series['years']
                            del current_series['years']
                            response['data'].append(current_series)
                        current_series = {'town': current_town, 'years': [], 'values': []}
                    current_series['years'].append(int(row[0]))
                    current_series['values'].append(float(row[1]))
                if len(current_series['years']) > len(longest_years_series):
                    longest_years_series = current_series['years']
                del current_series['years']
                response['data'].append(current_series)

                response['years'] = longest_years_series

                http_response.headers['Content-type'] = 'application/json'

                return json.dumps(response)