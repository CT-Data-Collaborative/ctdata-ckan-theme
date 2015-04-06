import yaml
import ckan.plugins.toolkit as toolkit

from ..utils import dict_with_key_value
from ..visualization.services import DatasetService
from ..community.services import CommunityProfileService
from IPython import embed

class TopicSerivce(object):

    @staticmethod
    def get_topics_with_indicators(action):
      dataset_names = toolkit.get_action('package_list')(data_dict={})
      all_indicators = []
      domains = [{'title': 'Civic Vitality', 'id': 'civic_vitality', 'indicators': []},
                 {'title': 'Demographics',   'id': 'demographics',   'indicators': []},
                 {'title': 'Economy',        'id': 'economy',        'indicators': []},
                 {'title': 'Health',         'id': 'health',         'indicators': []},
                 {'title': 'Education',      'id': 'education',      'indicators': []},
                 {'title': 'Housing',        'id': 'housing',        'indicators': []},
                 {'title': 'Safety',         'id': 'safety',         'indicators': []}]

      for dataset_name in dataset_names:
          dataset     = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
          metadata    = DatasetService.get_dataset_meta(dataset_name)['extras']
          hidden_meta = filter(lambda x: x['key'] == 'Hidden In', metadata)
          geography       = filter(lambda x: x['key'] == 'Geography', metadata)
          geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

          try:
            hidden_list = yaml.load(hidden_meta[0]['value']).replace(', ', ',').split(',')
          except IndexError:
            hidden_list = []

          if len(dataset['extras']) > 0:
              domain = None
              domain_indicators = []
              for extra in dataset['extras']:
                  if extra['key'].lower() == 'domain':
                      domain = extra['value']

              if domain and action not in hidden_list and 'visualization' not in hidden_list and not dataset['private']:
                  dataset_indicators = CommunityProfileService.get_gallery_indicators_for_dataset(dataset['id'])

                  for indicator in dataset_indicators:
                    domain_indicators.append({'id':          indicator.id,
                                              'description': indicator.description,
                                              'name':        indicator.name,
                                              'viz_type':    indicator.visualization_type,
                                              'created_at':  str(indicator.created_at.strftime("%B %d, %Y")),
                                              'user':        indicator.user_name(),
                                              'dataset_name':   indicator.dataset_name(),
                                              'geography_type': geography_param,
                                              'link_to_visualization': indicator.link_to_visualization()})


                  dmn = dict_with_key_value('title', domain, domains)
                  if dmn:
                      dmn['indicators'] = dmn['indicators'] + (domain_indicators)
                  else:
                      domains.append({'title': domain,
                                      'indicators': domain_indicators,
                                      'id': "_".join(map(lambda x: x.lower(), domain.split(" ")))})

                  all_indicators = all_indicators + domain_indicators

      domains.sort(key=lambda x: x['title'])
      all_indicators.sort(key=lambda x: x['created_at'], reverse=True)

      domains = domains + [{'title': 'Recently Created', 'indicators': all_indicators[0:10], 'id': 'most_recent'}]

      return domains

    @staticmethod
    def get_topics(action):
        dataset_names = toolkit.get_action('package_list')(data_dict={})

        domains = [{'title': 'Civic Vitality', 'subdomains': [], 'id': 'civic_vitality'},
                   {'title': 'Demographics', 'subdomains': [], 'id': 'demographics'},
                   {'title': 'Economy', 'subdomains': [], 'id': 'economy'},
                   {'title': 'Health', 'subdomains': [], 'id': 'health'},
                   {'title': 'Education', 'subdomains': [], 'id': 'education'},
                   {'title': 'Housing', 'subdomains': [], 'id': 'housing'},
                   {'title': 'Safety', 'subdomains': [], 'id': 'safety'}]

        for dataset_name in dataset_names:
            dataset     = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
            metadata    = DatasetService.get_dataset_meta(dataset_name)['extras']
            hidden_meta = filter(lambda x: x['key'] == 'Hidden In', metadata)
            geography       = filter(lambda x: x['key'] == 'Geography', metadata)
            geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

            try:
              hidden_list = yaml.load(hidden_meta[0]['value']).replace(', ', ',').split(',')
            except IndexError:
              hidden_list = []

            if len(dataset['extras']) > 0:
                domain, subdomain = None, None
                for extra in dataset['extras']:
                    if extra['key'].lower() == 'domain':
                        domain = extra['value']
                    if extra['key'].lower() == 'subdomain':
                        subdomain = extra['value']

                if domain and subdomain and action not in hidden_list and 'visualization' not in hidden_list and not dataset['private']:

                    dataset_obj = {'name': dataset['name'], 'title': dataset['title'],
                                   'id': dataset['id'], 'geography_type': geography_param}
                    dmn = dict_with_key_value('title', domain, domains)
                    if dmn:
                        subdmn = dict_with_key_value('title', subdomain, dmn['subdomains'])
                        if subdmn:
                            subdmn['datasets'].append(dataset_obj)
                        else:
                            dmn['subdomains'].append({'title': subdomain, 'datasets': [dataset_obj]})
                    else:
                        domains.append({'title': domain,
                                        'subdomains': [{'title': subdomain, 'datasets': [dataset_obj]}],
                                        'id': "_".join(map(lambda x: x.lower(), domain.split(" ")))})

        domains.sort(key=lambda x: x['title'])

        for domain in domains:
            domain['subdomains'].sort(key=lambda x: x['title'])

        return domains
