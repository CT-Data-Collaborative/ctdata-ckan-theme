import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url

import ckan.lib.base as base
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, request as http_request

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..topic.services import TopicSerivce
from services import CommunityProfileService, ProfileAlreadyExists, CantDeletePrivateIndicator
from IPython import embed

class CommunityProfilesController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)

    def add_indicator(self):

        user_name = http_request.environ.get("REMOTE_USER")
        embed()
        if user_name == None:
            user_name = "guest_" + str(datetime.date.today())

        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None

            json_body   = json.loads(http_request.body, encoding=http_request.charset)
            filters     = json_body.get('filters')
            dataset_id  = json_body.get('dataset_id')
            name        = json_body.get('name')
            headline    = json_body.get('headline')

            if not filters or not dataset_id:
                abort(400)

            try:
                self.community_profile_service.create_indicator(name, filters, dataset_id, user, headline)
            except toolkit.ObjectNotFound, e:
                http_response.headers['Content-type'] = 'application/json'
                return json.dumps({'success': False, 'error': str(e)})

            except ProfileAlreadyExists, e:
                http_response.headers['Content-type'] = 'application/json'
                return json.dumps({'success': False, 'error': str(e)})

            self.session.commit()

            http_response.headers['Content-type'] = 'application/json'
            return json.dumps({'success': True})

    def remove_indicator(self, indicator_id):
        user_name = http_request.environ.get("REMOTE_USER")

        if user_name:
            user = self.user_service.get_or_create_user(user_name)
        else:
            abort(401)

        if user:
            csrf_token_passed = http_request.GET.get('anti_csrf')
            csrf_token_session = session.get('anti_csrf')
            if csrf_token_passed and csrf_token_passed == csrf_token_session:
                try:
                    self.community_profile_service.remove_indicator(user, indicator_id)
                    self.session.commit()
                except toolkit.ObjectNotFound:
                    abort(404)
                except CantDeletePrivateIndicator, e:
                    abort(400, str(e))
                else:
                    came_from = http_request.GET.get('came_from')
                    if not came_from:
                        came_from = http_request.headers.get('Referer')

                    if came_from:
                        redirect(came_from)
                    else:
                        # if user deleted came_from parameter from the url and disabled referers in his browser,
                        # redirect him to the frontpage, after deleting the indicator
                        redirect('/')
            else:
                abort(400, "anti-CSRF tokens don't match")
        else:
            abort(401)

    def community_profile(self, community_name):
        user_name       = http_request.environ.get("REMOTE_USER")
        profile_to_load = http_request.GET.get('p')
        location        = http_request.environ.get("wsgiorg.routing_args")[1]['community_name']

        if user_name == None:
            user_name = "guest_" + str(datetime.date.today())

        if profile_to_load != None:
            community_name =  self.community_profile_service.get_community_profile_by_id(profile_to_load).name

        towns_raw, towns_names = http_request.GET.get('towns'), []
        if towns_raw:
            # parse town name
            towns_names = map(lambda x: x.strip(), towns_raw.split(','))

        user = self.user_service.get_or_create_user(user_name) if user_name else None

        try:
            community, indicators, displayed_towns = self.community_profile_service.get_indicators(community_name,
                                                                                                   towns_names,
                                                                                                   location,
                                                                                                   user)
            topics = TopicSerivce.get_topics('community_profile')
        except toolkit.ObjectNotFound as e:
            abort(404, detail=str(e))

        towns = self.community_profile_service.get_all_towns()
        displayed_towns_names = map(lambda t: t.name, displayed_towns)

        self.session.commit()

        anti_csrf_token = str(uuid.uuid4())
        session['anti_csrf'] = anti_csrf_token
        session.save()

        return base.render('community_profile.html', extra_vars={'location': location,
                                                                 'community': community,
                                                                 'indicators': indicators,
                                                                 'topics': topics,
                                                                 'displayed_towns': displayed_towns_names,
                                                                 'towns': towns,
                                                                 'anti_csrf_token': anti_csrf_token,
                                                                 'user': user})

    def save_as_default(self):
        user_name = http_request.environ.get("REMOTE_USER")
        json_body = json.loads(http_request.body, encoding=http_request.charset)
        ids       = json_body.get('indicator_ids').split(',')

        new_indicators = self.community_profile_service.get_indicators_by_ids(ids)
        old_indicators = self.community_profile_service.get_default_indicators()

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            user = self.user_service.get_or_create_user(user_name) if user_name else None
            if user.is_admin and sorted(new_indicators) != sorted(old_indicators):
                for old_indicator in old_indicators:
                    old_indicator.is_global = False
                for new_indicator in new_indicators:
                    new_indicator.is_global = True

                self.session.commit()

        return json.dumps({'success': True})

    def add_profile(self):
        user_name = http_request.environ.get("REMOTE_USER")
        json_body = json.loads(http_request.body, encoding=http_request.charset)
        ids       = json_body.get('indicator_ids')

        community_name  = json_body.get('community_name')

        if not user_name:
            abort(401)
        if http_request.method == 'POST':
            name = user_name + '_profile' + time.strftime("%H_%M_%S")
            profile = self.community_profile_service.create_community_profile(name, ids)
            if profile.id:
                return json.dumps({'success': True, 'redirect_link': '/community/' + community_name + '?p=' + str(profile.id) })
        else:
            return json.dumps({'success': False})

    def get_filters(self, dataset_id):
        http_response.headers['Content-type'] = 'application/json'

        try:
            dataset = DatasetService.get_dataset(dataset_id)
        except toolkit.ObjectNotFound:
            return json.dumps({'success': False, 'error': 'No datasets with this id'})

        result = []
        for dim in dataset.dimensions:
            if dim.name not in ['Town']:
                if dim.name == 'Race':
                    dim.possible_values.append('all')
                result.append({'name': dim.name, 'values': dim.possible_values})

        return json.dumps({'success': True, 'result': result})