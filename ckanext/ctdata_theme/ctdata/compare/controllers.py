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
# from services import CommunityProfileService, ProfileAlreadyExists, CantDeletePrivateIndicator
from ..location.services import LocationService

from IPython import embed
from termcolor import colored

class CompareController(base.BaseController):
    def __init__(self):
        self.session = Database().session_factory()
        self.user_service     = UserService(self.session)
        self.location_service = LocationService(self.session)

    def compare(self):
        dataset_names = toolkit.get_action('package_list')(data_dict={})
        return base.render('compare/compare.html', extra_vars={'dataset_names': dataset_names})

    # def get_topics(self):
    #     http_response.headers['Content-type'] = 'application/json'
    #     geography_types = self.location_service.location_geography_types()
    #     topics          = TopicSerivce.get_topics('community_profile')


    #     html  = base.render('communities/snippets/indicator_popup.html', extra_vars={'topics': topics, 'geography_types': geography_types})

    #     return json.dumps({'success': True, 'html': html})


