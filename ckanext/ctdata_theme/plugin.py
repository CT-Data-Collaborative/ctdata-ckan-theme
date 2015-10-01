import json
import yaml
import ast

from pylons.controllers.util import abort

import routes.mapper

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.lib.base as base
from ckan.common import response as http_response, c, request as http_request
import ckan.model as model
import ckan.logic as logic
import ckan.lib.helpers as h

from ctdata.database import Database
from ctdata.visualization.services import DatasetService
from ctdata.visualization.querybuilders import QueryBuilderFactory
from ctdata.visualization.views import ViewFactory
from ctdata.community.services import CommunityProfileService
from ctdata.topic.services import TopicSerivce
from ctdata.users.services import UserService
from ctdata.location.services import LocationService

from IPython import embed

get_action = logic.get_action

def locations():
    db   = Database()
    sess = db.session_factory()

    location_service = LocationService(sess)
    locations = location_service.get_all_locations()

    sess.close()
    return locations


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
        db.init_years_data(config['ckan.datastore.write_url'])

    def before_map(self, route_map):
        with routes.mapper.SubMapper(route_map, controller='ckanext.ctdata_theme.ctdata.compare.controllers:CompareController') as m:
            m.connect('admin_compare', '/admin/compare', action='admin_compare')
            m.connect('compare', '/compare', action='compare')
            m.connect('load_comparable_datasets', '/compare/load_comparable_datasets/{dataset_name}', action='load_comparable_datasets')
            m.connect('update_years_matches', '/compare/update_years_matches', action='update_years_matches')
            m.connect('add_year_matches', '/compare/add_year_matches', action='create_year_matches')
            m.connect('join_for_two_datasets', '/compare/join_for_two_datasets/', action='join_for_two_datasets')

        with routes.mapper.SubMapper(route_map, controller='ckanext.ctdata_theme.plugin:CTDataController') as m:
            # m.connect('news', '/news', action='news')
            m.connect('special_projects', '/special_projects', action='special_projects')
            m.connect('data_by_topic', '/data_by_topic', action='data_by_topic')
            m.connect('visualization', '/visualization/{dataset_name}', action='visualization')
            m.connect('get_vizualization_data', '/vizualization_data/{dataset_name}', action='get_vizualization_data')
            m.connect('update_visualization_link', '/update_visualization_link/{dataset_name}', action='update_visualization_link')
            m.connect('dataset_update_indicators', '/dataset/{dataset_name}/update_indicators', action='update_indicators')

        with routes.mapper.SubMapper(route_map, controller='ckanext.ctdata_theme.ctdata.package.controllers:PackageController') as m:
            m.connect('dataset_groups', '/dataset/groups/{id}', action='groups', ckan_icon='group')

        with routes.mapper.SubMapper(route_map,
                controller='ckanext.ctdata_theme.ctdata.community.controllers:CommunityProfilesController') as m:
            m.connect('community_get_filters', '/community/get_filters/{dataset_id}', action='get_filters')
            m.connect('community_get_incompatibles', '/community/get_incompatibles/{dataset_id}', action='get_incompatibles')
            m.connect('community_get_topics', '/community/get_topics', action='get_topics')
            m.connect('community_add_indicator', '/community/add_indicator', action='add_indicator')
            m.connect('community_update_profile_indicators', '/community/update_profile_indicators', action='update_profile_indicators')
            m.connect('community_remove_indicator','/community/remove_indicator/{indicator_id}', action='remove_indicator')


        with routes.mapper.SubMapper(route_map,
                controller='ckanext.ctdata_theme.ctdata.users.controllers:UserController') as m:
            m.connect('/user/edit', action='edit')
            m.connect('user_edit', '/user/edit/{id:.*}', action='edit',ckan_icon='cog')
            m.connect('dashboard', '/dashboard', action='dashboard')
            m.connect('/user/me', action='me')
            m.connect('/user_index', '/user', action='index')
            m.connect('/user/logged_in', action='logged_in')
            m.connect('user_community_profiles', '/user/{user_id}/community_profiles', action='community_profiles')
            m.connect('my_gallery', '/dashboard/gallery', action='my_gallery')
            m.connect('my_community_profiles', '/dashboard/community-profiles', action='my_community_profiles')
            m.connect('user_gallery', '/user/{user_id}/gallery', action='user_gallery')
            m.connect('remove_gallery_indicators', '/user/remove_gallery_indicators', action='remove_gallery_indicators')
            m.connect('update_gallery_indicator',  '/user/update_gallery_indicator', action='update_gallery_indicator')
            m.connect('update_community_profiles', '/user/update_community_profiles', action='update_community_profiles')
            m.connect('/user/activity/{id}/{offset}', action='activity')
            m.connect('user_activity_stream', '/user/activity/{id}',action='activity', ckan_icon='time')

            m.connect('user_generate_apikey', '/user/generate_key/{id}', action='generate_apikey')
            m.connect('user_follow', '/user/follow/{id}', action='follow')
            m.connect('/user/unfollow/{id}', action='unfollow')
            m.connect('user_followers', '/user/followers/{id:.*}', action='followers', ckan_icon='group')
            m.connect('user_delete', '/user/delete/{id}', action='delete')
            m.connect('/user/reset/{id:.*}', action='perform_reset')
            m.connect('register', '/user/register', action='register')
            m.connect('login', '/user/login', action='login')
            m.connect('/user/_logout', action='logout')
            m.connect('/user/logged_in', action='logged_in')
            m.connect('/user/logged_out', action='logged_out')
            m.connect('/user/logged_out_redirect', action='logged_out_page')
            m.connect('/user/reset', action='request_reset')
            m.connect('/user/set_lang/{lang}', action='set_lang')

            m.connect('user_datasets', '/user/{id:.*}', action='read',ckan_icon='sitemap')

        with routes.mapper.SubMapper(route_map,
                controller='ckanext.ctdata_theme.ctdata.pages.controllers:PageController') as m:
            m.connect('page_about', '/pages/about', action='about')
            m.connect('page_news', '/pages/news', action='news')
            m.connect('page_special_projects', '/pages/special-projects', action='special_projects')
            m.connect('page_data_gallery', '/pages/data-gallery', action='data_gallery')

        with routes.mapper.SubMapper(route_map,
                controller='ckanext.ctdata_theme.ctdata.group.controllers:GroupController') as m:
            m.connect('group_user_autocomplete', '/group/user_autocomplete', action = 'user_autocomplete')
            m.connect('group_indicators', '/group/indicators/{group_id}', action='group_indicators')
            m.connect('group_members', '/group/members/{id}', action='members', ckan_icon='group')
            m.connect('group_new', '/group/new', action='new')
            m.connect('group_read', '/group/{id}', action='read', ckan_icon='sitemap')
            m.connect('group_action', '/group/{action}/{id}', action = 'member_new')
            m.connect('group_remove_member', '/group/remove_member/{id}', action = 'remove_member')
            m.connect('update_group_indicators', '/group/update_group_indicators', action='update_group_indicators')
            m.connect('group_index', '/group', action='index', highlight_actions='index search')

        with routes.mapper.SubMapper(route_map,
                controller='ckanext.ctdata_theme.ctdata.location.controllers:LocationsController') as m:
            m.connect('locations', '/location', action='locations_index')
            m.connect('data_by_location', '/data-by-location', action='data_by_location')
            m.connect('manage_locations', '/manage-locations', action='manage_locations')
            m.connect('create_location',  '/create_location',  action='create_location')
            m.connect('load_indicator_location', '/location/load_indicator', action='load_indicator')
            m.connect('create_location_profile', '/location/create-profile', action='create_location_profile')
            m.connect('load_profile_indicators', '/load_profile_indicators/{profile_id}', action='load_profile_indicators')
            m.connect('save_local_default', '/save_local_default/{profile_id}', action='save_local_default')
            m.connect('community_profiles', '/community/{profile_id}', action='community_profile')
            m.connect('remove_location_profile', '/remove_location_profile/{profile_id}', action='remove_location_profile')

        return route_map

    def after_map(self, route_map):
        return route_map

    def get_helpers(self):
        return { 'locations_helper': locations,
                 'geography_types': _geography_types,
                 'empty_href': _empty_href,
                 'link_to_dataset_with_filters': _link_to_dataset_with_filters}



