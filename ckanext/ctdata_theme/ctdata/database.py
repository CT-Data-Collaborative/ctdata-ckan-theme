import urlparse

import psycopg2
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from visualization.models import VisualizationOrmBase
from .utils import Singleton
from community.models import Base, CommunityProfile, Town


class Database(object):
    __metaclass__ = Singleton

    def __init__(self):
        self.connection = None
        self.last_error = ""
        self.connection_string = ""
        self.engine = None
        self.session_factory = None

    def set_connection_string(self, connection_string):
        self.connection_string = connection_string

    def connect(self):
        parsed_url = urlparse.urlparse(self.connection_string)

        # we can't just connect using the connection string, because it doesn't work with older versions
        # of Postgres (and there's an older version on the staging server)
        return psycopg2.connect(
            database=parsed_url.path[1:],
            user=parsed_url.username,
            password=parsed_url.password,
            host=parsed_url.hostname
        )

    def init_sa(self, connection_string):
        self.engine = create_engine(connection_string)
        Base.metadata.create_all(self.engine)
        VisualizationOrmBase.metadata.create_all(self.engine)
        
        self.session_factory = sessionmaker(bind=self.engine)

    def init_community_data(self, table_name):
        session = self.session_factory()

        if session.query(CommunityProfile).count() == 0:
            conn = self.connect()
            curr = conn.cursor()

            curr.execute('''SELECT DISTINCT "Town","FIPS" FROM "public"."%s"''' % table_name)

            towns = curr.fetchall()

            for town in towns:
                comm_prof = CommunityProfile(town[0])
                new_town = Town(town[1], town[0])
                comm_prof.town = new_town
                session.add_all([comm_prof, new_town])

        session.commit()