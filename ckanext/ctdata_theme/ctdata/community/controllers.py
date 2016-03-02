import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, request as http_request
import ckan.lib.helpers as h

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..topic.services import TopicService
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from services import CommunityProfileService, ProfileAlreadyExists, CantDeletePrivateIndicator
from ..location.services import LocationService

from IPython import embed
from termcolor import colored

class CommunityProfilesController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service     = UserService(self.session)
        self.location_service = LocationService(self.session)

    #TODO refactor to use  locations controller
    def add_indicator(self):
        session_id = session.id
        user_name  = http_request.environ.get("REMOTE_USER") or "guest_" + session_id

        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user_with_session_id(user_name,session_id) if user_name else None

            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            filters     = json_body.get('filters')
            dataset_id  = json_body.get('dataset_id')
            name        = json_body.get('name')
            ind_type    = json_body.get('ind_type')
            permission  = json_body.get('permission')
            description = json_body.get('description')
            group_ids   = json_body.get('group_ids')
            visualization_type   = json_body.get('visualization_type') or 'table'

            http_response.headers['Content-type'] = 'application/json'

            if not filters or not dataset_id:
                abort(400)

            try:
                params = {
                    'name':        name,
                    'filters':     filters,
                    'dataset_id':  dataset_id,
                    'ind_type':    ind_type,
                    'visualization_type': visualization_type,
                    'user':        user,
                    'permission':  permission,
                    'description': description,
                    'group_ids':   group_ids,
                    'user': user
                }

                indicator =  self.location_service.create_indicator(params)
                self.session.commit()

                ind_data = {
                         'id': indicator.id,
                    'filters': indicator.filters,
                  'data_type': indicator.data_type,
                       'year': indicator.year,
                    'link_to': indicator.link_to_visualization(),
                    'dataset': indicator.dataset_name(),
                   'variable': indicator.variable,
                }

                return json.dumps({'success': True, 'indicator': ind_data })
            except toolkit.ObjectNotFound, e:
                return json.dumps({'success': False, 'error': str(e)})
            except ProfileAlreadyExists, e:
                return json.dumps({'success': False, 'error': str(e)})

        return json.dumps({'success': False, 'error': str('Indicator cannot be saved')})


    def get_topics(self):
        http_response.headers['Content-type'] = 'application/json'
        geography_types = self.location_service.location_geography_types()
        topics          = TopicService.get_topics('community_profile')


        html  = base.render('communities/snippets/indicator_popup.html', extra_vars={'topics': topics, 'geography_types': geography_types})

        return json.dumps({'success': True, 'html': html})


    def get_filters(self, dataset_id):
        http_response.headers['Content-type'] = 'application/json'
        try:
            dataset         = DatasetService.get_dataset(dataset_id)
        except toolkit.ObjectNotFound:
            return json.dumps({'success': False, 'error': 'No datasets with this id'})

        geography_param = DatasetService.get_dataset_meta_geo_type(dataset_id)

        result = []
        for dim in dataset.dimensions:
            if dim.name not in [geography_param]:
                if dim.name == 'Race':
                    dim.possible_values.append('all')
                result.append({'name': dim.name, 'values': dim.possible_values})

        return json.dumps({'success': True, 'result': result})

    def get_incompatibles(self, dataset_id):
        json_body       = json.loads(http_request.body, encoding=http_request.charset)
        request_view    = 'chart'
        request_filters = json_body.get('filters')
        data            = {}

        try:
            dataset         = DatasetService.get_dataset(dataset_id)
            dataset_meta    = DatasetService.get_dataset_meta(dataset_id)
            geography       = filter(lambda x: x['key'] == 'Geography', dataset.ckan_meta['extras'])
            geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'
        except toolkit.ObjectNotFound:
            return json.dumps({'success': False, 'error': 'No datasets with this id'})

        query_builder       = QueryBuilderFactory.get_query_builder(request_view, dataset)
        view                = ViewFactory.get_view(request_view, query_builder)
        data['compatibles'] = view.get_compatibles(request_filters)

        http_response.headers['Content-type'] = 'application/json'
        self.session.close()

        return json.dumps(data)
