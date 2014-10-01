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

        print "\nQUERY:", query
        print "QUERY PARAMS:", values

        conn = self.database.connect()
        if conn:
            curs = conn.cursor()
            curs.execute(query, values)

            cols = self.query_builder.get_columns(filters)
            rows = curs.fetchall()
            print "\nRAW VALUES:", rows
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

        towns_from_filters = dict_with_key_value('field', 'Town', filters)['values']
        years_from_filters = dict_with_key_value('field', 'Year', filters)['values']
        sorted_towns = sorted(towns_from_filters)
        sorted_years = sorted(map(lambda y: int(y), years_from_filters))
        if towns_from_filters[0].lower() == 'all':
            sorted_towns = []
            sorted_years = []

        # used to determine for which towns or years there was no data returned
        check_town, check_year = 0, 0

        # there're currently no tests for the following algoritm of determining skips in data, so I really, really
        # advise anybody who'll continue working on the project to add them. The algorithm, basically, makes sure
        # that for every town and year specified in the filters, there would be some value (actual value or None) in the
        # result, even if db didn't return the values for these towns or years.
        last_town_name = None
        current_town = None
        for row in data:
            if row['Town'] != last_town_name:
                if last_town_name:
                    while check_year < len(sorted_years):
                        result['data'][-1]['data'].append(None)
                        check_year += 1
                # if some of the towns was skipped, append None values for them in the result
                while check_town < len(sorted_towns) and row['Town'] != sorted_towns[check_town]:
                    print 'place 1'
                    result['data'].append({'name': sorted_towns[check_town], 'data': [None]*len(sorted_years)})
                    check_town += 1
                current_town = {'name': row['Town'], 'data': []}
                last_town_name = row['Town']
                check_town += 1
                check_year = 0

                result['data'].append(current_town)

            # if some of the years was skipped, append None values for them for current town
            while check_year < len(sorted_years) and int(row['Year']) != sorted_years[check_year]:
                check_year += 1
                current_town['data'].append(None)

            try:
                current_town['data'].append(float(row['Value']))
            except ValueError:
                current_town['data'].append(None)

            check_year += 1

        if result['data']:
            while check_year < len(sorted_years):
                result['data'][-1]['data'].append(None)
                check_year += 1

        while check_town < len(sorted_towns):
            print 'place 2'
            result['data'].append({'name': sorted_towns[check_town], 'data': [None]*len(years_from_filters)})
            check_town += 1
        print "\nPROCESSED VALUES:", result
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
