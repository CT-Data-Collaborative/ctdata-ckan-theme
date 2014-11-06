import json
import yaml

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
            m.connect('get_data', '/data/{dataset_name}', action='get_data')

        with routes.mapper.SubMapper(
                route_map,
                controller='ckanext.ctdata_theme.ctdata.community.controllers:CommunityProfilesController') as m:
            m.connect('community_get_filters', '/community/get_filters/{dataset_id}', action='get_filters')
            m.connect('community_add_indicator', '/community/add_indicator', action='add_indicator')
            m.connect('community_remove_indicator',
                      '/community/remove_indicator/{indicator_id}',
                      action='remove_indicator')
            m.connect('community_profiles', '/community/{community_name}', action='community_profile')

        return route_map

    def after_map(self, route_map):
        return route_map

    def get_helpers(self):
        return {'communities_helper': communities}


class CTDataController(base.BaseController):
    def news(self):
        return base.render('news.html')

    def special_projects(self):
        return base.render('special_projects.html')

    def data_by_topic(self):
        domains = TopicSerivce.get_topics('data_by_topic')

        return base.render('data_by_topic.html', extra_vars={'domains': domains})

    def visualization(self, dataset_name):
        metadata_fields = ['Description', 'Full Description', 'Source']
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
        metadata = filter(lambda x: x['key'] in metadata_fields, metadata)


        return base.render('visualization.html', extra_vars={'dataset': dataset.ckan_meta,
                                                             'dimensions': dataset.dimensions,
                                                             'metadata': metadata,
                                                             'disabled': disabled,
                                                             'default_filters': defaults})

    def get_data(self, dataset_name):
        try:
            json_body = json.loads(http_request.body, encoding=http_request.charset)
        except ValueError:
            abort(400)

        request_view, request_filters = json_body.get('view'), json_body.get('filters')

        for one_filter in request_filters:
            if len( one_filter['values']) == 1:
                request_filters.remove(one_filter)

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

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps(data)

    def add_community_towns(self, community_name):
        if http_request.method == 'POST':
            session = Database().session_factory()
            community_profile_service = CommunityProfileService(session)

            try:
                json_body = json.loads(http_request.body, encoding=http_request.charset)
            except ValueError:
                abort(400)
            towns = json_body.get('towns')

            if not towns:
                abort(400, detail='No towns specified')

            try:
                community_profile_service.add_profile_town(community_name, towns)
            except toolkit.ObjectNotFound:
                abort(404)

            session.commit()

            http_response.headers['Content-type'] = 'application/json'
            return json.dumps({'success': True})

    def add_indicator(self):
        if http_request.method == 'POST':
            session = Database().session_factory()
            community_profile_service = CommunityProfileService(session)

            json_body = json.loads(http_request.body, encoding=http_request.charset)
            filters, dataset_id = json_body.get('filters'), json_body.get('dataset_id')

            if not filters or not dataset_id:
                abort(400)

            try:
                community_profile_service.create_profile_indicator(filters, dataset_id)
            except toolkit.ObjectNotFound:
                abort(404)
            except ProfileAlreadyExists, e:
                http_response.headers['Content-type'] = 'application/json'
                return json.dumps({'success': False, 'error': str(e)})

            session.commit()

            http_response.headers['Content-type'] = 'application/json'
            return json.dumps({'success': True})

    def get_filters(self, dataset_id):
        http_response.headers['Content-type'] = 'application/json'

        try:
            dataset = DatasetService.get_dataset(dataset_id)
        except toolkit.ObjectNotFound:
            return json.dumps({'success': False, 'error': 'No datasets with this id'})

        result = []
        for dim in dataset.dimensions:
            # use reasonably good hardcoded "required" dimensions for now (will be changed after metadata for optional
            # dimensions added)
            if dim.name in ('Year', 'Measure Type', 'Variable', 'Subject', 'Grade', 'Race'):
                if dim.name == 'Race':
                    dim.possible_values.append('all')
                result.append({'name': dim.name, 'values': dim.possible_values})

        return json.dumps({'success': True, 'result': result})

    def remove_community_indicator(self, indicator_id):
        pass

    def community_profile(self, community_name):
        session = Database().session_factory()
        community_profile_service = CommunityProfileService(session)

        towns_raw, towns_names = http_request.GET.get('towns'), []
        if towns_raw:
            # parse town name
            towns_names = map(lambda x: x.strip(), towns_raw.split(','))

        try:
            community, indicators, displayed_towns = community_profile_service.get_indicators(community_name,
                                                                                              towns_names)
            topics = TopicSerivce.get_topics()
        except toolkit.ObjectNotFound as e:
            abort(404, detail=str(e))

        towns = community_profile_service.get_all_towns()
        displayed_towns_names = map(lambda t: t.name, displayed_towns)

        session.commit()
        return base.render('community_profile.html', extra_vars={'community': community,
                                                                 'indicators': indicators,
                                                                 'topics': topics,
                                                                 'displayed_towns': displayed_towns_names,
                                                                 'towns': towns})
