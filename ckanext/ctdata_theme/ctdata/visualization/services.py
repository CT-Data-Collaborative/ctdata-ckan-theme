import ckan.plugins.toolkit as toolkit

from datasets import Dataset


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
