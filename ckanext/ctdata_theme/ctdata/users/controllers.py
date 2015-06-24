import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, c, request as http_request

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from ..topic.services import TopicSerivce
from ..location.services import LocationService
from ckan.controllers.user import UserController
from IPython import embed
import ckan.lib.helpers as h
import ckan.lib.activity_streams as activity_streams

import ckan.logic as logic
import ckan.new_authz as new_authz
from pylons import config
get_action    = logic.get_action
NotAuthorized = logic.NotAuthorized
check_access  = logic.check_access
ValidationError = logic.ValidationError

class UserController(UserController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)
        self.location_service = LocationService(self.session)

    def index(self):
        if c.userobj and c.userobj.sysadmin:
            LIMIT = 20

            page = self._get_page_number(http_request.params)
            c.q = http_request.params.get('q', '')
            c.order_by = http_request.params.get('order_by', 'name')

            context = {'return_query': True, 'user': c.user or c.author,
                       'auth_user_obj': c.userobj}

            data_dict = {'q': c.q,
                         'order_by': c.order_by}
            try:
                check_access('user_list', context, data_dict)
            except NotAuthorized:
                abort(401, _('Not authorized to see this page'))

            users_list = get_action('user_list')(context, data_dict)

            c.page = h.Page(
                collection=users_list,
                page=page,
                url=h.pager_url,
                item_count=users_list.count(),
                items_per_page=LIMIT
            )
            return base.render('user/list.html')
        else:
            return h.redirect_to('/')


    def logged_in(self):
        came_from = http_request.params.get('came_from', '')
        if h.url_is_local(came_from):
            return h.redirect_to(str(came_from))

        if c.user:
            context = None
            data_dict = {'id': c.user}

            user_dict = get_action('user_show')(context, data_dict)
            user_ref = c.userobj.get_reference_preferred_for_uri()
            return h.redirect_to('/')
        else:
            err = 'Login failed. Bad username or password.'
            if  h.asbool(config.get('ckan.legacy_templates', 'false')):
                h.flash_error(err)
                h.redirect_to(controller='user',
                              action='login', came_from=came_from)
            else:
                return self.login(error=err)

    def dashboard(self):
        user_name = http_request.environ.get("REMOTE_USER")
        user      = self.user_service.get_or_create_user(user_name) if user_name else None

        if not user:
            return self.login()
        try:
            context = {'model': model, 'session': model.Session, 'user': c.user or c.author}
            c.user_dict = get_action('user_show')(context, {'id': c.user})
        except toolkit.ObjectNotFound:
            abort(404)

        profiles   = self.location_service.get_user_profiles(c.userobj.id)
        indicators = self.community_profile_service.get_gallery_indicators_for_user(c.userobj.id, 'all')

        data_dict        = {'am_member': True }
        groups           = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in groups ]

        c.followee_list = get_action('followee_list')(context, {'id': c.userobj.id})
        activity_stream = logic.get_action('dashboard_activity_list')(context, data_dict)

        c.dataset_activity = filter(lambda a: len(a['data'].keys()) > 0 and a['data'].keys()[0] == 'package', activity_stream)
        c.group_activity   = filter(lambda a: len(a['data'].keys()) > 0 and a['data'].keys()[0] == 'group',   activity_stream)

        extra_vars = {
            'controller': 'user',
            'action': 'dashboard',
            'offset': 0,
        }

        for group in groups:
            activities = filter(lambda g: g['object_id'] == group['id'], c.group_activity)
            group['activities'] =  activity_streams.activity_list_to_html(context, activities, extra_vars)


        c.dataset_activity_stream = activity_streams.activity_list_to_html(context, c.dataset_activity, extra_vars)
        c.group_activity_stream   = activity_streams.activity_list_to_html(context, c.group_activity, extra_vars)

        self.session.close()
        return base.render('user/user_page.html', extra_vars={'profiles': profiles, 'gallery_indicators': indicators, 'groups': groups})


    def community_profiles(self, user_id):
        user_name = http_request.environ.get("REMOTE_USER")

        user    = self.user_service.get_or_create_user(user_name) if user_name else None
        c.user  = user_id
        context = {'model': model, 'session': model.Session, 'user': c.user or c.author}
        try:
            c.user_dict = get_action('user_show')(context, {'id': user_id,'include_num_followers': True})
        except toolkit.ObjectNotFound:
            abort(404)

        profiles = self.location_service.get_user_profiles(c.user_dict['id'])

        return base.render('user_community_profiles.html', extra_vars={'profiles': profiles, 'user_name': user_name, 'requested_user_name': c.user_dict['name']})

    def my_community_profiles(self):
        user_name = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(404)

        user = self.user_service.get_or_create_user(user_name) if user_name else None
        profiles = self.location_service.get_user_profiles(user.ckan_user_id)

        return base.render('user/my_community_profiles.html', extra_vars={'profiles': profiles})

    def my_gallery(self):
        permission = 'all'
        user_name = http_request.environ.get("REMOTE_USER")
        if not user_name:
            abort(404)

        indicators = self.community_profile_service.get_gallery_indicators_for_user(c.userobj.id, permission)

        # Get list of groups
        context   = {'model': model, 'session': model.Session, 'user': c.user or c.author, 'for_view': True,
                   'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'am_member': True}
        users_groups     = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups ]

        self.session.close()
        return base.render('user/my_gallery.html', extra_vars={'gallery_indicators': indicators, 'user_name': user_name})

    def user_gallery(self, user_id):
        user_name = http_request.environ.get("REMOTE_USER")
        indicators, requested_user_name = self._prepare_for_user_gallery(http_request)
        c.user    = user_id
        context = {'model': model, 'session': model.Session, 'user': c.user or c.author}

        try:
            c.user_dict = get_action('user_show')(context, {'id': user_id,'include_num_followers': True})
        except toolkit.ObjectNotFound:
            abort(404)
        return base.render('user/user_gallery.html', extra_vars={'gallery_indicators': indicators, 'user_name': user_name, 'requested_user_name': requested_user_name})

    def _prepare_for_user_gallery(self, http_request):
        logged_user_name    = http_request.environ.get("REMOTE_USER")
        requested_user_name = http_request.environ.get('wsgiorg.routing_args')[1]['user_id']
        permission = 'public' if logged_user_name != requested_user_name else 'all'
        try:
            user = self.user_service.get_or_create_user(requested_user_name) if requested_user_name else None
        except toolkit.ObjectNotFound:
            abort(404)

        indicators = self.community_profile_service.get_gallery_indicators_for_user(user.ckan_user_id, permission)

        # Get list of groups
        context   = {'model': model, 'session': model.Session, 'user': c.user or c.author, 'for_view': True,
                   'auth_user_obj': c.userobj, 'use_cache': False}
        data_dict = {'am_member': True}
        users_groups     = get_action('group_list_authz')(context, data_dict)
        c.group_dropdown = [[group['id'], group['display_name']] for group in users_groups ]

        self.session.close()
        return indicators, requested_user_name

    def update_gallery_indicator(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user       = self.user_service.get_or_create_user(user_name) if user_name else None
            json_body  = json.loads(http_request.body, encoding=http_request.charset)
            ind_params = json_body.get('ind_params')
            indicator  = self.community_profile_service.update_indicator(int(ind_params['id']), ind_params['name'],
                                                            ind_params['permission'], ind_params['group_ids'])

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
        return json.dumps({'success': True})

    def remove_gallery_indicators(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user                 = self.user_service.get_or_create_user(user_name) if user_name else None
            json_body            = json.loads(http_request.body, encoding=http_request.charset)
            indicators_to_remove = json_body.get('indicators_to_remove')

            for indicator_id in indicators_to_remove:
                self.community_profile_service.remove_indicator(user, int(indicator_id))

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
        return json.dumps({'success': True})

    def update_community_profiles(self):
        user_name    = http_request.environ.get("REMOTE_USER")

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None

            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            names_hash  = json_body.get('names_hash')
            profiles_to_remove  = json_body.get('profiles_to_remove')

            # for community_id, name in names_hash.iteritems():
            #     self.community_profile_service.update_community_profile_name(int(community_id), name, user.ckan_user_id)

            for profile_id in profiles_to_remove:
                self.location_service.remove_profile(int(profile_id), user.ckan_user_id)

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()
        return json.dumps({'success': True})

    def read(self, id=None):
        if id == c.userobj.name:
            return self.dashboard()

        context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author, 'auth_user_obj': c.userobj,
                   'for_view': True}
        data_dict = {'id': id,
                     'user_obj': c.userobj,
                     'include_datasets': True,
                     'include_num_followers': True}

        context['with_related'] = True

        self._setup_template_variables(context, data_dict)

        # The legacy templates have the user's activity stream on the user
        # profile page, new templates do not.
        if h.asbool(config.get('ckan.legacy_templates', False)):
            c.user_activity_stream = get_action('user_activity_list_html')(
                context, {'id': c.user_dict['id']})

        return base.render('user/read.html')



    def edit(self, id=None, data=None, errors=None, error_summary=None):
        context = {'save': 'save' in http_request.params,
                   'schema': self._edit_form_to_db_schema(),
                   'model': model, 'session': model.Session,
                   'user': c.user, 'auth_user_obj': c.userobj
                   }
        if id is None:
            if c.userobj:
                id = c.userobj.id
            else:
                abort(400, _('No user specified'))
        data_dict = {'id': id}

        try:
            check_access('user_update', context, data_dict)
        except NotAuthorized:
            abort(401, _('Unauthorized to edit a user.'))

        if (context['save']) and not data:
            return self._save_edit(id, context)

        try:
            old_data = get_action('user_show')(context, data_dict)

            schema = self._db_to_edit_form_schema()
            if schema:
                old_data, errors = validate(old_data, schema)

            c.display_name = old_data.get('display_name')
            c.user_name = old_data.get('name')

            data = data or old_data

        except NotAuthorized:
            abort(401, _('Unauthorized to edit user %s') % '')
        except NotFound:
            abort(404, _('User not found'))

        user_obj = context.get('user_obj')

        if not (new_authz.is_sysadmin(c.user)
                or c.user == user_obj.name):
            abort(401, _('User %s not authorized to edit %s') %
                  (str(c.user), id))

        errors = errors or {}
        vars = {'data': data, 'errors': errors, 'error_summary': error_summary}

        self._setup_template_variables({'model': model,
                                        'session': model.Session,
                                        'user': c.user or c.author},
                                       data_dict)

        c.is_myself = True
        c.show_email_notifications = h.asbool(
            config.get('ckan.activity_streams_email_notifications'))
        c.form = base.render(self.edit_user_form, extra_vars=vars)
        c.followee_list = get_action('followee_list')({'model': model, 'session': model.Session, 'user': c.user or c.author}, {'id': c.userobj.id})

        c.group_followee_list   = filter(lambda i: i['type'] == 'group',  c.followee_list)
        c.dataset_followee_list = filter(lambda i: i['type'] == 'dataset',  c.followee_list)

        return base.render('user/edit.html')
