from __future__ import with_statement
from fabric.api import env, local, run, sudo, cd, hosts
from fabric.context_managers import prefix

env.use_ssh_config = True

def beta():
    env.hosts = ['beta']

def production():
    env.hosts = ['ckan']

def deploy():
    code_dir = '/home/ubuntu/ctdata_theme'
    with cd(code_dir), prefix('source /usr/lib/ckan/default/bin/activate'):
        run("git pull")
        run('python ckanext/ctdata_theme/migration/manage.py upgrade 10')
        run('python setup.py develop')
        run('sudo service apache2 restart')
