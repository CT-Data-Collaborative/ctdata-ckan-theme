from sqlalchemy import *
from migrate    import *

meta = MetaData()

def upgrade(migrate_engine):
    meta     = MetaData(bind=migrate_engine)
    table    = Table('ctdata_locations', meta, autoload=True)

    geography_type = Column('geography_type', Text, default='Town')
    geography_type.create(table)


def downgrade(migrate_engine):
    meta     = MetaData(bind=migrate_engine)