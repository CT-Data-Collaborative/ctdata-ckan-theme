from setuptools import setup, find_packages
import sys, os

version = '0.0'

setup(
    name='ckanext-ctdata_theme',
    version=version,
    description="CTData ckan theme",
    long_description='''
    ''',
    classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
    keywords='',
    author='Yauheni Kartavykh',
    author_email='yauheni.kartavykh@qweeco.com',
    url='',
    license='',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=['ckanext', 'ckanext.ctdata_theme'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        # -*- Extra requirements: -*-
    ],
    entry_points='''
        [ckan.plugins]
        ctdata_theme=ckanext.ctdata_theme.plugin:CTDataThemePlugin
    ''',
)
