from sqlalchemy import *
from migrate import *
from migrate.changeset import *

meta = MetaData()

def upgrade(migrate_engine):
  meta = MetaData(bind=migrate_engine)
  table = Table('ctdata_profile_indicators', meta, autoload=True)

  group_ids = Column('group_ids', String)
  group_ids.create(table)

  # _t = Table('group', meta, autoload=True)

  # group_indicator = Table('ctdata_group_indicators', meta,
  #   Column('id', Integer, primary_key = True),
  #   Column('indicator_id', INTEGER, ForeignKey("ctdata_profile_indicators.id"), nullable = False),
  #   Column('group_id', UnicodeText, ForeignKey("group.id"), nullable = False)
  # )

  # group_indicator.create()

def downgrade(migrate_engine):
    meta  = MetaData(bind=migrate_engine)
