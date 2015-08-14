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
    def get_year_matches(year):
      session    = Database().session_factory()
      year_value = session.query(CtdataYears).filter(CtdataYears.year == year).first()
      matches    = year_value.matches.split(',') if year_value.matches else []

      return matches

    @staticmethod
    def get_comparable_dataset_data(dataset_name):
      dataset_data = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
      dataset      = DatasetService.get_dataset(dataset_name)
      geo_type     = DatasetService.get_dataset_meta_geo_type(dataset_name)
      dims         = []

      for dim in dataset.dimensions:
        name = dim.name if geo_type != dim.name else 'Geography'
        if dim.name not in ['Variable']:
          dims.append( { 'name': name, 'possible_values': dim.possible_values, 'selected_value': None, 'matches': False, 'wizard_matches': [] } )

      return { 'title': dataset_data['title'], 'dims': dims }

    @staticmethod
    def get_comparable_datasets(dataset_name):
      dataset_names = toolkit.get_action('package_list')(data_dict={})
      main_dataset  = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
      main_dims     = DatasetService.get_dataset_meta_dimensions(dataset_name)
      main_dims_names = map(lambda dim: dim.name, main_dims)
      main_geo_type = DatasetService.get_dataset_meta_geo_type(dataset_name)
      comparable    = []
      matches       = {}

      for name in dataset_names:
        dataset    = toolkit.get_action('package_show')(data_dict={'id': name})
        dims       = DatasetService.get_dataset_meta_dimensions(name)
        dims_names = map(lambda dim: dim.name, dims)
        geo_type   = DatasetService.get_dataset_meta_geo_type(name)

        if not dataset['private'] and name != dataset_name:
          dims_matches           = filter(lambda dim: dim in main_dims_names, dims_names )
          dims_no_matches        = filter(lambda dim: dim not in dims_matches, dims_names ) + ['Variable']
          main_dims_no_matches   = filter(lambda dim: dim not in dims_matches, main_dims_names ) + ['Variable']
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
            else:
              if dim_match not in ['Variable', geo_type, main_geo_type]:
                main_dims_no_matches.append(dim_match)
                dims_no_matches.append(dim_match)

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
      variable_variants = DatasetService.get_dataset_meta_field(dataset_name, 'Variable', '').split(';')
      year_variants     = DatasetService.get_dataset_meta_field(dataset_name, 'Year', '')

      # try:
      #   variable_data = filter( lambda x: x['field'] == 'Variable', dataset_filters)
      variable      = variable_variants[0] if variable_variants[0] != 'Margins of Error' else variable_variants[1]
      # except IndexError:
      #   return []

      try:
        year_data     = filter( lambda x: x['field'] == 'Year', dataset_filters)[0]
      except IndexError:
        return []

      locations       = session.query(Location).filter(Location.geography_type == dataset_geo_type).all()

      if year_data and year_data['values'][0] not in year_variants:
        matches = CompareService.get_year_matches(year_data['values'][0])
        for match in matches:
          if match in year_variants:
            year_data['values'] = [match]

      # choose correct variable for dataset
      # for variable_data_item in variable_data:
      #   if variable_data_item['values'][0] in variable_variants:
      #     variable = variable_data_item['values'][0]
      #   else:
      #     dataset_filters.remove(variable_data_item)

      data = []

      request_view    = 'compare'
      request_filters = dataset_filters
      request_filters.append({'field': dataset_geo_type, 'values': map(lambda x: x.name, locations)})
      query_builder   = QueryBuilderFactory.get_query_builder(request_view, dataset)
      view            = ViewFactory.get_view(request_view, query_builder)
      data, compatibles  = view.get_data(request_filters)

      return data

    @staticmethod
    def get_join_data_for_two_datasets(dataset_name, compare_name, filters, matches):
      data = []

      matches_keys = map(lambda m: m.keys()[0], matches) + [DatasetService.get_dataset_meta_geo_type(dataset_name)]

      for f in filters:
        f['field'] = f['field'].replace('-', ' ')

      dataset      = DatasetService.get_dataset(dataset_name)
      compare_with = DatasetService.get_dataset(compare_name)
      filters_dims = map( lambda  x: x['field'], filters)

      dataset_data = CompareService.prepare_dataset_filters_to_load_data(dataset_name, dataset, filters, filters_dims, 'main_val')
      compare_data = CompareService.prepare_dataset_filters_to_load_data(compare_name, compare_with, filters, filters_dims, 'compare_val')

      for data_item in dataset_data:
        for compare_item in compare_data:
          matches = True
          for match_key in matches_keys:
            if match_key != 'Geography':
              if data_item[match_key] != compare_item[match_key]:
                matches = False
                break

          if matches:
            data_item[ data_item['Variable']]    = data_item['Value']
            data_item[ compare_item['Variable']] = compare_item['Value']
            data_item['label'] = '%s - %s: %s, %s: %s.' % (data_item['location_name'], data_item['Variable'], data_item['Value'], compare_item['Variable'], compare_item['Value'])
            data.append(data_item)

      # if (data_item['fips'] and len( filter(lambda x: x['fips'] == data_item['fips'], compare_data) ) > 0) or len( filter(lambda x: x['location_name'] == data_item['location_name'], dataset_data) ) > 0:
      # if len( filter(lambda x: x['location_name'] == data_item['location_name'], dataset_data) ) > 0
      #   data_item['y'] = 0
      #   data.append(data_item)

      # for data_item in compare_data:
      #   # if (data_item['fips'] and len( filter(lambda x: x['fips'] == data_item['fips'], dataset_data) ) > 0) or len( filter(lambda x: x['location_name'] == data_item['location_name'], dataset_data) ) > 0:
      #   data_item['y'] = 1
      #   data.append(data_item)

      minimum = min(map(lambda i: float(i['Value']), data)) if data else 0
      maximum = max(map(lambda i: float(i['Value']), data)) if data else 0

      return data, minimum, maximum






