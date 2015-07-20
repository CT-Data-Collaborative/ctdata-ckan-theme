import json
import yaml
import urllib2

import ckan.plugins.toolkit as toolkit

from datasets import Dataset
from IPython import embed

class DatasetService(object):
    @staticmethod
    def get_dataset(dataset_id):
        dataset = DatasetService.get_dataset_meta(dataset_id)

        resource = None
        incs = None
        defaults = None
        meta = None
        if dataset:
            for res in dataset['resources']:
                if res['format'].lower() == 'csv':
                    resource = res
                if res['format'].lower() == 'json' and res['name'].lower() == 'incsinfo':
                    incs = res
                if res['format'].lower() == 'json' and res['name'].lower() == 'defaultinfo':
                    defaults = res
                if res['format'].lower() == 'yml' and res['name'].lower() == 'metadata':
                    meta = res

        if resource:
            table_name = resource['id']
            if incs:
                incs = incs.get('url')
            if defaults:
                defaults = defaults.get('url')
            if meta:
                meta = meta.get('url')
            return Dataset(table_name, dataset, incs, defaults, meta)
        else:
            raise toolkit.ObjectNotFound("There's no resource for the given dataset")

    @staticmethod
    def get_dataset_meta(dataset_id):
        return toolkit.get_action('package_show')(data_dict={'id': dataset_id})

    @staticmethod
    def get_dataset_map_json(dataset_id):
        meta     = toolkit.get_action('package_show')(data_dict={'id': dataset_id})
        filename = meta['resources'][1]['url'] #todo
        data     = urllib2.urlopen(filename)
        text     = ''

        for line in data:
            text = text + line

        map_json = json.loads(text) if text != '' else {}
        return map_json

    @staticmethod
    def get_dataset_map_json_url(dataset_id):
        meta = toolkit.get_action('package_show')(data_dict={'id': dataset_id})
        try:
            resource = filter(lambda r: r['format'] == 'GeoJSON', meta['resources'])[0]
            url  = resource['url']
        except IndexError:
            url = '/common/map.json'

        return url

    @staticmethod
    def get_dataset_meta_hidden_in(dataset_id):
        default = ''
        value   = DatasetService.get_dataset_meta_field(dataset_id, 'Hidden In', default)
        return value.split(',')

    @staticmethod
    def get_dataset_meta_break_points(dataset_id):
        default     = {"type": "jenks", "buckets": 5}
        value   = DatasetService.get_dataset_meta_field(dataset_id, 'Break Points', default)
        return value

    @staticmethod
    def get_dataset_meta_default_metadata(dataset_id):
        default = []
        value   = DatasetService.get_dataset_meta_field(dataset_id, "Default", default)

        if type(value) is list and value != default:
            value = value[0]
        return value

    @staticmethod
    def get_dataset_meta_disabled_views(dataset_id):
        default = []
        value   = DatasetService.get_dataset_meta_field(dataset_id, "Disabled Views", default)

        if type(value) is str:
            value = value.split(',')

        return value

    @staticmethod
    def get_dataset_meta_visible_metadata(dataset_id):
        default = ['Description', 'Full Description', 'Suppression' ,'Source', 'Contributor']
        value   = DatasetService.get_dataset_meta_field(dataset_id, "Visible Metadata", default)

        if type(value) is str:
            value = value.split(',')

        return value

    @staticmethod
    def get_dataset_meta_units(dataset_id):
        default = {"Number": " ", "Percent": " "}
        value   = DatasetService.get_dataset_meta_field(dataset_id, 'Units', default)
        return value

    @staticmethod
    def get_dataset_meta_geo_type(dataset_id):
        default = 'Town'
        value   = DatasetService.get_dataset_meta_field(dataset_id, 'Geography', default)
        return value

    @staticmethod
    def get_dataset_meta_help(dataset_id):
        default = ''
        value   = DatasetService.get_dataset_meta_field(dataset_id, 'Help', default)
        return value

    @staticmethod
    def get_dataset_meta_domain(dataset_id):
        default = ''
        value   = DatasetService.get_dataset_meta_field(dataset_id, 'Domain', default)
        return value

    @staticmethod
    def get_dataset_meta_dimensions(dataset_id):
        default = []
        value   = DatasetService.get_dataset_meta_field(dataset_id, 'Dimensions', default)
        if value != default:
            value = value.split(';')
        return value

    @staticmethod
    def get_dataset_meta_field(dataset_id, field_name, default):
        meta    = toolkit.get_action('package_show')(data_dict={'id': dataset_id})['extras']
        data    = filter(lambda x: x['key'] == field_name, meta)

        try:
            if field_name in ['Help', 'Domain']:
                value = data[0]['value']
            elif field_name not in ['Units', 'Default', 'Break Points']:
                value = yaml.load(data[0]['value']).replace(', ', ',')
            else:
                value = yaml.load(data[0]['value'])
        except TypeError:
            value = default
        except AttributeError:
            value = default
        except IndexError:
            value = default

        return value