####### HELPER METHODS ##########

def _empty_href():
    return 'javascript:void(0);'

def _link_to_dataset_with_filters(dataset, filters, view = 'table', location = ''):
    dataset_url  = dataset.replace(' ', '-').replace("'", '').lower()
    filters_hash = {}

    filters      = map(lambda fl: filters_hash.update( {fl['field']: (fl['values'][0] if len(fl['values']) == 1 else fl['values'])}),
                                 json.loads(filters))

    if location != '':
        filters_hash['Town'] = [location]

    link_params  =  "?v=" + view + "&f=" + json.dumps(filters_hash)
    link         = "/visualization/" + str(dataset_url) + link_params

    return link

def _geography_types():
    db   = Database()
    sess = db.session_factory()

    location_service = LocationService(sess)
    geography_types  = location_service.location_geography_types()

    sess.close()
    return geography_types

####### Main Controller ##########

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

        self.session.close()
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
        self.session.close()
        return json.dumps({'success': True})

    def visualization(self, dataset_name):
        ind_filters = http_request.GET.get('f')

        try:
            if ind_filters:
                ind_filters = json.dumps(json.loads(ind_filters))
        except ValueError:
            ind_filters = None

        try:
            dataset = DatasetService.get_dataset(dataset_name)
        except toolkit.ObjectNotFound:
            abort(404)

        help_str        = DatasetService.get_dataset_meta_help(dataset_name)
        geography_param = DatasetService.get_dataset_meta_geo_type(dataset_name)
        disabled        = DatasetService.get_dataset_meta_disabled_views(dataset_name)
        metadata_fields = DatasetService.get_dataset_meta_visible_metadata(dataset_name)
        metadata_units  = DatasetService.get_dataset_meta_units(dataset_name)
        break_points    = DatasetService.get_dataset_meta_break_points(dataset_name)
        defaults        = DatasetService.get_dataset_meta_default_metadata(dataset_name)
        metadata        = filter(lambda x: x['key'] in metadata_fields, dataset.ckan_meta['extras'])
        map_json_url    = DatasetService.get_dataset_map_json_url(dataset_name)

        disable_visualizations = DatasetService.get_dataset_meta_hidden_in(dataset_name)
        disable_dimensions     = DatasetService.get_dataset_meta_disabled_dimensions(dataset_name)

        if 'visualization' in disable_visualizations or dataset.ckan_meta['private']:
           h.redirect_to(controller='package', action='read', id=dataset_name)

        if not ind_filters:
            default_filters = defaults
        else:
            try:
                if len(defaults) > 0 and str(geography_param) in list(defaults.keys()):
                    ind_filters[str(geography_param)] = defaults[str(geography_param)]
                default_filters = ind_filters
            except TypeError:
                default_filters = ind_filters


        headline_indicators = self.community_profile_service.get_headline_indicators_for_dataset(dataset.ckan_meta['id'])

        # Get list of groups
        context   = {'model': model, 'session': model.Session,
                     'user': c.user or c.author, 'for_view': True,
                     'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'am_member': True}

        users_groups     = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups ]
        c.help_info      = help_str

        self.session.close()
        return base.render('visualization/visualization.html', extra_vars={'dataset': dataset.ckan_meta,
                                                             'disable_dimensions': disable_dimensions,
                                                             'dimensions': dataset.dimensions,
                                                             'units':    metadata_units,
                                                             'metadata': metadata,
                                                             'disabled': disabled,
                                                             'default_filters': default_filters,
                                                             'headline_indicators': headline_indicators,
                                                             'geography_param': geography_param,
                                                             'break_points': break_points,
                                                             'map_json_url': map_json_url })

    def update_visualization_link(self, dataset_name):
        json_body = json.loads(http_request.body, encoding=http_request.charset)
        try:
            dataset = DatasetService.get_dataset(dataset_name)
        except toolkit.ObjectNotFound:
            abort(404)

        view_param       = json_body.get('view')
        request_view     = 'chart' if view_param in ['table', 'column', 'line'] else view_param
        request_filters  = json_body.get('filters')
        data             = {}
        data['link']     = _link_to_dataset_with_filters(dataset_name, json.dumps(request_filters), view_param)
        query_builder    = QueryBuilderFactory.get_query_builder(request_view, dataset)
        view             = ViewFactory.get_view(request_view, query_builder)
        data['compatibles'] = view.get_compatibles(request_filters)

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
        return json.dumps(data)

    def get_vizualization_data(self, dataset_name):
        try:
            json_body = json.loads(http_request.body, encoding=http_request.charset)
        except ValueError:
            abort(400)

        view_param         = json_body.get('view')
        request_view       = 'chart' if view_param in ['table', 'column', 'line'] else view_param
        request_filters    = json_body.get('filters')
        omit_single_values = json_body.get('omit_single_values')

        if not request_view or not request_filters:
            abort(400, detail='No view and/or filters specified')

        if not request_view in ('map', 'chart', 'table', 'profile'):
            abort(400, detail='No such view')

        try:
            dataset = DatasetService.get_dataset(dataset_name)
        except toolkit.ObjectNotFound:
            abort(404)

        geography_param = DatasetService.get_dataset_meta_geo_type(dataset_name)
        query_builder   = QueryBuilderFactory.get_query_builder(request_view, dataset)
        view            = ViewFactory.get_view(request_view, query_builder)
        data            = view.get_data(request_filters)

        if omit_single_values:
            data = self._hide_dims_with_one_value(data, geography_param)

        data['link'] = _link_to_dataset_with_filters(dataset_name, json.dumps(request_filters), view_param)

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
        return json.dumps(data)

    def _hide_dims_with_one_value(self, data, geography_param):
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
                        if item['dims'][key] == initial_data[key] and key != geography_param:
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
        except IndexError:
            pass

        return data
