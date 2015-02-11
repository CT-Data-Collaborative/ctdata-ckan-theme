from sqlalchemy import *
from migrate import *

meta = MetaData()

def upgrade(migrate_engine):
    meta     = MetaData(bind=migrate_engine)
    table    = Table('ctdata_profile_indicators', meta, autoload=True)

    description = Column('description', Text, default='')
    description.create(table)


def downgrade(migrate_engine):
    pass
