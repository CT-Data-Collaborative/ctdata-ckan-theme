import datetime

from ckanext.ctdata_theme.ctdata.utils import dict_with_key_value
from sets import Set
from ckanext.ctdata_theme.ctdata.database import Database
from IPython import embed
import psycopg2

from termcolor import colored

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
        result = {}
        years = dict_with_key_value('field', 'Year', filters)
        if years:
            result = {'years': years['values']}
        return result

    def get_data(self, filters):
        query, values = self.query_builder.get_query(filters)
        result = {}
        try:
            conn = self.database.connect()
            if conn:
                curs = conn.cursor()
                curs.execute(query, values)

                cols = self.query_builder.get_columns(filters)
                rows = curs.fetchall()

                result = self.convert_data(map(lambda r: dict(zip(cols, r)), rows), filters)

                conn.commit()

                curs.close()
                del curs
                conn.close()

        except psycopg2.ProgrammingError:
            result['data'] = []
        return  result

    def get_compatibles(self, filters):
      cols = self.query_builder.get_columns(filters)

      conn = self.database.connect()
      compatibles = []

      geography       = filter(lambda x: x['key'] == 'Geography', self.query_builder.dataset.ckan_meta['extras'])
      geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

      towns_from_filters = dict_with_key_value('field', geography_param, filters)
      if towns_from_filters and towns_from_filters['values'][0] == 'all':
        for f in filters:
          if f['field'] == geography_param:
            pass
            filters.remove(f)
      if conn:
        curs = conn.cursor()
        for cur_col in cols:
          processed_filters = []
          filters_values = []
          for f in filters:
            if f['field'] != cur_col:
              column_name, values = f['field'], f['values']
              filter_string = '"%s" in (%s)' % (column_name, ','.join(['%s'] * len(values)))
              processed_filters.append(filter_string)
              filters_values = filters_values + values
          filters_string = ' and '.join(processed_filters)
          if filters_string:
            query = '''SELECT DISTINCT "%s" FROM public."%s" WHERE %s''' % (cur_col, self.query_builder.dataset.table_name, filters_string)
          else:
            query = '''SELECT DISTINCT "%s" FROM public."%s"''' % (cur_col, self.query_builder.dataset.table_name)
          curs.execute(query, filters_values)
          rows = curs.fetchall()
          for row in rows:
            compatibles.append({ cur_col: str(row[0])})

        curs.close()
        del curs
        conn.close()
      return compatibles

