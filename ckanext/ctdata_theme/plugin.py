import routes.mapper

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.lib.base as base


class CTDataThemePlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IRoutes)

    def update_config(self, config):
        toolkit.add_template_directory(config, 'templates')
        toolkit.add_public_directory(config, 'public')

    def before_map(self, route_map):
        with routes.mapper.SubMapper(route_map, controller='ckanext.ctdata_theme.plugin:CTDataController') as m:
            m.connect('news', '/news', action='news')
            m.connect('special_projects', '/special_projects', action='special_projects')
        return route_map

    def after_map(self, route_map):
        return route_map


class CTDataController(base.BaseController):
    def news(self):
        return base.render('news.html')

    def special_projects(self):
        return base.render('special_projects.html')