import ckan.plugins.toolkit as toolkit

from ..community.models import UserInfo
import datetime
import ckan.model as model
import ckan.logic as logic
from IPython import embed
from ckan.common import c

get_action      = logic.get_action

class UserService(object):
    def __init__(self, session):
        self.session = session

    def check_if_email_exits(self, email):
        context   = {'model': model, 'session': model.Session,
                     'user': c.user or c.author, 'for_view': True,
                     'auth_user_obj': c.userobj}
        data_dict, groups_dict = {}, {}

        users  = get_action('user_list')(context, data_dict)
        result = filter(lambda user: user['email'] == email, users)
        return result != []

    def get_user_by_email(self, email):
        context   = {'model': model, 'session': model.Session,
                     'user': c.user or c.author, 'for_view': True,
                     'auth_user_obj': c.userobj}
        data_dict, groups_dict = {}, {}

        users  = get_action('user_list')(context, data_dict)
        result = filter(lambda user: user['email'] == email, users)
        if result != []:
            return result[0]
        else:
            return None

    def get_user_by_id(self, id):
        context   = {'model': model, 'session': model.Session,
                     'user': c.user or c.author, 'for_view': True,
                     'auth_user_obj': c.userobj}
        data_dict, groups_dict = {}, {}

        users  = get_action('user_list')(context, data_dict)
        result = filter(lambda user: user['id'] == id, users)
        if result != []:
            return result[0]
        else:
            return None

    def get_user_state(self, user_id):

        user_info = toolkit.get_action('user_show')(data_dict={'id': user_id})
        user = self.session.query(UserInfo).filter(UserInfo.ckan_user_id == user_info['id']).first()

        return user_info['state']

    def get_or_create_user(self, user_id):
        # user_id must be passed
        assert user_id is not None

        if user_id != 'guest_' + str(datetime.date.today()):
            user_info = toolkit.get_action('user_show')(data_dict={'id': user_id})
            user = self.session.query(UserInfo).filter(UserInfo.ckan_user_id == user_info['id']).first()
            if not user:
                user = UserInfo(user_info['id'], user_info['sysadmin'])
                self.session.add(user)
        else:
            user = self.session.query(UserInfo).filter(UserInfo.ckan_user_id == user_id).first()
            if not user:
                user = UserInfo("guest_" + str(datetime.date.today()), False)
                self.session.add(user)
        return user


    def get_or_create_user_with_session_id(self, user_id, session_id):
        # user_id must be passed
        assert user_id is not None

        if user_id != 'guest_' + session_id:
            user_info = toolkit.get_action('user_show')(data_dict={'id': user_id})
            user = self.session.query(UserInfo).filter(UserInfo.ckan_user_id == user_info['id']).first()
            if not user:
                user = UserInfo(user_info['id'], user_info['sysadmin'])
                self.session.add(user)
                self.session.commit()
        else:
            user = self.session.query(UserInfo).filter(UserInfo.ckan_user_id == user_id).first()
            if not user:
                user = UserInfo("guest_" + session_id, False)
                self.session.add(user)
                self.session.commit()
        return user