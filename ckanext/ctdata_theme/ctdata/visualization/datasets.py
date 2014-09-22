from ckanext.ctdata_theme.ctdata.database import Database


class Dataset(object):
    def __init__(self, table_name):
        self.table_name = table_name
        self.dimensions = []
        self.default_indicator = []
        self._get_dimensions()

    def _get_dimensions(self):
        d = Database()
        conn = d.connect()
        if conn:
            curs = conn.cursor()
            ignored_columns = ["_id", "_full_text"]
            query = '''
                Select column_name from information_schema.columns
                where table_name = '%s' and column_name not in (%s)
            ''' % (self.table_name, ",".join(["'%s'" % c for c in ignored_columns]))
            curs.execute(query, (self.table_name,))

            ignored_dims = ["Value", "Town", "FIPS"]
            for row in curs.fetchall():
                dim_name, dim_values = row[0], []

                if not dim_name in ignored_dims:
                    dim_values_query = '''
                        Select distinct "%s" from public."%s" t order by "%s"
                    ''' % (dim_name, self.table_name, dim_name)

                    curs.execute(dim_values_query)
                    res = curs.fetchall()

                    dim_values = [d[0] for d in filter(lambda x: str(x[0]) != 'NA', res)]

                self.dimensions.append(Dimension(dim_name, dim_values))

            conn.commit()



class Dimension(object):
    def __init__(self, name, possible_values):
        self.name = name
        self.possible_values = possible_values

    def __repr__(self):
        return "Dimension: %s" % self.name