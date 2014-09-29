from ckanext.ctdata_theme.ctdata.utils import OrderedSet


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

            if "all" in map(lambda x: x.lower(), values):
                # if some of the filters have "all" value, than we don't include them in the WHERE clause,
                # and group all the selected columns except Value.
                if not groupby_fields:
                    # exclude Value from the GROUP BY clause
                    groupby_fields = list(OrderedSet(self.get_columns(filters)) - OrderedSet(['Value']))
                    print self.get_columns(filters)
                    print groupby_fields
                continue
            elif column_name in multivalue_dimensions or len(values) > 1:
                filter_string = '"%s" in (%s)' % (column_name, ','.join(['%s'] * len(values)))
            else:
                filter_string = '"%s" = %%s' % column_name

            processed_filters.append(filter_string)
        filters_string = ' and '.join(processed_filters)
        filters_values = reduce(lambda acc, f: acc + f['values'] if not 'all' in f['values'] else acc, filters, [])

        if groupby_fields:
            columns_string = ','.join('"%s"' % col for col in groupby_fields)
            columns_string += ',SUM("Value")'
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
        return ['Town', 'Year', 'Measure Type', 'Value']

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
        """
        dimension_names = map(lambda dim: dim.name, self.dataset.dimensions)
        can_be_multifield = list(set(dimension_names) - set(['Year', 'Town', 'Measure Type', 'Variable']))
        valid_filters = filter(lambda f: f['field'] in can_be_multifield, filters)
        # either field with several values or the first field if there's no such
        try:
          return (filter(lambda f: len(f['values']) > 1, valid_filters) or valid_filters)[0]['field']
        except IndexError:
          return can_be_multifield[0]

    def get_columns(self, filters):
        table_columns = super(TableQueryBuilder, self).get_columns(filters)
        table_columns.insert(1, self.determine_multifield(filters))

        return table_columns

    def get_order_by(self, filters):
        mult_field = self.determine_multifield(filters)
        return ['Town', mult_field, 'Measure Type', 'Year']


class ChartQueryBuilder(QueryBuilder):
    def get_order_by(self, filters):
        return ['Town', 'Year']


class MapQueryBuilder(QueryBuilder):
    def get_columns(self, filters):
        return ['Town', 'Value']


class QueryBuilderFactory(object):
    @staticmethod
    def get_query_builder(name, dataset):
        if name == 'table':
            return TableQueryBuilder(dataset)
        elif name == 'chart':
            return ChartQueryBuilder(dataset)
        elif name == 'map':
            return MapQueryBuilder(dataset)
