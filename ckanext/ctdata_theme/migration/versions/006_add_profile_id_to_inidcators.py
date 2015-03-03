from sqlalchemy import *
from migrate import *

meta = MetaData()

def upgrade(migrate_engine):
    meta     = MetaData(bind=migrate_engine)
    table    = Table('ctdata_profile_indicators', meta, autoload=True)
    ctdata_profiles  = Table('ctdata_profiles',   meta, autoload=True)

    ind_type = Column('profile_id', BigInteger, ForeignKey('ctdata_profiles.id'))
    ind_type.create(table)

def downgrade(migrate_engine):
    meta     = MetaData(bind=migrate_engine)