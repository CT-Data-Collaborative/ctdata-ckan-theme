from sqlalchemy import *
from migrate import *

meta = MetaData()

def upgrade(migrate_engine):
  meta = MetaData(bind=migrate_engine)

  ####################### locations table #########################################

  locations = Table('ctdata_locations', meta,
    Column('id',     Integer, primary_key = True),
    Column('fips',   BigInteger                 ),
    Column('name',   String,    nullable = False),
    Column('public', Boolean,   default  = False)
  )

  locations.create()

  ######################## profiles table #########################################
  user_info  = Table('ctdata_user_info', meta, autoload=True)

  profiles = Table('ctdata_profiles', meta,
    Column('id',             Integer, primary_key = True ),
    Column('name',           String,  nullable    = False),
    Column('global_default', Boolean, default     = False),
    Column('user_id',        String,  ForeignKey('ctdata_user_info.ckan_user_id'))
  )

  profiles.create()

  ######################## locations_profiles #########################################
  locations = Table('ctdata_locations', meta, autoload=True)
  profiles  = Table('ctdata_profiles',  meta, autoload=True)

  locations_profiles = Table('ctdata_locations_profiles', meta,
    Column('id',            Integer, primary_key = True ),
    Column('local_default', Boolean, default     = False),
    Column('location_id',   Integer, ForeignKey("ctdata_locations.id"), nullable = False),
    Column('profile_id',    Integer, ForeignKey("ctdata_profiles.id"),  nullable = False)
  )

  locations_profiles.create()

  migrate_engine.execute("INSERT INTO ctdata_locations (name, fips)  SELECT name, fips FROM ctdata_towns ")

def downgrade(migrate_engine):
    meta = MetaData(bind=migrate_engine)

