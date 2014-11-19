import json
import yaml
import ast

from pylons.controllers.util import abort

import routes.mapper

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.lib.base as base
from ckan.common import response as http_response, request as http_request

from ctdata.database import Database
from ctdata.visualization.services import DatasetService
from ctdata.visualization.querybuilders import QueryBuilderFactory
from ctdata.visualization.views import ViewFactory
from ctdata.community.services import CommunityProfileService
from ctdata.topic.services import TopicSerivce
from ctdata.users.services import UserService


def communities():
    db = Database()
    sess = db.session_factory()

    srvc = CommunityProfileService(sess)
    communities = srvc.get_all_profiles()

    sess.commit()
    return communities


class CTDataThemePlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IConfigurable)
    plugins.implements(plugins.IRoutes)
    plugins.implements(plugins.ITemplateHelpers)

    def update_config(self, config):
        toolkit.add_template_directory(config, 'templates')
        toolkit.add_public_directory(config, 'public')
        toolkit.add_resource('fanstatic', 'ctdata_theme')

    def configure(self, config):
        db = Database()
        db.set_connection_string(config['ckan.datastore.write_url'])

        db.init_sa(config['sqlalchemy.url'])
        db.init_community_data(config['ctdata.communities_source'])

    def before_map(self, route_map):
        with routes.mapper.SubMapper(route_map, controller='ckanext.ctdata_theme.plugin:CTDataController') as m:
            m.connect('news', '/news', action='news')
            m.connect('special_projects', '/special_projects', action='special_projects')
            m.connect('data_by_topic', '/data_by_topic', action='data_by_topic')
            m.connect('visualization', '/visualization/{dataset_name}', action='visualization')
            m.connect('get_vizualization_data', '/vizualization_data/{dataset_name}', action='get_vizualization_data')
            m.connect('dataset_update_indicators', '/dataset/{dataset_name}/update_indicators', action='update_indicators')

        with routes.mapper.SubMapper(
                route_map,
                controller='ckanext.ctdata_theme.ctdata.community.controllers:CommunityProfilesController') as m:
            m.connect('community_get_filters', '/community/get_filters/{dataset_id}', action='get_filters')
            m.connect('community_add_indicator', '/community/add_indicator', action='add_indicator')
            m.connect('community_add_profile', '/community/add_profile', action='add_profile')
            m.connect('community_save_as_default', '/community/save_as_default', action='save_as_default')
            m.connect('community_remove_indicator',
                      '/community/remove_indicator/{indicator_id}',
                      action='remove_indicator')
            m.connect('community_profiles', '/community/{community_name}', action='community_profile')

        with routes.mapper.SubMapper(
                route_map,
                controller='ckanext.ctdata_theme.ctdata.users.controllers:UserController') as m:
            m.connect('user_community_profiles', '/user/{user_id}/my_community_profiles', action='community_profiles')
            m.connect('update_community_profiles', '/user/update_community_profiles', action='update_community_profiles')

        with routes.mapper.SubMapper(
                route_map,
                controller='ckanext.ctdata_theme.ctdata.pages.controllers:PageController') as m:
            m.connect('page_about', '/pages/about', action='about')
            m.connect('page_news', '/pages/news', action='news')
            # m.connect('update_community_profiles', '/user/update_community_profiles', action='update_community_profiles')

        return route_map

    def after_map(self, route_map):
        return route_map

    def get_helpers(self):
        return {'communities_helper': communities}


