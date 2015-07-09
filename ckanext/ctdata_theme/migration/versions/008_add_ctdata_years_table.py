from sqlalchemy import *
from migrate import *

meta = MetaData()

def upgrade(migrate_engine):
  meta = MetaData(bind=migrate_engine)

  # years = Table('ctdata_years', meta,
  #   Column('id', Integer, primary_key = True),
  #   Column('year', String, nullable = False),
  #   Column('matches',  String, default  = '')
  # )

  # years.create()

def downgrade(migrate_engine):
  meta = MetaData(bind=migrate_engine)

  # table = Table('ctdata_years', meta, autoload=True)
  # table.drop