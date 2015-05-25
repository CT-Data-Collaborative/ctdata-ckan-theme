import yaml
import ckan.plugins.toolkit as toolkit

from ..utils import dict_with_key_value
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
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
          dims_no_matches        = filter(lambda dim: dim not in dims_matches, dims )
          main_dims_no_matches   = filter(lambda dim: dim not in dims_matches, main_dims )
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


      # for dim in main_dims:
      #   dataset_info[dim] = DatasetService.get_dataset_meta_field(dataset_name, dim, '')

      return comparable, dataset_info, matches

    @staticmethod
    def get_join_data_for_two_datasets(json_body):
      data = []

      dataset_name = json_body.get('main_dataset')
      compare_name = json_body.get('compare_with')
      matches      = json_body.get('matches')
      x            = json_body.get('x')
      y            = json_body.get('y')
      color        = json_body.get('color')
      size         = json_body.get('size')
      shape        = json_body.get('shape')

      dataset      = DatasetService.get_dataset(dataset_name)
      compare_with = DatasetService.get_dataset(compare_name)

      database = Database()

      try:
        conn = database.connect()
        if conn:
            curs = conn.cursor()
            curs.execute('''SELECT * FROM public."%s" ''' % (dataset.table_name))
            dataset_data = curs.fetchall()

            curs = conn.cursor()
            curs.execute('''SELECT * FROM public."%s" ''' % (compare_with.table_name))
            compare_data = curs.fetchall()

            conn.commit()
            curs.close()
            del curs
            conn.close()

      except psycopg2.ProgrammingError:
            data = []

      # embed()

      return data