class CTDataController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)

    def news(self):
        return base.render('news.html')

    def special_projects(self):
        return base.render('special_projects.html')

    def data_by_topic(self):
        domains = TopicSerivce.get_topics('data_by_topic')

        return base.render('data_by_topic.html', extra_vars={'domains': domains})

    def update_indicators(self, dataset_name):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None

            if user.is_admin:
                json_body   = json.loads(http_request.body, encoding=http_request.charset)
                names_hash  = json_body.get('names_hash')
                indicators_to_remove  = json_body.get('indicators_to_remove')

                for indicator_id, name in names_hash.iteritems():
                    self.community_profile_service.update_indicator_name(indicator_id, name)

                for indicator_id in indicators_to_remove:
                    self.community_profile_service.remove_indicator(user, int(indicator_id))

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'success': True})

    def visualization(self, dataset_name):
        try:
            indicator_id = http_request.GET.get('ind')
            indicator    = self.community_profile_service.get_indicators_by_ids([indicator_id])[0]
            filters      = map(lambda fl: {fl['field']: (fl['values'][0] if len(fl['values']) == 1 else fl['values'])}, json.loads(indicator.filters))
            ind_filters  = ast.literal_eval(json.dumps(dict(i.items()[0] for i in filters)))
        except IndexError:
            ind_filters = None

        try:
            dataset = DatasetService.get_dataset(dataset_name)
            dataset_meta = DatasetService.get_dataset_meta(dataset_name)
        except toolkit.ObjectNotFound:
            abort(404)

        metadata = dataset_meta['extras']
        default_metadata = filter(lambda x: x['key'] == 'Default', metadata)

        try:
          defaults = yaml.load(default_metadata[0]['value'])
          if type(defaults) is list:
            defaults = defaults[0]
        except IndexError:
          defaults = []

        disabled_metadata = filter(lambda x: x['key'] == "disabled_views", metadata)
        print disabled_metadata
        try:
          disabled = yaml.load(disabled_metadata[0]['value'])
        except IndexError:
          disabled = []

        if not ind_filters:
            default_filters = defaults
        else:
            try:
                ind_filters['Town'] = defaults['Town']
                default_filters = ind_filters
            except TypeError:
                default_filters = ind_filters

        visible_metadata_fields = filter(lambda x: x['key'] == 'visible_metadata', metadata)

        try:
            metadata_fields = yaml.load(visible_metadata_fields[0]['value'])
            metadata_fields.split(',')
        except IndexError:
            metadata_fields = ['Description', 'Full Description', 'Source']

        metadata = filter(lambda x: x['key'] in metadata_fields, metadata)

        headline_indicators = self.community_profile_service.get_headline_indicators_for_dataset(dataset.ckan_meta['id'])
        return base.render('visualization.html', extra_vars={'dataset': dataset.ckan_meta,
                                                             'dimensions': dataset.dimensions,
                                                             'metadata': metadata,
                                                             'disabled': disabled,
                                                             'default_filters': default_filters,
                                                             'headline_indicators': headline_indicators})


    def get_vizualization_data(self, dataset_name):
        try:
            json_body = json.loads(http_request.body, encoding=http_request.charset)
        except ValueError:
            abort(400)

        request_view, request_filters, omit_single_values = json_body.get('view'), json_body.get('filters'), json_body.get('omit_single_values')

        if not request_view or not request_filters:
            abort(400, detail='No view and/or filters specified')

        if not request_view in ('map', 'chart', 'table', 'profile'):
            abort(400, detail='No such view')

        try:
            dataset = DatasetService.get_dataset(dataset_name)
        except toolkit.ObjectNotFound:
            abort(404)

        query_builder = QueryBuilderFactory.get_query_builder(request_view, dataset)
        view = ViewFactory.get_view(request_view, query_builder)

        data = view.get_data(request_filters)
        if omit_single_values:
            data = self._hide_dims_with_one_value(data)

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps(data)

    def _hide_dims_with_one_value(self, data):
        size         = len(data['data'])
        try:
            keys         = data['data'][size-1]['dims'].keys()
            initial_data = data['data'][size-1]['dims']
            counters     = {}

            for key in keys:
                counters[key] = 0

            for item in data['data']:
                try:
                    for key in keys:
                        if item['dims'][key] == initial_data[key] and key != 'Town':
                            counters[key] += 1
                except KeyError:
                    size -= 1
                    pass

            h = dict((key,value) for key, value in counters.iteritems() if value == size)

            if len(h.keys()) > 0:
                for key in h.keys():
                    for item in data['data']:
                        try:
                           item['dims'].pop(key, None)
                        except KeyError:
                            pass
        except KeyError:
            pass

        return data

    # TODO: move to Community Controller
    def add_community_towns(self, community_name):
        if http_request.method == 'POST':
            try:
                json_body = json.loads(http_request.body, encoding=http_request.charset)
            except ValueError:
                abort(400)
            towns = json_body.get('towns')

            if not towns:
                abort(400, detail='No towns specified')

            try:
                self.community_profile_service.add_profile_town(community_name, towns)
            except toolkit.ObjectNotFound:
                abort(404)

            session.commit()

            http_response.headers['Content-type'] = 'application/json'
            return json.dumps({'success': True})

