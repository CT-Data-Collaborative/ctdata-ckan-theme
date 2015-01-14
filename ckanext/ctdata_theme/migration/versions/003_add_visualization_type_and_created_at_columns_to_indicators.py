from sqlalchemy import *
from migrate import *
import datetime

meta = MetaData()

def upgrade(migrate_engine):
  meta  = MetaData(bind=migrate_engine)
  table = Table('ctdata_profile_indicators', meta, autoload=True)

  visualization_type = Column('visualization_type', String, default='table')
  visualization_type.create(table)

  created_at = Column('created_at', DateTime, default=datetime.datetime.now)
  created_at.create(table)


def downgrade(migrate_engine):
  meta = MetaData(bind=migrate_engine)
