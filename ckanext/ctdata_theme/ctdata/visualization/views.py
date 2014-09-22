from ckanext.ctdata_theme.ctdata.utils import dict_with_key_value
from ckanext.ctdata_theme.ctdata.database import Database


class View(object):
    def __init__(self, query_builder):
        self.query_builder = query_builder

    def convert_data(self, data, filters):
        result = {'years': dict_with_key_value('field', 'Year', filters)['values']}
        return result

    def get_data(self, filters):
        query, values = self.query_builder.get_query(filters)

        print query, values

        d = Database()
        conn = d.connect()
        if conn:
            curs = conn.cursor()
            curs.execute(query, values)

            result = self.convert_data(curs.fetchall(), filters)

            conn.commit()

        return result


class TableView(View):
    def __init__(self, query_builder):
        super(TableView, self).__init__(query_builder)

    def convert_data(self, data, filters):
        result = super(TableView, self).convert_data(data, filters)
        multifield = self.query_builder.determine_multifield(filters)

        result['multifield'] = multifield
        result['data'] = []
        cols = self.query_builder.get_columns(filters)

        last_town = None
        last_mf = None  # last multifield
        last_mt = None  # last measure type

        current_town = None
        current_mf = None  # current multifield
        current_mt = None  # current measure type
        for row in map(lambda r: dict(zip(cols, r)), data):
            if row['Town'] != last_town:
                current_mt = {'measure_type': row['Measure Type'], 'data': []}
                last_mt = row['Measure Type']

                current_mf = {'value': row[multifield], 'data': [current_mt]}
                last_mf = row[multifield]

                current_town = {'town': row['Town'], 'multi_field': [current_mf]}
                last_town = row['Town']

                result['data'].append(current_town)

            if row[multifield] != last_mf:
                current_mt = {'measure_type': row['Measure Type'], 'data': []}
                last_mt = row['Measure Type']

                current_mf = {'value': row[multifield], 'data': [current_mt]}
                last_mf = row[multifield]

                current_town['multifield'].append(current_mf)

            if row['Measure Type'] != last_mt:
                current_mt = {'measure_type': row['Measure Type'], 'data': []}
                last_mt = row['Measure Type']

                current_mf['data'].append(current_mt)

            current_mt['data'].append(float(row['Value']))

        return result


class ChartView(View):
    def convert_data(self, data, filters):
        result = super(ChartView, self).convert_data(data, filters)
        result['data'] = []

        cols = self.query_builder.get_columns(filters)

        last_town = None
        current_town = None
        for row in map(lambda r: dict(zip(cols, r)), data):
            if row['Town'] != last_town:
                current_town = {'town': row['Town'], 'data': []}
                last_town = row['Town']

                result['data'].append(current_town)

            current_town['data'].append(float(row['Value']))

        return result


class ViewFactory(object):
    @staticmethod
    def get_view(name, querybuilder):
        if name == 'table':
            return TableView(querybuilder)
        elif name == 'chart':
            return ChartView(querybuilder)