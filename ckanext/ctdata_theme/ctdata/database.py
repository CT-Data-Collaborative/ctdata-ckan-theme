import urlparse

import psycopg2

from .utils import Singleton


class Database(object):
    __metaclass__ = Singleton

    def __init__(self):
        self.connection = None
        self.last_error = ""
        self.connection_string = ""

    def set_connection_string(self, connection_string):
        self.connection_string = connection_string

    def connect(self):
        try:
            parsed_url = urlparse.urlparse(self.connection_string)

            # we can't just connect using the connection string, because it doesn't work with older versions
            # of Postgres (and there's an older version on the staging server)
            return psycopg2.connect(
                database=parsed_url.path[1:],
                user=parsed_url.username,
                password=parsed_url.password,
                host=parsed_url.hostname
            )
        except psycopg2.Error:
            self.last_error = "Unable to connect to the database"