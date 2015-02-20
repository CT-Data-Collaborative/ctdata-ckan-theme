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
from ..topic.services import TopicSerivce
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from ..community.services import CommunityProfileService, ProfileAlreadyExists, CantDeletePrivateIndicator

from services import LocationService

from IPython import embed
from termcolor import colored

class LocationsController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service     = UserService(self.session)
        self.location_service = LocationService(self.session)

    def show(self, location_name):
        location = self.location_service.get_location(location_name)
        return base.render('location/show.html', extra_vars={'location': location})

    def data_by_location(self):
        locations = self.location_service.get_all_locations()

        return base.render('location/data_by_location.html', extra_vars={'locations': locations})

    def manage_locations(self):
        locations = self.location_service.get_all_locations()

        return base.render('location/manage_locations.html', extra_vars={'locations': locations})

    def create_location(self):
        if http_request.method == 'POST':
            json_body = json.loads(http_request.body, encoding=http_request.charset)
            name      = json_body.get('name')
            fips      = json_body.get('fips')

            location  = self.location_service.create(name, fips)

        http_response.headers['Content-type'] = 'application/json'
        return json.dumps({'location_name': location.name, 'location_fips': location.fips})

    # def community_profile(self, community_name):
    #     location        = http_request.environ.get("wsgiorg.routing_args")[1]['community_name']
    #     profile_to_load = http_request.GET.get('p')

    #     if profile_to_load:
    #         community = self.community_profile_service.get_community_profile_by_id(profile_to_load)
    #     else:
    #         community = self.community_profile_service.get_community_profile(community_name)

    #     self.session.commit()
    #     anti_csrf_token = str(uuid.uuid4())
    #     session['anti_csrf'] = anti_csrf_token
    #     session.save()

    #     default_url = '/community/' + location
    #     return base.render('communities/community_profile.html', extra_vars={'location': location,
    #                                                              'community': community,
    #                                                              'displayed_towns': towns_names,
    #                                                              'towns_raw': towns_raw,
    #                                                              'towns': towns,
    #                                                              'anti_csrf_token': anti_csrf_token,
    #                                                              'default_url': default_url})
