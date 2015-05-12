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
from services import CompareService

from IPython import embed
from termcolor import colored

class CompareController(base.BaseController):
    def __init__(self):
        self.session         = Database().session_factory()
        self.user_service    = UserService(self.session)
        self.compare_service = CompareService

    def compare(self):
        dataset_names = toolkit.get_action('package_list')(data_dict={})
        return base.render('compare/compare.html', extra_vars={'dataset_names': dataset_names})

    def load_comparable_datasets(self, dataset_name):
        array = self.compare_service.get_comparable_datasets(dataset_name)
        embed()
         # html  = base.render('communities/snippets/indicator_popup.html', extra_vars={'topics': topics, 'geography_types': geography_types})
        return json.dumps({'success': True, 'html': ''})
