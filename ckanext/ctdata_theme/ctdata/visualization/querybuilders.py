class QueryBuilder(object):
    def __init__(self, dataset):
        self.dataset = dataset

    def get_query(self, filters):
        multivalue_dimensions = ['Year', 'Town', 'Measure Type']

        columns_string = ','.join('"%s"' % col for col in self.get_columns(filters))

        processed_filters = []
        for fltr in filters:
            column_name, values = fltr['field'], fltr['values']

            if column_name in multivalue_dimensions or len(values) > 1:
                filter_string = '"%s" in (%s)' % (column_name, ','.join(['%s'] * len(values)))
            else:
                filter_string = '"%s" = %%s' % column_name

            processed_filters.append(filter_string)
        filters_string = ' and '.join(processed_filters)
        filters_values = reduce(lambda acc, f: acc + f['values'], filters, [])

        query = '''
            Select %s From public."%s" Where %s
        ''' % (columns_string, self.dataset.table_name, filters_string)

        orderby_fields = self.get_order_by(filters)
        if orderby_fields:
            query += 'order by %s' % ",".join('"%s"' % f for f in orderby_fields)

        return query, filters_values

    def get_columns(self, filters):
        return ['Town', 'Year', 'Measure Type', 'Value']

    def get_order_by(self, filters):
        return None


class TableQueryBuilder(QueryBuilder):

    def determine_multifield(self, filters):
        dimension_names = map(lambda dim: dim.name, self.dataset.dimensions)
        can_be_multifield = list(set(dimension_names) - set(['Year', 'Town', 'Measure Type']))
        valid_filters = filter(lambda f: f['field'] in can_be_multifield, filters)
        return (filter(lambda f: len(f['values']) > 1, valid_filters) or valid_filters)[0]['field']

    def get_columns(self, filters):
        table_columns = super(TableQueryBuilder, self).get_columns(filters)

        return table_columns + ['Variable']

    def get_order_by(self, filters):
        mult_field = self.determine_multifield(filters)
        return ['Town', mult_field, 'Measure Type', 'Year']


class ChartQueryBuilder(QueryBuilder):
    def get_order_by(self, filters):
        return ['Town', 'Year']


class QueryBuilderFactory(object):
    @staticmethod
    def get_query_builder(name, dataset):
        if name == 'table':
            return TableQueryBuilder(dataset)
        if name == 'chart':
            return ChartQueryBuilder(dataset)