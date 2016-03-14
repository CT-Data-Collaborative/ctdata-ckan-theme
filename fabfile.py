from __future__ import with_statement
from fabric.api import env, local, run, sudo, cd, hosts, get
from fabric.context_managers import prefix
import datetime

env.use_ssh_config = True


# CKAN Hosts
def beta():
    env.hosts = ['beta']

def production():
    env.hosts = ['ckan']

# Data dump functions
def getTimestamp(ts=None):
    if ts is None:
        return datetime.datetime.now().__str__().split(' ')[0]
    else:
        return ts

def dumpDB(passwd, ts=None, dirStr=None):
    timestamp = getTimestamp(ts)
    if dirStr is None:
        dumpFile = "ckan-ctdata-{}.dump".format(timestamp)
        tarFile = "ckan-dump-{}.tgz".format(timestamp)
    else:
        dumpFile = "{}/ckan-ctdata.dump".format(dirStr, timestamp)
        tarFile = "{}/ckan-dump.tgz".format(dirStr, timestamp)
    dumpStr = "PGPASSWORD='{}' pg_dump ckan_default -U ckan_default -h localhost  > {}".format(passwd, dumpFile)
    tarStr = "tar -cvpzf {} {}".format(tarFile,dumpFile)
    run(dumpStr)
    run(tarStr)

def dumpDataStore(passwd, ts=None, dirStr=None):
    timestamp = getTimestamp(ts)
    if dirStr is None:
        dumpFile = "datastore-ctdata-{}.dump".format(timestamp)
        tarFile = "datastore-dump-{}.tgz".format(timestamp)
    else:
        dumpFile = "{}/datastore-ctdata.dump".format(dirStr, timestamp)
        tarFile = "{}/datastore-dump.tgz".format(dirStr, timestamp)
    dumpStr = "PGPASSWORD='{}' pg_dump datastore_default -U ckan_default -h localhost > {}".format(passwd, dumpFile)
    tarStr = "tar cvpzf {} {}".format(tarFile, dumpFile)
    run(dumpStr)
    run(tarStr)

def neededFiles(ts=None, dirStr=None):
    timestamp = getTimestamp(ts)
    if dirStr is None:
        tarFile = "needed-files.tgz".format(timestamp)
    else:
        tarFile = "{}/needed-files.tgz".format(dirStr, timestamp)
    tarStr = "tar cvpzf {} /var/lib/ckan/default".format(tarFile)
    run(tarStr)

def dumpCKAN(passwd):
    timestamp = datetime.datetime.now().__str__().split(' ')[0]
    dirStr = 'dump-{}'.format(timestamp)
    dumpDirStr =  "import os; os.mkdir('{}')".format(dirStr)
    mkDirStr = '''python -c "{}"'''.format(dumpDirStr)
    run(mkDirStr)
    dumpDB(passwd, timestamp, dirStr)
    dumpDataStore(passwd, timestamp, dirStr)
    neededFiles(timestamp, dirStr)

def getDumps(localpath, date=None):
    if date is None:
        date = getTimestamp(date)
    remotepath = 'dump-{}/*.tgz'.format(date)
    get(remotepath, localpath)

def dumpAndDownload(passwd, localpath):
    dumpCKAN(passwd)
    getDumps(localpath)


# Deployment Functions
def deploy(migrate=None):
    code_dir = '/home/ubuntu/ctdata_theme'
    with cd(code_dir), prefix('source /usr/lib/ckan/default/bin/activate'):
        run("git pull")
        if migrate is not None:
            migrateStr = "python ckanext/ctdata_theme/migration/manage.py upgrade {}".format(migrate)
            run(migrateStr)
        run('python setup.py develop')
        run('sudo service apache2 restart')
