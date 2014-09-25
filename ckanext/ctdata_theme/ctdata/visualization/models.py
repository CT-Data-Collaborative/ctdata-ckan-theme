from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, Boolean

VisualizationOrmBase = declarative_base()


class DatasetCache(VisualizationOrmBase):
    __tablename__ = 'ctdata_dataset_cache'

    table_name = Column(String, primary_key=True)
    has_incs = Column(Boolean)
    meta = Column(Text)  # contains a json document with following structure:
                         # {'incompatibilites': *list of incompatibilities*,
                         #  'possible_values': *list of possible values*}

    def __init__(self, table_name, has_incs, meta):
        self.table_name = table_name
        self.has_incs = has_incs
        self.meta = meta
