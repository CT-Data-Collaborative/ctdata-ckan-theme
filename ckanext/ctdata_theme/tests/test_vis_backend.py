from ckanext.ctdata_theme.ctdata.visualization.querybuilders import QueryBuilderFactory
from ckanext.ctdata_theme.ctdata.visualization.views import ViewFactory
import ckanext.ctdata_theme.ctdata.database

from mocks.mocks import *


class TestQueryBuilders(object):

    @classmethod
    def setup_class(cls):
        cls.ds = MockDataset('testtable', map(lambda x: MockDimension(x),
                                              ['Town', 'Year', 'Measure Type', 'Race', 'Variable', 'Value']))

    def test_chart_builder_basic(self):
        b = QueryBuilderFactory.get_query_builder('chart', self.ds)
        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['White']}]
        q, v = b.get_query(filters)
        assert v == ['2012', '2013', 'Andover', 'Ansonia', 'Percent', 'Basic', 'White']
        assert q.strip() == '''SELECT "Town","Year","Measure Type","Value" FROM public."testtable" WHERE "Year" in (%s,%s) and "Town" in (%s,%s) and "Measure Type" in (%s) and "Variable" = %s and "Race" = %s\nORDER BY "Town","Year"''', 'ChartQueryBuilder returns wrong sql (basic filter values)'

    def test_chart_builder_race_all(self):
        b = QueryBuilderFactory.get_query_builder('chart', self.ds)
        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['all']}]
        q, v = b.get_query(filters)
        assert v == ['2012', '2013', 'Andover', 'Ansonia', 'Percent', 'Basic']
        assert q.strip() == '''SELECT "Town","Year","Measure Type",SUM("Value") FROM public."testtable" WHERE "Year" in (%s,%s) and "Town" in (%s,%s) and "Measure Type" in (%s) and "Variable" = %s\nGROUP BY "Town","Year","Measure Type"\nORDER BY "Town","Year"''', 'ChartQueryBuilder returns wrong sql (one "all" value)'

    def test_chart_builder_several_alls(self):
        b = QueryBuilderFactory.get_query_builder('chart', self.ds)
        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['all']},
                   {'field': 'Race', 'values': ['all']}]
        q, v = b.get_query(filters)
        assert v == ['2012', '2013', 'Andover', 'Ansonia', 'Percent']
        assert q.strip() == '''SELECT "Town","Year","Measure Type",SUM("Value") FROM public."testtable" WHERE "Year" in (%s,%s) and "Town" in (%s,%s) and "Measure Type" in (%s)\nGROUP BY "Town","Year","Measure Type"\nORDER BY "Town","Year"''', 'ChartQueryBuilder returns wrong sql (several "all" values)'

    def test_table_builder_basic(self):
        b = QueryBuilderFactory.get_query_builder('table', self.ds)
        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['White']}]
        q, v = b.get_query(filters)
        assert v == ['2012', '2013', 'Andover', 'Ansonia', 'Percent', 'Basic', 'White']
        assert q.strip() == '''SELECT "Town","Variable","Year","Measure Type","Value" FROM public."testtable" WHERE "Year" in (%s,%s) and "Town" in (%s,%s) and "Measure Type" in (%s) and "Variable" = %s and "Race" = %s\nORDER BY "Town","Variable","Measure Type","Year"''', 'TableQueryBuilder returns wrong sql (basic filter values)'

    def test_table_builder_all(self):
        b = QueryBuilderFactory.get_query_builder('table', self.ds)
        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['all']}]
        q, v = b.get_query(filters)
        assert v == ['2012', '2013', 'Andover', 'Ansonia', 'Percent', 'Basic']
        assert q.strip() == '''SELECT "Town","Variable","Year","Measure Type",SUM("Value") FROM public."testtable" WHERE "Year" in (%s,%s) and "Town" in (%s,%s) and "Measure Type" in (%s) and "Variable" = %s\nGROUP BY "Town","Variable","Year","Measure Type"\nORDER BY "Town","Variable","Measure Type","Year"''', 'TableQueryBuilder returns wrong sql (one "all" value)'

    def test_table_builder_multifield(self):
        b = QueryBuilderFactory.get_query_builder('table', self.ds)
        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['White', 'Black']}]
        q, v = b.get_query(filters)
        assert v == ['2012', '2013', 'Andover', 'Ansonia', 'Percent', 'Basic', 'White', 'Black']
        assert q.strip() == '''SELECT "Town","Race","Year","Measure Type","Value" FROM public."testtable" WHERE "Year" in (%s,%s) and "Town" in (%s,%s) and "Measure Type" in (%s) and "Variable" = %s and "Race" in (%s,%s)\nORDER BY "Town","Race","Measure Type","Year"''', 'TableQueryBuilder returns wrong sql (multifield value)'

    def test_map_builder_basic(self):
        b = QueryBuilderFactory.get_query_builder('map', self.ds)
        filters = [{'field': 'Year', 'values': ['2012']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['White']}]
        q, v = b.get_query(filters)
        assert v == ['2012', 'Andover', 'Ansonia', 'Percent', 'Basic', 'White']
        assert q.strip() == '''SELECT "Town","Value" FROM public."testtable" WHERE "Year" in (%s) and "Town" in (%s,%s) and "Measure Type" in (%s) and "Variable" = %s and "Race" = %s''', 'MapQueryBuilder returns wrong sql (basic filter values)'

    def test_map_builder_all(self):
        b = QueryBuilderFactory.get_query_builder('map', self.ds)
        filters = [{'field': 'Year', 'values': ['2012']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['all']}]
        q, v = b.get_query(filters)
        assert v == ['2012', 'Andover', 'Ansonia', 'Percent', 'Basic']
        assert q.strip() == '''SELECT "Town",SUM("Value") FROM public."testtable" WHERE "Year" in (%s) and "Town" in (%s,%s) and "Measure Type" in (%s) and "Variable" = %s\nGROUP BY "Town"''', 'MapQueryBuilder returns wrong sql (one "all" value)'


