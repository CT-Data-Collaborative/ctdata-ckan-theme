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
from ckan.controllers.group import GroupController
from IPython import embed

import ckan.logic as logic
get_action = logic.get_action

class GroupController(GroupController):
    def __init__(self):
        self.session = Database().session_factory()
        self.community_profile_service = CommunityProfileService(self.session)
        self.user_service = UserService(self.session)

    def group_indicators(self):
      id = http_request.environ.get('wsgiorg.routing_args')[1]['group_id']
      context = {'model': model, 'session': model.Session,
                   'user': c.user or c.author, 'for_view': True}
      group = get_action('group_show')(context, {'id': id})
      c.group_dict = group
      user_name = http_request.environ.get("REMOTE_USER")
      group_indicators = self.community_profile_service.get_group_indicators(group['id'])

      if not user_name:
        group_indicators = filter(lambda ind: ind.permission == 'public', group_indicators)
      else:
        group_user_names = map(lambda user: user['name'], group['users'])

        if user_name not in group_user_names:
          group_indicators = filter(lambda ind: ind.permission == 'public', group_indicators)

      return base.render('group/indicators.html', extra_vars={'group_indicators': group_indicators})
