from ckanext.ctdata_theme.ctdata.utils import dict_with_key_value
from ckanext.ctdata_theme.ctdata.database import Database


class View(object):
    """
    Gets a query from the QueryBuilder and uses it to retrieve the data from the DB.
    """
    def __init__(self, query_builder, database=None):
        self.query_builder = query_builder
        if not database:
            self.database = Database()
        else:
            self.database = database

    def convert_data(self, data, filters):
        """
        Converts data retrieved from the DB into a python data tructure (lists, dicts).
        Intended to be overriden by descendants.

        :param data: rows of data from the db with information about column names
        ([{'column name': 'column value', ...}, ...]
        """
        result = {'years': dict_with_key_value('field', 'Year', filters)['values']}
        return result

    def get_data(self, filters):
        query, values = self.query_builder.get_query(filters)

        conn = self.database.connect()
        if conn:
            curs = conn.cursor()
            curs.execute(query, values)

            cols = self.query_builder.get_columns(filters)
            rows = curs.fetchall()
            result = self.convert_data(map(lambda r: dict(zip(cols, r)), rows), filters)

            conn.commit()

        return result


class TableView(View):
    def convert_data(self, data, filters):
        result = super(TableView, self).convert_data(data, filters)
        multifield = self.query_builder.determine_multifield(filters)

        result['multifield'] = multifield
        result['data'] = []

        last_town = None
        last_mf = None  # last multifield
        last_mt = None  # last measure type

        current_town = None
        current_mf = None  # current multifield
        current_mt = None  # current measure type
        # groups data first by Town, then by multifield and then by Measure Type
        for row in data:
            #Don't include row if it doesn't have a value for the multifield
            if row[multifield] == "NA":
              continue
            if row['Town'] != last_town:
                current_mt = {'measure_type': row['Measure Type'], 'data': []}
                last_mt = row['Measure Type']

                current_mf = {'value': str(row[multifield]), 'data': [current_mt]}
                last_mf = row[multifield]

                current_town = {'town': row['Town'], 'multifield': [current_mf]}
                last_town = row['Town']

                result['data'].append(current_town)

            if row[multifield] != last_mf:
                current_mt = {'measure_type': row['Measure Type'], 'data': []}
                last_mt = row['Measure Type']

                current_mf = {'value': str(row[multifield]), 'data': [current_mt]}
                last_mf = row[multifield]

                current_town['multifield'].append(current_mf)

            if row['Measure Type'] != last_mt:
                current_mt = {'measure_type': row['Measure Type'], 'data': []}
                last_mt = row['Measure Type']

                current_mf['data'].append(current_mt)

            try:
                current_mt['data'].append(float(row['Value']))
            except ValueError:
                current_mt['data'].append(None)
        return result


class ChartView(View):
    def convert_data(self, data, filters):
        result = super(ChartView, self).convert_data(data, filters)
        result['data'] = []

        last_town = None
        current_town = None
        for row in data:
            if row['Town'] != last_town:
                current_town = {'name': row['Town'], 'data': []}
                last_town = row['Town']

                result['data'].append(current_town)
            try:
                current_town['data'].append(float(row['Value']))
            except ValueError:
                current_town['data'].append(None)
        return result


class ProfileView(ChartView):
    def convert_data(self, data, filters):
        result = super(ProfileView, self).convert_data(data, filters)
        # there should only be one measure type for all the rows
        if data:
            result['data_type'] = data[0]['Measure Type']

        return result


class MapView(View):
    def convert_data(self, data, filters):
        result = super(MapView, self).convert_data(data, filters)
        result['data'] = []

        for row in data:
            result['data'].append({'code': row['Town'], 'value': float(row['Value'])})

        return result


class ViewFactory(object):
    @staticmethod
    def get_view(name, querybuilder, database=None):
        if name == 'table':
            return TableView(querybuilder, database)
        elif name == 'chart':
            return ChartView(querybuilder, database)
        elif name == 'profile':
            return ProfileView(querybuilder, database)
        elif name == 'map':
            return MapView(querybuilder, database)
