from ..utils import OrderedSet, dict_with_key_value
from IPython import embed
from ..visualization.services import DatasetService
import yaml

class QueryBuilder(object):
    """
    Builds the query which is later used by a View to get data.
    """
    def __init__(self, dataset):
        self.dataset = dataset

    def get_query(self, filters):
        multivalue_dimensions = ['Year', 'Town', 'Measure Type']

        groupby_fields = None

        processed_filters = []
        for fltr in filters:
            column_name, values = fltr['field'], fltr['values']

            if column_name in multivalue_dimensions or len(values) > 1:
                filter_string = '"%s" in (%s)' % (column_name, ','.join(['%s'] * len(values)))
            else:
                filter_string = '"%s" = %%s' % column_name

            processed_filters.append(filter_string)
        filters_string = ' and '.join(processed_filters)
        filters_values = reduce(lambda acc, f: acc + f['values'],
                                 filters, [])

        if groupby_fields:
            columns_string = ','.join('"%s"' % col for col in groupby_fields)
            measure_type = dict_with_key_value('field', 'Measure Type', filters)
            aggregate = ',SUM(CAST("Value" as DECIMAL))'  # some of the datasets have text values in the 'Value' column
                                                          # so we need to cast values to decimals first
            filters_string += ' and CAST("Value" as VARCHAR) <> %s'  # and then exclude all the non-castable values from
            filters_values.append('NA')                              # the result
            if measure_type:
                # we have a problem if both Percent and Number are specified for Measure Type
                if len(measure_type['values']) == 1 and measure_type['values'][0] == 'Percent':
                    aggregate = ',round(AVG(CAST("Value" as Decimal)),2)'  # don't forget to cast average values as well
            columns_string += aggregate
        else:
        columns_string = ','.join('"%s"' % col for col in self.get_columns(filters))

        query = '''SELECT %s FROM public."%s" WHERE %s\n''' % (columns_string, self.dataset.table_name, filters_string)

        if groupby_fields:
            query += "GROUP BY %s\n" % ",".join('"%s"' % f for f in groupby_fields)

        orderby_fields = self.get_order_by(filters)
        if orderby_fields:
            query += 'ORDER BY %s\n' % ",".join('"%s"' % f for f in orderby_fields)

        return query, filters_values

    def get_columns(self, filters):
        """
        Columns used in the SELECT clause. Descendants may override those according to their needs.
        """
        table_cols = ['Town', 'Year', 'Measure Type', 'Value']
        if 'Variable' in map(lambda dim: dim.name, self.dataset.dimensions):
          table_cols.append('Variable')

        return table_cols

    def get_order_by(self, filters):
        """
        Columns used in the ORDER BY clause. Descendants may override those according to their needs.
        """
        return None


class TableQueryBuilder(QueryBuilder):

    def determine_multifield(self, filters):
        """
        Returns a field for which there's specified several filter values (multifield).
        it's not one of the 'Year', 'Town' or 'Measure Type' fields. If there're no filters
        with several values for a field, it returns the first field other than 'Year', 'Town' or 'Measure type'

        And apparently 'Variable' was later added to the list of fields that can't be multifields. In the prototype it's
         possible for 'Variable' to be multifield, but I'm not going to remove it from the non-multifields list, because
         I'm afraid I can break something.
        """
        dimension_names = map(lambda dim: dim.name, self.dataset.dimensions)
        can_be_multifield = list(set(dimension_names) - set(['Year', 'Town', 'Measure Type', 'Variable']))
        valid_filters = filter(lambda f: f['field'] in can_be_multifield, filters)
        # either field with several values or the first field if there's no such
        try:
            return (filter(lambda f: len(f['values']) > 1, valid_filters) or valid_filters)[0]['field']
        except IndexError:
            return None

    def get_columns(self, filters):
        table_columns = super(TableQueryBuilder, self).get_columns(filters)
        if self.determine_multifield(filters):
           table_columns.insert(1, self.determine_multifield(filters))

        return table_columns

    def get_order_by(self, filters):
        mult_field = self.determine_multifield(filters)
        table_cols = ['Town', 'Measure Type', 'Year']
        if mult_field:
          table_cols.insert(1, mult_field)
        if 'Variable' in map(lambda dim: dim.name, self.dataset.dimensions):
          table_cols.insert(3, 'Variable')

        return table_cols


