import yaml
import ckan.plugins.toolkit as toolkit

from ..utils import dict_with_key_value
from ..visualization.services import DatasetService
from IPython import embed

class TopicSerivce(object):
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
            dataset = toolkit.get_action('package_show')(data_dict={'id': dataset_name})
            metadata = DatasetService.get_dataset_meta(dataset_name)['extras']
            hidden_meta = filter(lambda x: x['key'] == 'hidden_in', metadata)

            try:
              hidden_list = []
              hidden_list.append( yaml.load(hidden_meta[0]['value']))
            except IndexError:
              hidden_list = []

            if len(dataset['extras']) > 0:
                domain, subdomain = None, None
                for extra in dataset['extras']:
                    if extra['key'].lower() == 'domain':
                        domain = extra['value']
                    if extra['key'].lower() == 'subdomain':
                        subdomain = extra['value']

                if domain and subdomain and action not in hidden_list:
                    help_info = filter(lambda x: x['key'] == 'Help', dataset['extras'])
                    help_str = help_info[0]['value'] if help_info else ''

                    dataset_obj = {'name': dataset['name'], 'title': dataset['title'],
                                   'id': dataset['id'], 'help': help_str}
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