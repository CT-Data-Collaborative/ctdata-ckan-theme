import yaml
import ckan.plugins.toolkit as toolkit

from ..utils import dict_with_key_value
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from models import CtdataYears
from IPython import embed

from ..database import Database
from termcolor import colored

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
      if len(f_value) == 4:
        return f_value in main_filter_values
      else:
        if len(f_value) == 7:
          splitted  = f_value.split('-')
          formatted = splitted[0] + '-20' + splitted[1]
          return f_value in main_filter_values or formatted in main_filter_values

        else:
          if len(f_value) == 9:
            splitted  = f_value.split('-')
            formatted = splitted[0] + '-' + splitted[1][-2:]
            return f_value in main_filter_values or formatted in main_filter_values

      return False

    @staticmethod
    def get_comparable_datasets(dataset_name):
      dataset_names = toolkit.get_action('package_list')(data_dict={})
      main_dataset  = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
      main_dims     = DatasetService.get_dataset_meta_dimensions(dataset_name)
      main_geo_type = DatasetService.get_dataset_meta_geo_type(dataset_name)
      comparable    = []

      for name in dataset_names:
        dataset  = toolkit.get_action('package_show')(data_dict={'id': name})
        dims     = DatasetService.get_dataset_meta_dimensions(name)
        geo_type = DatasetService.get_dataset_meta_geo_type(name)

        if not dataset['private'] and name != dataset_name:
          dims_matches = filter(lambda dim: dim in main_dims, dims )
          filters_values_matches = []
          filters_matches_number = 0
          for dim_match in dims_matches:
            main_f_values_data = DatasetService.get_dataset_meta_field(dataset_name, dim_match, [])
            main_filter_values = main_f_values_data.split(';') if main_f_values_data != [] else []

            f_values_data = DatasetService.get_dataset_meta_field(name, dim_match, [])
            filter_values = f_values_data.split(';') if f_values_data != [] else []

            if dim_match == 'Year':
              values_matches = filter(lambda f_value: CompareService.compare_years(f_value, main_filter_values), filter_values)
            else:
              values_matches = filter(lambda f_value: f_value in main_filter_values, filter_values)
            if values_matches != []:
              filters_values_matches.append({dim_match: values_matches})
              filters_matches_number = filters_matches_number + len(values_matches)

          item = {
            'dataset_name': name,
            'geo_type': geo_type,
            'geo_type_match': main_geo_type == geo_type,
            'dims_matches_number': len(dims_matches),
            'dims_matches': dims_matches,
            'filters_matches_number': filters_matches_number,
            'filters_values_matches': filters_values_matches
            }

          comparable.append(item)

      comparable = sorted(comparable, key=lambda k: k['filters_matches_number'], reverse=True)

      return comparable