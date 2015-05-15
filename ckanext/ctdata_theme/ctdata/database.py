import urlparse
import yaml
import psycopg2
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table

from visualization.models import VisualizationOrmBase
from location.models import CtdataProfile, Location, LocationProfile
from .utils import Singleton
from community.models import Base, CommunityProfile, Town
from compare.models import CtdataYears

from sqlalchemy.pool import NullPool
from termcolor import colored
from IPython import embed

import ckan.plugins.toolkit as toolkit
import ckan.logic as logic
from termcolor import colored

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
        self.engine = create_engine(connection_string, poolclass=NullPool)
        Base.metadata.create_all(self.engine)
        VisualizationOrmBase.metadata.create_all(self.engine)

        self.session_factory = sessionmaker(bind=self.engine)

    def create_table(self, table_name, columns, connection_string):
        self.engine = create_engine(connection_string)
        self.engine.execute("CREATE TABLE %s (id INT NOT NULL, %s)" % (table_name, columns))

    def add_column(self, table, column, connection_string, default_value):
        self.engine = create_engine(connection_string)
        column_name = column.compile(dialect=self.engine.dialect)
        column_type = column.type.compile(self.engine.dialect)
        self.engine.execute("ALTER TABLE %s ADD COLUMN %s %s DEFAULT '%s'" % (table, column_name, column_type, default_value))

    def remove_column(self, table, column, connection_string):
        self.engine = create_engine(connection_string)
        column_name = column.compile(dialect=self.engine.dialect)
        self.engine.execute('ALTER TABLE %s DROP COLUMN %s %s' % (table, column_name))

    def init_community_data(self, table_name):
        session = self.session_factory()

        if session.query(CtdataProfile).filter(CtdataProfile.global_default == True).count() == 0:
            conn = self.connect()
            curr = conn.cursor()

            locations = session.query(Location).all()

            for location in locations:
                profile = CtdataProfile(str(location.name), True, None)
                session.add(profile)


            curr.close()
            del curr
            conn.close()

        session.commit()
        session.close()


    def init_years_data(self, connection_string):
        session = self.session_factory()

        if session.query(CtdataYears).count() == 0:
            conn = self.connect()
            curr = conn.cursor()

            ####### Fill table with years and initial matches
            #1. Get years
            dataset_names = toolkit.get_action('package_list')(data_dict={})
            all_years     = ''

            for name in dataset_names:
                years   = ''
                try:
                    meta    = toolkit.get_action('package_show')(data_dict={'id': name})['extras']

                    data    = filter(lambda x: x['key'] == 'Year', meta)

                    try:
                      years = yaml.load(data[0]['value'])
                    except TypeError:
                      years = []
                    except AttributeError:
                      years = []
                    except IndexError:
                      years = []

                    if years != []:
                        if ',' in str(years):
                            years = str(years).replace(',', ';')

                        all_years += ';' + str(years)
                except AttributeError:
                    pass
            #2. add years
            all_years = all_years.split(';')

            for year in all_years:
                if year != '':
                    formatted = ''
                    year_to_put = year
                    if len(str(year)) == 7:
                      splitted  = str(year).split('-')
                      formatted = splitted[0] + '-20' + splitted[1]
                    else:
                      if len(str(year)) == 9:
                        splitted  = str(year).split('-')
                        formatted = splitted[0] + '-' + splitted[1][-2:]

                    new_year = CtdataYears(year_to_put, str(formatted))
                    session.add(new_year)

            curr.close()
            del curr
            conn.close()

        session.commit()
        session.close()
