#!/usr/bin/env python
from migrate.versioning.shell import main

if __name__ == '__main__':
    main(url='postgresql://ckan_default:@localhost/ckan_default', debug='False', repository='ckanext/ctdata_theme/migration')
