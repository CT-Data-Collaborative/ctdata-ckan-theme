from sqlalchemy import *
from migrate import *
from IPython import embed

meta = MetaData()


def upgrade(migrate_engine):
    meta = MetaData(bind=migrate_engine)
    user_info  = Table('ctdata_user_info', meta, autoload=True)

    rigions = Table('ctdata_regions', meta,
      Column('id',     Integer, primary_key = True),
      Column('name',    String, nullable = False),
      Column('user_id', String, ForeignKey('ctdata_user_info.ckan_user_id'))
    )

    rigions.create()

    regions   = Table('ctdata_locations', meta, autoload=True)
    locations = Table('ctdata_locations', meta, autoload=True)
    profiles  = Table('ctdata_profiles',  meta, autoload=True)

    region_id = Column('region_id', Integer, ForeignKey('ctdata_regions.id'))
    region_id.create(locations)

    region_id = Column('region_id', Integer, ForeignKey('ctdata_regions.id'))
    region_id.create(profiles)

    pass

def downgrade(migrate_engine):
    meta = MetaData(bind=migrate_engine)