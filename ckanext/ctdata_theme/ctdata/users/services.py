import ckan.plugins.toolkit as toolkit

from ..community.models import UserInfo
import datetime

class UserService(object):
    def __init__(self, session):
        self.session = session

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
        else:
            user = self.session.query(UserInfo).filter(UserInfo.ckan_user_id == user_id).first()
            if not user:
                user = UserInfo("guest_" + session_id, False)
                self.session.add(user)
        return user