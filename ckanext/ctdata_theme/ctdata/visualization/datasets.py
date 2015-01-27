import urllib2
import json
import yaml
import re

import ckan.plugins.toolkit as toolkit

from ..database import Database
from models import DatasetCache


class Dataset(object):
    def __init__(self, table_name, ckan_meta, incs_meta_url=None, defaults_meta_url=None, meta_url=None):
        self.table_name = table_name
        # there're two kinds of metadata: CKAN's info about dataset (id, title, list of resources, extrafields, etc.)
        # and dataset's data metadata (list of dimensions, possible values for dimensions, list of incompatibilites)
        # ckan_meta contains CKAN's meta, we don't store it in our tables, it's already stored by CKAN
        self.ckan_meta = ckan_meta
        # dataset's data metadata stored in our own tables, and we load it from the db in form of Dimensions
        self.incs_meta_url = incs_meta_url
        self.defaults_meta_url = defaults_meta_url
        self.meta_url = meta_url
        self.metadata = []
        self.dimensions = []
        self.default_indicator = []
        self._get_dimensions()
        #self._get_meta()

    def _get_meta(self):
      if self.meta_url:
        response = urllib2.urlopen(self.meta_url)
        raw_yaml = response.read()
        meta = yaml.load(raw_yaml)
        self.metadata = meta['Dataset']

    def _get_dimensions(self):
        db = Database()
        sess = db.session_factory()
        # get the cached metadata from the db
        cached = sess.query(DatasetCache).filter(DatasetCache.table_name == self.table_name).first()
        # if the cached copy doesn't contain the info about incompatibilities and we were provided this info
        # we wouldn't use the cached copy but compute all the metadata once more, adding incompat. info
        #if cached and not (not cached.has_incs and self.incs_meta_url):
        if False:
            # it's ok, we have the cached copy and either it has the icompat. data or it doesn't but there was none
            # provided anyway
            parsed_json = json.loads(cached.meta)
            for dim in parsed_json:
                self.dimensions.append(Dimension(dim['dimension'], dim['values'], dim['incompatible']))
        else:
            # computing the cache for the first time or adding info about incompatibilities
            conn = db.connect()

            # data about incompatibilities stored as an additional json resource in the dataset.
            # Dataset instance gets an url to that resource, so we download its content and parse it
            incompatibilities = []
            if self.incs_meta_url:
                response = urllib2.urlopen(self.incs_meta_url)
                raw_json = response.read()
                incompatibilities = json.loads(raw_json)
                # source data contains dots as delimeters, so we need to convert dots to spaces
                for inc in incompatibilities:
                    inc['dimension'] = inc['dimension'].replace('.', ' ')
                    inc['dimVal'] = inc['dimVal'].replace('.', ' ')
                    inc['incompatible'] = map(lambda x: x.replace('.', ' '), inc['incompatible'])

            if conn:
                # get the info about columns in the dataset from the db
                # self.table_name is the name of the table used by Datastore to store dataset's data
                curs = conn.cursor()
                ignored_columns = ["_id", "_full_text"]
                query = '''
                    Select column_name from information_schema.columns
                    where table_name = '%s' and column_name not in (%s)
                ''' % (self.table_name, ",".join(["'%s'" % c for c in ignored_columns]))
                curs.execute(query, (self.table_name,))

                meta_data = []
                ignored_dims = ["Value", "FIPS"]
                for row in curs.fetchall():
                    dim_name, dim_values, joined_incs = row[0], [], {}

                    # for every dimension, except "Value" and "FIPS", we determine the possible values that dimension
                    # could have
                    if not dim_name in ignored_dims:
                        dim_values_query = '''
                            Select distinct "%s" from public."%s" t order by "%s"
                        ''' % (dim_name, self.table_name, dim_name)

                        curs.execute(dim_values_query)
                        res = curs.fetchall()

                        dim_values = [str(db[0]) for db in res]

                        # also determine incompatibilities for that dimension
                        dim_incs = filter(lambda x: x['dimension'] == dim_name, incompatibilities)
                        # since in the source data for incompatibilities each ("dimension name", "dimension value")
                        # pair could have several lists of incompatible dimensions, we combine all those lists
                        for inc in dim_incs:
                            if inc['dimVal'] in joined_incs:
                                joined_incs[inc['dimVal']] |= set(inc['incompatible'])
                            else:
                                joined_incs[inc['dimVal']] = set(inc['incompatible'])

                        # convert sets into lists to make them json-serializable
                        for ji in joined_incs:
                            joined_incs[ji] = list(joined_incs[ji])

                        meta_data.append({'dimension': dim_name, 'values': dim_values, 'incompatible': joined_incs})

                    # add info about the fetched dimension and its possible values
                        self.dimensions.append(Dimension(dim_name, dim_values, joined_incs))

                # check whether we have info about incompatibles
                has_inc = True if self.incs_meta_url else False

                curs.close()
                del curs
                conn.close()
                # caching the metadata so we don't have to compute it for every request
#                if cached:
#                    # if a cached copy alredy exists, we update it
#                    cached.has_incs = has_inc
#                    cached.meta = json.dumps(meta_data)
#                else:
#                    sess.add(DatasetCache(self.table_name, has_inc, json.dumps(meta_data)))
#                sess.commit()
#
#                conn.commit()
        sess.close()


class Dimension(object):
    def __init__(self, name, possible_values, incompat):
        convert = lambda text: int(text) if text.isdigit() else text
        alphanum_key = lambda key: [ convert(c) for c in re.split('([0-9]+)', key) ]

        self.name = name
        self.possible_values = sorted(possible_values, key = alphanum_key)
        self.incompat = incompat  # incompatibilities

    def __repr__(self):
        return "Dimension: %s" % self.name
