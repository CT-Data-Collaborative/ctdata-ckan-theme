import ckan.plugins.toolkit as toolkit

from ..community.models import UserInfo


class UserService(object):
    def __init__(self, session):
        self.session = session

    def get_or_create_user(self, user_id):
        if user_id:
            user_info = toolkit.get_action('user_show')(data_dict={'id': user_id})
        user = self.session.query(UserInfo).filter(UserInfo.ckan_user_id == user_info['id']).first()
        if not user:
            user = UserInfo(user_info['id'], user_info['sysadmin'])
            self.session.add(user)
        return user