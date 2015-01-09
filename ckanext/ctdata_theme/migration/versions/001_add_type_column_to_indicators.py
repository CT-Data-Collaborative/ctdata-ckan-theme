from sqlalchemy import Table, Column, Integer, String, MetaData
from migrate import *
from IPython import embed

meta = MetaData()

def upgrade(migrate_engine):
    meta     = MetaData(bind=migrate_engine)
    table    = Table('ctdata_profile_indicators', meta, autoload=True)

    ind_type = Column('ind_type', String, default='common')
    ind_type.create(table)
    migrate_engine.execute("UPDATE ctdata_profile_indicators SET ind_type = 'headline' WHERE headline = true ")

    permission = Column('permission', String, default='public')
    permission.create(table)

    table.c.headline.drop()

def downgrade(migrate_engine):
    meta = MetaData(bind=migrate_engine)
    table = Table('ctdata_profile_indicators', meta, autoload=True)

    # table.c.ind_type.drop()
    # table.c.permission.drop()

