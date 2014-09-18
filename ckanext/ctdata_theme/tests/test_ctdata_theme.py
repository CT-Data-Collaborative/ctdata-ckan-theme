import paste.fixture
import pylons.test
import pylons.config as config
import webtest

import ckan.model as model
import ckan.tests as tests
import ckan.plugins
import ckan.new_tests.factories as factories

from ckan.lib.helpers import url_for


class TestCTDataTheme(object):
    @classmethod
    def setup_class(cls):
        cls.app = paste.fixture.TestApp(pylons.test.pylonsapp)

        ckan.plugins.load('ctdata_theme')

    def teardown(self):
        model.repo.rebuild_db()

    @classmethod
    def teardown_class(cls):
        ckan.plugins.unload('ctdata_theme')

    def _create_datasets(self):
        sysadmin = factories.User()

        self.ed_dataset1 = tests.call_action_api(self.app, 'package_create',
                                                 apikey=sysadmin['apikey'], name='ed_dataset1',
                                                 extras=[{'key': 'Domain', 'value': 'Education'},
                                                         {'key': 'Subdomain', 'value': 'TestSubtopic1'}])
        self.ed_dataset2 = tests.call_action_api(self.app, 'package_create',
                                                 apikey=sysadmin['apikey'], name='ed_dataset2',
                                                 extras=[{'key': 'Domain', 'value': 'Education'},
                                                         {'key': 'Subdomain', 'value': 'TestSubtopic1'}])
        self.ed_dataset3 = tests.call_action_api(self.app, 'package_create',
                                                 apikey=sysadmin['apikey'], name='ed_dataset3',
                                                 extras=[{'key': 'Domain', 'value': 'Education'},
                                                         {'key': 'Subdomain', 'value': 'TestSubtopic2'}])
        self.ed_dataset4 = tests.call_action_api(self.app, 'package_create',
                                                 apikey=sysadmin['apikey'], name='ed_dataset4',
                                                 extras=[{'key': 'Domain', 'value': 'Health'},
                                                         {'key': 'Subdomain', 'value': 'TestSubtopic3'}])

    def test_data_by_topic_returns_correct_structure(self):
        self._create_datasets()
        r = self.app.get("/data_by_topic")
        print r.tmpl_context.pylons['domains']
        assert False