class TestViews(object):

    @classmethod
    def setup_class(cls):
        cls.ds = MockDataset('testtable', map(lambda x: MockDimension(x),
                                              ['Town', 'Year', 'Measure Type', 'Race', 'Variable', 'Value']))
        cls.db = MockDatabase()

    def test_chart_view(self):
        self.db.set_data([["Andover", "2012", "Percent", 92.5],
                          ["Andover", "2013", "Percent", 82.1],
                          ["Ansonia", "2012", "Percent", 68.1],
                          ["Ansonia", "2013", "Percent", 55]])
        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Proficient or Above']},
                   {'field': 'Race', 'values': ['White']}]
        qb = QueryBuilderFactory.get_query_builder('chart', self.ds)
        view = ViewFactory.get_view('chart', qb, self.db)
        data = view.get_data(filters)
        assert data['years'] == ['2012', '2013']
        town1 = data['data'][0]
        assert town1['name'] == 'Andover'
        assert town1['data'] == [92.5, 82.1]
        town2 = data['data'][1]
        assert town2['name'] == 'Ansonia'
        assert town2['data'] == [68.1, 55]

    def test_table_view(self):
        self.db.set_data([["Andover", "Goal or Above", "2012", "Number", 33],
                          ["Andover", "Goal or Above", "2013", "Number", 27],
                          ["Andover", "Goal or Above", "2012", "Percent", 82.5],
                          ["Andover", "Goal or Above", "2013", "Percent", 69.2],
                          ["Andover", "Proficient or Above", "2012", "Number", 37],
                          ["Andover", "Proficient or Above", "2013", "Number", 32],
                          ["Andover", "Proficient or Above", "2012", "Percent", 92.5],
                          ["Andover", "Proficient or Above", "2013", "Percent", 82.1],
                          ["Ansonia", "Goal or Above", "2012", "Number", 49],
                          ["Ansonia", "Goal or Above", "2013", "Number", 41],
                          ["Ansonia", "Goal or Above", "2012", "Percent", 52.1],
                          ["Ansonia", "Goal or Above", "2013", "Percent", 47.7],
                          ["Ansonia", "Proficient or Above", "2012", "Number", 64],
                          ["Ansonia", "Proficient or Above", "2013", "Number", 55],
                          ["Ansonia", "Proficient or Above", "2012", "Percent", 68.1],
                          ["Ansonia", "Proficient or Above", "2013", "Percent", 64]])

        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent', 'Number']},
                   {'field': 'Variable', 'values': ['Proficient or Above', 'Goal or Above']},
                   {'field': 'Race', 'values': ['White']}]
        qb = QueryBuilderFactory.get_query_builder('table', self.ds)
        view = ViewFactory.get_view('table', qb, self.db)
        data = view.get_data(filters)
        res = {
            'years': ['2012', '2013'],
            'multifield': 'Variable',
            'data': [
                {'town': 'Andover',
                 'multifield': [
                     {'value': 'Goal or Above', 'data': [
                         {'measure_type': 'Number', 'data': [33, 27]},
                         {'measure_type': 'Percent', 'data': [82.5, 69.2]}
                     ]},
                     {'value': 'Proficient or Above', 'data': [
                         {'measure_type': 'Number', 'data': [37, 32]},
                         {'measure_type': 'Percent', 'data': [92.5, 82.1]}
                     ]},
                 ]},
                {'town': 'Ansonia',
                 'multifield': [
                     {'value': 'Goal or Above', 'data': [
                         {'measure_type': 'Number', 'data': [49, 41]},
                         {'measure_type': 'Percent', 'data': [52.1, 47.7]}
                     ]},
                     {'value': 'Proficient or Above', 'data': [
                         {'measure_type': 'Number', 'data': [64, 55]},
                         {'measure_type': 'Percent', 'data': [68.1, 64]}
                     ]},
                 ]},
            ]
        }
        assert data == res

    def test_table_view_race_all(self):
        self.db.set_data([["Andover", "Goal or Above", "2012", "Number", 33],
                          ["Andover", "Goal or Above", "2013", "Number", 27],
                          ["Andover", "Goal or Above", "2012", "Percent", 82.5],
                          ["Andover", "Goal or Above", "2013", "Percent", 69.2],
                          ["Andover", "Proficient or Above", "2012", "Number", 37],
                          ["Andover", "Proficient or Above", "2013", "Number", 32],
                          ["Andover", "Proficient or Above", "2012", "Percent", 92.5],
                          ["Andover", "Proficient or Above", "2013", "Percent", 82.1],
                          ["Ansonia", "Goal or Above", "2012", "Number", 49],
                          ["Ansonia", "Goal or Above", "2013", "Number", 41],
                          ["Ansonia", "Goal or Above", "2012", "Percent", 52.1],
                          ["Ansonia", "Goal or Above", "2013", "Percent", 47.7],
                          ["Ansonia", "Proficient or Above", "2012", "Number", 64],
                          ["Ansonia", "Proficient or Above", "2013", "Number", 55],
                          ["Ansonia", "Proficient or Above", "2012", "Percent", 68.1],
                          ["Ansonia", "Proficient or Above", "2013", "Percent", 64]])

        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent', 'Number']},
                   {'field': 'Variable', 'values': ['Proficient or Above', 'Goal or Above']},
                   {'field': 'Race', 'values': ['all']}]
        qb = QueryBuilderFactory.get_query_builder('table', self.ds)
        view = ViewFactory.get_view('table', qb, self.db)
        data = view.get_data(filters)
        res = {
            'years': ['2012', '2013'],
            'multifield': 'Variable',
            'data': [
                {'town': 'Andover',
                 'multifield': [
                     {'value': 'Goal or Above', 'data': [
                         {'measure_type': 'Number', 'data': [33, 27]},
                         {'measure_type': 'Percent', 'data': [82.5, 69.2]}
                     ]},
                     {'value': 'Proficient or Above', 'data': [
                         {'measure_type': 'Number', 'data': [37, 32]},
                         {'measure_type': 'Percent', 'data': [92.5, 82.1]}
                     ]},
                 ]},
                {'town': 'Ansonia',
                 'multifield': [
                     {'value': 'Goal or Above', 'data': [
                         {'measure_type': 'Number', 'data': [49, 41]},
                         {'measure_type': 'Percent', 'data': [52.1, 47.7]}
                     ]},
                     {'value': 'Proficient or Above', 'data': [
                         {'measure_type': 'Number', 'data': [64, 55]},
                         {'measure_type': 'Percent', 'data': [68.1, 64]}
                     ]},
                 ]},
            ]
        }
        assert data == res

    def test_table_view_one_multifield(self):
        self.db.set_data([["Andover", "Goal or Above", "2012", "Number", 33],
                          ["Andover", "Goal or Above", "2013", "Number", 27],
                          ["Andover", "Goal or Above", "2012", "Percent", 82.5],
                          ["Andover", "Goal or Above", "2013", "Percent", 69.2],
                          ["Ansonia", "Goal or Above", "2012", "Number", 49],
                          ["Ansonia", "Goal or Above", "2013", "Number", 41],
                          ["Ansonia", "Goal or Above", "2012", "Percent", 52.1],
                          ["Ansonia", "Goal or Above", "2013", "Percent", 47.7]])

        filters = [{'field': 'Year', 'values': ['2012', '2013']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent', 'Number']},
                   {'field': 'Variable', 'values': ['Goal or Above']},
                   {'field': 'Race', 'values': ['White']}]
        qb = QueryBuilderFactory.get_query_builder('table', self.ds)
        view = ViewFactory.get_view('table', qb, self.db)
        data = view.get_data(filters)
        res = {
            'years': ['2012', '2013'],
            'multifield': 'Variable',
            'data': [
                {'town': 'Andover',
                 'multifield': [
                     {'value': 'Goal or Above', 'data': [
                         {'measure_type': 'Number', 'data': [33, 27]},
                         {'measure_type': 'Percent', 'data': [82.5, 69.2]}
                     ]}
                 ]},
                {'town': 'Ansonia',
                 'multifield': [
                     {'value': 'Goal or Above', 'data': [
                         {'measure_type': 'Number', 'data': [49, 41]},
                         {'measure_type': 'Percent', 'data': [52.1, 47.7]}
                     ]}
                 ]},
            ]
        }
        assert data == res

    def test_map_view(self):
        self.db.set_data([["Andover", 100],
                          ["Ansonia", 200]])

        filters = [{'field': 'Year', 'values': ['2012']},
                   {'field': 'Town', 'values': ['Andover', 'Ansonia']},
                   {'field': 'Measure Type', 'values': ['Percent']},
                   {'field': 'Variable', 'values': ['Basic']},
                   {'field': 'Race', 'values': ['White']}]

        qb = QueryBuilderFactory.get_query_builder('map', self.ds)
        view = ViewFactory.get_view('map', qb, self.db)

        data = view.get_data(filters)
        res = {
            'years': ['2012'],
            'data': [
                {'code': 'Andover',
                 'value': 100},
                {'code': 'Ansonia',
                 'value': 200},
            ]
        }

        assert data == res