class ChartQueryBuilder(QueryBuilder):
    def determine_multifield(self, filters):
        """
        Returns a field for which there's specified several filter values (multifield).
        it's not one of the 'Year', 'Town' or 'Measure Type' fields. If there're no filters
        with several values for a field, it returns the first field other than 'Year', 'Town' or 'Measure type'

        And apparently 'Variable' was later added to the list of fields that can't be multifields. In the prototype it's
         possible for 'Variable' to be multifield, but I'm not going to remove it from the non-multifields list, because
         I'm afraid I can break something.
        """
        can_be_multifield = ['Variable']
        valid_filters = filter(lambda f: f['field'] in can_be_multifield, filters)
        # either field with several values or the first field if there's no such
        try:
            return (filter(lambda f: len(f['values']) > 1, valid_filters) or valid_filters)[0]['field']
        except IndexError:
            return None

    def get_order_by(self, filters):
        table_columns = map(lambda (x): x.name, self.dataset.dimensions)
        table_columns.remove("Year")
        table_columns.append("Year")
        return table_columns

    def get_columns(self, filters):
        table_columns = map(lambda (x): x.name, self.dataset.dimensions)
        table_columns.append('Value')
        return table_columns


class MapQueryBuilder(QueryBuilder):
    def determine_multifield(self, filters):
        """
        Returns a field for which there's specified several filter values (multifield).
        it's not one of the 'Year', 'Town' or 'Measure Type' fields. If there're no filters
        with several values for a field, it returns the first field other than 'Year', 'Town' or 'Measure type'

        And apparently 'Variable' was later added to the list of fields that can't be multifields. In the prototype it's
         possible for 'Variable' to be multifield, but I'm not going to remove it from the non-multifields list, because
         I'm afraid I can break something.
        """
        can_be_multifield = ['Variable']
        valid_filters = filter(lambda f: f['field'] in can_be_multifield, filters)
        # either field with several values or the first field if there's no such
        try:
            return (filter(lambda f: len(f['values']) > 1, valid_filters) or valid_filters)[0]['field']
        except IndexError:
            return None

    def get_columns(self, filters):
      table_columns = map( lambda (x): x.name, self.dataset.dimensions)
      table_columns.append('Value')

      geography = filter(lambda x: x['key'] == 'Geography', self.dataset.ckan_meta['extras'])
      geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

      if geography_param != 'Town':
        table_columns.append('FIPS')
      return table_columns

    def get_order_by(self, filters):
        geography = filter(lambda x: x['key'] == 'Geography', self.dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'
        return [geography_param]


class ProfileQueryBuilder(QueryBuilder):
    def get_order_by(self, filters):
        return ['Town', 'Year']

    def get_columns(self, filters):
        geography = filter(lambda x: x['key'] == 'Geography', self.dataset.ckan_meta['extras'])
        geography_param = geography[0]['value'] if len(geography) > 0 else 'Town'

        return [geography_param, 'Year', 'Measure Type', 'Value']



class QueryBuilderFactory(object):
    @staticmethod
    def get_query_builder(name, dataset):
        if name == 'table':
            return TableQueryBuilder(dataset)
        elif name == 'chart' or name == 'compare':
            return ChartQueryBuilder(dataset)
        elif name == 'map':
            return MapQueryBuilder(dataset)
        elif name == 'default':
            return QueryBuilder(dataset)
        elif name == 'profile':
            return ProfileQueryBuilder(dataset)
