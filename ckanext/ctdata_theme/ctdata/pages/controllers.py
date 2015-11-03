import json
import uuid
import datetime

from pylons.controllers.util import abort, redirect
from pylons import session, url


import ckan.lib.base as base
import ckan.lib.helpers as h
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.common import response as http_response, request as http_request

from ..database import Database
from ..users.services import UserService
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from ..topic.services import TopicSerivce
from IPython import embed

class PageController(base.BaseController):

    def about(self):
        return redirect(h.url_for("http://ctdata.org/about"))
        # return  base.render('pages/about.html', extra_vars={})

    def news(self):
        return redirect(h.url_for("http://ctdata.org/blog"))
        # return  base.render('pages/news.html', extra_vars={})

    def special_projects(self):
        return redirect(h.url_for("http://ctdata.org/special_projects"))
        # return  base.render('pages/special_projects.html', extra_vars={})

    def data_gallery(self):
        domains = TopicSerivce.get_topics_with_indicators('data_gallery')
        return  base.render('data_gallery.html', extra_vars={'show_green_logo': True, 'domains': domains})
