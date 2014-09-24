from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

Base = declarative_base()


class Community(Base):
    __tablename__ = 'communities'

    id = Integer(Integer, primary_key=True)
    name = Column(String)
    fips = Column(String)


class CommunityProfile(Base):
    __tablename__ = 'community_profiles'

    id = Integer(Integer, primary_key=True)
    community_id = Column(Integer, ForeignKey('communities.id'))

    community = relationship("Community", backref=backref('profiles', order_by='id'))


class ProfileField(Base):
    __tablename__ = 'profile_fields'

    id = Integer(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('community_profiles.id'))
    field = Column(String)
    value = Column(String)

    profile = relationship("CommunityProfile", backref=backref('fields', order_by='id'))