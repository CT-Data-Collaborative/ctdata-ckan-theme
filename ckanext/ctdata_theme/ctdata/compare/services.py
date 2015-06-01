import yaml
import ckan.plugins.toolkit as toolkit

from ..utils import dict_with_key_value
from ..visualization.services import DatasetService
from ..location.models import Location
from ..visualization.querybuilders import QueryBuilderFactory
from ..visualization.views import ViewFactory
from models import CtdataYears
from IPython import embed

from ..database import Database
from termcolor import colored
import psycopg2

class CompareService(object):

    @staticmethod
    def get_years():
      session = Database().session_factory()
      return session.query(CtdataYears).order_by(CtdataYears.year).all()

    @staticmethod
    def create_year_matches(year, matches):
      session = Database().session_factory()
      year    = CtdataYears(year, matches)

      session.add(year)
      session.commit()
      return year

    @staticmethod
    def udpdate_year_matches(year_id, matches):
      session = Database().session_factory()
      year    = session.query(CtdataYears).filter(CtdataYears.id == year_id).first()
      year.matches = matches

      session.commit()
      return year

    @staticmethod
    def remove_year(year_id):
      session = Database().session_factory()
      year    = session.query(CtdataYears).filter(CtdataYears.id == year_id).first()

      session.delete(year)
      session.commit()
      return

    @staticmethod
    def compare_years(f_value, main_filter_values):
      session = Database().session_factory()

      if f_value in main_filter_values:
        return True
      else:
        for value in main_filter_values:
          year_value = session.query(CtdataYears).filter(CtdataYears.year == value).first()
          matches    = year_value.matches.split(',') if year_value.matches else []
          if f_value in matches:
              return True

      return False

    @staticmethod
    def get_comparable_datasets(dataset_name):
      dataset_names = toolkit.get_action('package_list')(data_dict={})
      main_dataset  = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
      main_dims     = DatasetService.get_dataset_meta_dimensions(dataset_name)
      main_geo_type = DatasetService.get_dataset_meta_geo_type(dataset_name)
      comparable    = []
      matches       = {}

      for name in dataset_names:
        dataset  = toolkit.get_action('package_show')(data_dict={'id': name})
        dims     = DatasetService.get_dataset_meta_dimensions(name)
        geo_type = DatasetService.get_dataset_meta_geo_type(name)

        if not dataset['private'] and name != dataset_name:
          dims_matches           = filter(lambda dim: dim in main_dims, dims )
          dims_no_matches        = filter(lambda dim: dim not in dims_matches, dims ) + ['Variable']
          main_dims_no_matches   = filter(lambda dim: dim not in dims_matches, main_dims ) + ['Variable']
          filters_values_matches = []
          values                 = []
          filters_matches_number = 0
          main_no_matches        = []
          no_matches             = []
          dataset_info           = {}

          # get all maches
          for dim_match in dims_matches:
            main_f_values_data = DatasetService.get_dataset_meta_field(dataset_name, dim_match, [])
            main_filter_values = main_f_values_data.split(';') if main_f_values_data != [] else []
            dataset_info[dim_match]  = main_f_values_data

            f_values_data = DatasetService.get_dataset_meta_field(name, dim_match, [])
            filter_values = f_values_data.split(';') if f_values_data != [] else []

            if dim_match == 'Year':
              values_matches = filter(lambda f_value: CompareService.compare_years(f_value, main_filter_values), filter_values)
            else:
              values_matches = filter(lambda f_value: f_value in main_filter_values, filter_values)
            if values_matches != []:
              values.extend(values_matches)
              filters_values_matches.append({dim_match: values_matches})
              filters_matches_number = filters_matches_number + len(values_matches)

          # get all values that user will must select for MAIN DATASET (the first one user chose)
          for dim in main_dims_no_matches:
            f_values_data      = DatasetService.get_dataset_meta_field(dataset_name, dim, [])
            dataset_info[dim]  = f_values_data
            filter_values      = f_values_data.split(';') if f_values_data != [] else []
            main_no_matches.append({dim: filter_values})

          # get all values that user will must select for DATASET TO COMPARE(the second one user chose)
          for dim in dims_no_matches:
            f_values_data = DatasetService.get_dataset_meta_field(name, dim, [])
            filter_values = f_values_data.split(';') if f_values_data != [] else []
            no_matches.append({dim: filter_values})

          item = {
            'dataset_name': name,
            'geo_type': geo_type,
            'geo_type_match': main_geo_type == geo_type,
            'dims_matches_number': len(dims_matches),
            'dims_matches': dims_matches,
            'filters_matches_number': filters_matches_number,
            'filters_values_matches': filters_values_matches,
            'no_matches': no_matches,
            'main_no_matches': main_no_matches
            }

          comparable.append(item)
          matches[name] = filters_values_matches

      comparable = sorted(comparable, key=lambda k: k['filters_matches_number'], reverse=True)

      return comparable, dataset_info, matches

    @staticmethod
    def prepare_dataset_filters_to_load_data(dataset_name, dataset, filters, filters_dims, param):
      db   = Database()
      conn = db.connect()

      session           = Database().session_factory()
      dataset_dims      = filter( lambda  x: x.name in filters_dims, dataset.dimensions)
      dataset_filters   = filter( lambda  x: x['field'].replace('-', ' ') in map(lambda d: d.name, dataset_dims), filters)
      dataset_geo_type  = DatasetService.get_dataset_meta_geo_type(dataset_name)
      variable_variants = DatasetService.get_dataset_meta_field(dataset_name, 'Variable', '')
      variable_data     = filter( lambda x: x['field'] == 'Variable', dataset_filters)
      locations         = session.query(Location).filter(Location.geography_type == dataset_geo_type).all()

      # choose correct variable for dataset
      for variable_data_item in variable_data:
        if variable_data_item['values'][0] in variable_variants:
          variable = variable_data_item['values'][0]
        else:
          dataset_filters.remove(variable_data_item)

      data = []

      # load data values
      for location in locations:
          location_name = location.name
          query = '''
                      SELECT "Value" FROM "%s" WHERE "%s"='%s' AND %s
                  ''' % (dataset.table_name, dataset_geo_type, location_name,  " AND ".join(''' "%s" = '%s' ''' % (f['field'], f['values'][0]) for f in dataset_filters))
          curs = conn.cursor()
          curs.execute(query, (dataset.table_name))
          value = curs.fetchall()
          print value
          if value:
            val = str(value[0][0]) if str(value[0][0]) != '-9999' else 0
            data.append({'fips': location.fips, 'location_name': location_name, 'variable': variable, 'value': float(val), 'label':  str(float(val))})

      conn.commit()
      curs.close()
      del curs
      conn.close()

      return data

    @staticmethod
    def get_join_data_for_two_datasets(json_body):
      data = []

      dataset_name = json_body.get('main_dataset')
      compare_name = json_body.get('compare_with')
      filters      = json_body.get('filters')
      for f in filters:
          f['field'] = f['field'].replace('-', ' ')

      dataset      = DatasetService.get_dataset(dataset_name)
      compare_with = DatasetService.get_dataset(compare_name)
      filters_dims = map( lambda  x: x['field'], filters)

      dataset_data = CompareService.prepare_dataset_filters_to_load_data(dataset_name, dataset, filters, filters_dims, 'main_val')
      compare_data = CompareService.prepare_dataset_filters_to_load_data(compare_name, compare_with, filters, filters_dims, 'compare_val')


      for data_item in dataset_data:
        if not data_item['fips'] == None and not len( filter(lambda x: x['fips'] == data_item['fips'], compare_data) ) == 0:
          data_item['x'] = dataset_data.index(data_item)
          data.append(data_item)

      for data_item in compare_data:
        if not data_item['fips'] == None and not len( filter(lambda x: x['fips'] == data_item['fips'], dataset_data) ) == 0:
          data_item['x'] = compare_data.index(data_item)
          data.append(data_item)

      minimum = min(map(lambda i: float(i['value']), data)) if data else 0
      maximum = max(map(lambda i: float(i['value']), data)) if data else 0

      return data, minimum, maximum






