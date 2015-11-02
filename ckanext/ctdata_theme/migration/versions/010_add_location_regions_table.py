from sqlalchemy import *
from migrate    import *

meta = MetaData()

def upgrade(migrate_engine):
  meta = MetaData(bind=migrate_engine)

  ######################## locations_regions #########################################
  locations = Table('ctdata_locations', meta, autoload=True)
  regions   = Table('ctdata_regions',   meta, autoload=True)

  locations_regions = Table('ctdata_locations_regions', meta,
    Column('id',          Integer, primary_key = True ),
    Column('location_id', Integer, ForeignKey("ctdata_locations.id"), nullable = False),
    Column('region_id',   Integer, ForeignKey("ctdata_regions.id"),   nullable = False)
  )

  # locations_regions.create()

def downgrade(migrate_engine):
    meta = MetaData(bind=migrate_engine)