class TableView(View):
    def convert_data(self, data, filters):
        result = super(TableView, self).convert_data(data, filters)
        multifield = self.query_builder.determine_multifield(filters)

        result['multifield'] = multifield
        result['data'] = []

        geography       = filter(lambda x: x['key'] == 'Geography', self.query_builder.dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

        cur_row_multifield = None
        last_town = None
        last_mf = None  # last multifield
        last_mt = None  # last measure type
        last_var = None # last variable

        current_town = None
        current_mf = None  # current multifield
        current_mt = None  # current measure type
        # groups data first by Town, then by multifield and then by Measure Type
        for row in data:
            #Don't include row if it doesn't have a value for the multifield
            if multifield:
              cur_row_multifield = row[multifield]
            else:
              cur_row_multifield = None
            if cur_row_multifield == "NA":
              continue
            if not 'Variable' in row:
              row['Variable'] = None
            if row[geography_param] != last_town:
                current_mt = {'measure_type': row['Measure Type'], 'variable': row['Variable'], 'data': []}
                last_mt = row['Measure Type']
                last_var = row['Variable']

                current_mf = {'value': str(cur_row_multifield), 'data': [current_mt]}
                last_mf = cur_row_multifield

                current_town = {geography_param: row[geography_param], 'multifield': [current_mf]}
                last_town = row[geography_param]

                result['data'].append(current_town)

            if cur_row_multifield != last_mf:
                current_mt = {'measure_type': row['Measure Type'], 'variable': row['Variable'], 'data': []}
                last_mt = row['Measure Type']
                last_var = row['Variable']

                current_mf = {'value': str(cur_row_multifield), 'data': [current_mt]}
                last_mf = cur_row_multifield

                current_town['multifield'].append(current_mf)

            if (row['Measure Type'], row['Variable']) != (last_mt, last_var):
                current_mt = {'measure_type': row['Measure Type'], 'variable': row['Variable'], 'data': []}
                last_mt = row['Measure Type']
                last_var = row['Variable']

                current_mf['data'].append(current_mt)

            try:
                # current_mt['data'].append(float(row['Value']))
                current_mt['data'].append(float(1))
            except ValueError:
                current_mt['data'].append(None)
        return result


class ChartView(View):
    def convert_data(self, data, filters):
        result = super(ChartView, self).convert_data(data, filters)
        result['data'] = []

        geography       = filter(lambda x: x['key'] == 'Geography', self.query_builder.dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

        towns_from_filters = dict_with_key_value('field', geography_param, filters)['values']
        years_fltrs        = dict_with_key_value('field', 'Year', filters)
        years_from_filters = years_fltrs.get('values') if years_fltrs else None
        sorted_towns       = sorted(towns_from_filters)
        sorted_years       = sorted(map(lambda y: str(y), years_from_filters)) if years_from_filters else []
        if towns_from_filters[0].lower() == 'all':
            sorted_towns = []
            sorted_years = []

        # used to determine for which towns or years there was no data returned
        check_town, check_year = 0, 0

        last_row_dims = None
        current_row   = None
        last_dims     = None
        next_row_dims = None
        cur_year      = None
        current_town  = None

        moes = filter( lambda d: d['Variable'] == 'Margins of Error', data)
        map( lambda m: data.remove(m), moes)

        for row in data:
            next_row_dims = row
            cur_value     = next_row_dims.pop('Value', None)
            cur_moes      = None

            #seach for margins of errors data data
            temp_data_item = dict(row)
            temp_data_item.pop('Variable')

            for moes_item in moes:
                temp_moes_item = dict(moes_item)
                temp_moes_item.pop('Variable')
                temp_moes_item.pop('Value')

                if temp_data_item == temp_moes_item:
                    cur_moes = moes_item['Value']

            cur_year      = next_row_dims.pop('Year', None)
            if cmp(last_row_dims, next_row_dims) != 0:
                if last_row_dims:
                    while check_year < len(sorted_years):
                        result['data'][-1]['data'].append(None)
                        check_year += 1
                # if some of the towns was skipped, append None values for them in the result
                while check_town < len(sorted_towns) and row[geography_param] != sorted_towns[check_town]:
                    result['data'].append({'name': sorted_towns[check_town], 'data': [None]*len(sorted_years)})
                    check_town += 1
                current_town = {'dims': {k: str(v) for k, v in next_row_dims.items()},
                                'data': [], 'moes': []}
                last_row_dims = next_row_dims
                check_town += 1
                check_year = 0

                result['data'].append(current_town)

            # if some of the years was skipped, append None values for them for current town
            while check_year < len(sorted_years) and str(cur_year) != str(sorted_years[check_year]):
                check_year += 1
                current_town['data'].append(None)

            try:
                current_town['data'].append(float(cur_value))
                if cur_moes:
                    current_town['moes'].append(float(cur_moes))
            except ValueError:
                current_town['data'].append(None)
            except TypeError:
                current_town['data'].append(None)

            check_year += 1

        if result['data']:
            while check_year < len(sorted_years):
                result['data'][-1]['data'].append(None)
                check_year += 1

        while check_town < len(sorted_towns):
            result['data'].append({'name': sorted_towns[check_town], 'data': [None]*len(years_from_filters)})
            check_town += 1
        result['compatibles'] = self.get_compatibles(filters)

        return result

class CompareView(View):
    def convert_data(self, data, filters):
        geography       = filter(lambda x: x['key'] == 'Geography', self.query_builder.dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

        for data_item in data:
            data_item['label'] = str(data_item['Value'])
            data_item['location_name'] = data_item[geography_param]
            data_item['x'] = data.index(data_item)

            try:
                data_item['Value'] = float(data_item['Value'])
            except ValueError:
                data_item['Value'] = 0

            data_item['Year'] = str(data_item['Year'])
            data_item['color'] = 'Default'
            data_item['shape'] = 'Default'
            data_item['size']  = 'Default'

        compatibles = self.get_compatibles(filters)
        return data, compatibles

class ProfileView(View):
    """
    This class used to be a descendant of the ChartView, but then ChartView's logic had been changed, so now it has its
    own data conversion algorithm (which used to be the ChartView's). It's a bit more complex then it should be,
    because it retained the ability to have more than year, which made sense for charts and doesn't for profiles, but it
    still works for a single year, so I left it like this.
    """
    def convert_data(self, data, filters):
        result = super(ProfileView, self).convert_data(data, filters)

        result['data'] = []
        # there should only be one measure type for all the rows
        if data:
            result['data_type'] = data[0]['Measure Type']

        towns_from_filters = dict_with_key_value('field', 'Town', filters)['values']
        years_from_filters = dict_with_key_value('field', 'Year', filters)['values']
        sorted_towns = sorted(towns_from_filters)
        try:
            sorted_years = sorted(map(lambda y: str(y), years_from_filters))
        except ValueError:
            try:
                sorted_years = sorted(map(lambda y: datetime.datetime
                                          .strptime(y, "%Y-%m-%d %H:%M:%S").year, years_from_filters))
            except ValueError:
                sorted_years = []
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
                    result['data'].append({'name': sorted_towns[check_town], 'data': [None]*len(sorted_years)})
                    check_town += 1
                current_town = {'name': row['Town'], 'data': []}
                last_town_name = row['Town']
                check_town += 1
                check_year = 0

                result['data'].append(current_town)

            # if some of the years was skipped, append None values for them for current town
            while check_year < len(sorted_years) and str(row['Year']) != sorted_years[check_year]:
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
            result['data'].append({'name': sorted_towns[check_town], 'data': [None]*len(years_from_filters)})
            check_town += 1
        return result


class MapView(View):

    def get_compatibles(self, filters):
      cols = self.query_builder.get_columns(filters)

      conn = self.database.connect()
      geography       = filter(lambda x: x['key'] == 'Geography', self.query_builder.dataset.ckan_meta['extras'])
      geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

      compatibles = []
      towns_from_filters = dict_with_key_value('field', geography_param, filters)
      if towns_from_filters and towns_from_filters['values'][0] == 'all':
        for f in filters:
          if f['field'] == geography_param:
            pass
            filters.remove(f)
      if conn:
        curs = conn.cursor()
        for cur_col in cols:
          processed_filters = []
          filters_values = []
          for f in filters:
            if f['field'] != cur_col:
              column_name, values = f['field'], f['values']
              filter_string = '"%s" in (%s)' % (column_name, ','.join(['%s'] * len(values)))
              processed_filters.append(filter_string)
              filters_values = filters_values + values
          processed_filters.append('"' + geography_param + '" not in (%s)')
          filters_values = filters_values + ['Connecticut']
          filters_string = ' and '.join(processed_filters)
          if filters_string:
            query = '''SELECT DISTINCT "%s" FROM public."%s" WHERE %s''' % (cur_col, self.query_builder.dataset.table_name, filters_string)
          else:
            query = '''SELECT DISTINCT "%s" FROM public."%s"''' % (cur_col, self.query_builder.dataset.table_name)
          curs.execute(query, filters_values)
          rows = curs.fetchall()
          for row in rows:
            compatibles.append({ cur_col: str(row[0])})

        curs.close()
        del curs
        conn.close()
      return compatibles


    def convert_data(self, data, filters):
        result = super(MapView, self).convert_data(data, filters)
        result['data'] = []

        geography       = filter(lambda x: x['key'] == 'Geography', self.query_builder.dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'


        moes = filter( lambda d: d['Variable'] == 'Margins of Error', data)
        map( lambda m: data.remove(m), moes)

        for row in data:
            if 'FIPS' in list(row.keys()):
                fips = '0' + str(row['FIPS'])
            else:
                fips = ''

            cur_value  = row.pop('Value', None)
            value      = '' if cur_value in [None, 'NA'] else float(cur_value)
            cur_moes   = None

            #seach for margins of errors data data
            temp_data_item = dict(row)
            temp_data_item.pop('Variable')

            for moes_item in moes:
                temp_moes_item = dict(moes_item)
                temp_moes_item.pop('Variable')
                temp_moes_item.pop('Value')
                if temp_data_item == temp_moes_item:
                    cur_moes = moes_item['Value']

            moes_value = '' if cur_moes in [None, 'NA'] else float(cur_moes)

            result['data'].append({'code': row[geography_param], 'value': value, 'fips': fips, 'moes': moes_value})
        result['compatibles'] = self.get_compatibles(filters)
        return result


class ViewFactory(object):
    @staticmethod
    def get_view(name, querybuilder, database=None):
        if name == 'table':
            return TableView(querybuilder, database)
        elif name == 'chart':
            return ChartView(querybuilder, database)
        elif name == 'compare':
            return CompareView(querybuilder, database)
        elif name == 'profile':
            return ProfileView(querybuilder, database)
        elif name == 'map':
            return MapView(querybuilder, database)
