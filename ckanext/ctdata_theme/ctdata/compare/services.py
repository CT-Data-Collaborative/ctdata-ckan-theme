import yaml
import ckan.plugins.toolkit as toolkit

from ..utils import dict_with_key_value
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from IPython import embed

class CompareService(object):

    @staticmethod
    def get_comparable_datasets(dataset_name):
      dataset_names = toolkit.get_action('package_list')(data_dict={})
      main_dataset  = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
      main_dims     = DatasetService.get_dataset_meta_dimensions(dataset_name)
      main_geo_type = DatasetService.get_dataset_meta_geo_type(dataset_name)
      comparable    = []
      years         = ''

      for name in dataset_names:
        dataset  = toolkit.get_action('package_show')(data_dict={'id': name})
        dims     = DatasetService.get_dataset_meta_dimensions(name)
        geo_type = DatasetService.get_dataset_meta_geo_type(name)

        if not dataset['private'] and name != dataset_name:
          d_years    = DatasetService.get_dataset_meta_field(name, 'Year', [])
          if d_years != []:
            years += ';' + d_years
          dims_matches = filter(lambda dim: dim in main_dims, dims )
          filters_values_matches = []

          for dim_match in dims_matches:
            main_f_values_data = DatasetService.get_dataset_meta_field(dataset_name, dim_match, [])
            main_filter_values = main_f_values_data.split(';') if main_f_values_data != [] else []

            f_values_data = DatasetService.get_dataset_meta_field(name, dim_match, [])
            filter_values = f_values_data.split(';') if f_values_data != [] else []

            values_matches = filter(lambda f_value: f_value in main_filter_values, filter_values)
            if values_matches != []:
              filters_values_matches.append({dim_match: values_matches})

          item = {
            'dataset_name': name,
            'geo_type': geo_type,
            'geo_type_match': main_geo_type == geo_type,
            'dims_matches_number': len(dims_matches),
            'dims_matches': dims_matches,
            'filters_matches_number':len(filters_values_matches),
            'filters_values_matches': filters_values_matches
            }

          comparable.append(item)

      comparable = sorted(comparable, key=lambda k: k['filters_matches_number'], reverse=True)
      years = list(set(years.split(';')))

      return comparable, years