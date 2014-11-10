class MockDataset(object):
    def __init__(self, tablename, dimensions):
        self.table_name = tablename
        self.dimensions = dimensions


class MockDimension(object):
    def __init__(self, name):
        self.name = name


class MockCursor(object):
    def __init__(self, data=None):
        self.data = data

    def execute(self, query, params=()):
        pass

    def fetchall(self):
        return self.data


class MockConnection(object):
    def __init__(self, data=None):
        self.data = data

    def cursor(self):
        return MockCursor(self.data)

    def commit(self):
        pass


class MockDatabase(object):
    def __init__(self):
        self.connection = MockConnection()

    def connect(self):
        return self.connection

    def set_data(self, data):
        self.connection = MockConnection(data)