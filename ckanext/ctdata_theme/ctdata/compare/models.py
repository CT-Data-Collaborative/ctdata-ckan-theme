from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import Column, Integer, String, Text, ForeignKey, BigInteger, Boolean, Table, DateTime
from sqlalchemy.orm import relationship, backref
import datetime


import ckan.model as model
from IPython import embed
import json
import ckan.logic as logic
import ckan.plugins.toolkit as toolkit

get_action = logic.get_action

from ..community.models import Base
import ckan.plugins.toolkit as toolkit

class CtdataYears(Base):
    __tablename__ = 'ctdata_years'

    id        = Column(Integer, primary_key=True)
    year      = Column(String)
    matches   = Column(String)

    def __init__(self, year, matches):
      self.year      = year
      self.matches   = matches

      print self.year + ' m: ' + self.matches


    def __repr__(self):
      return "Year %s %s %s" % (self.id, self.year, self.matches)


    def matches_list(self):
      year = model.Session.query(CtdataYears).filter(CtdataYears.original == self.original).first()

      return year.matches.split(',')

    def is_match_to(self, needed_match):
      year = model.Session.query(CtdataYears).filter(CtdataYears.original == self.original).first()

      return needed_match in year.matches()