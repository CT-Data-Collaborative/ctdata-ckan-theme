from __future__ import with_statement
from fabric.api import env, local, run, sudo, cd, hosts
from fabric.context_managers import prefix

env.use_ssh_config = True

def dev():
    env.hosts = ['192.168.33.15']
    env.user = 'vagrant'
    result = local('vagrant ssh-config 261e56d | grep IdentityFile', capture=True)
    env.key_filename=result.split()[1]

def uname():
    run('uname -a')

def beta():
    env.hosts = ['beta']

def production():
    env.hosts = ['ckan']

def develop():
    code_dir = '/home/vagrant/theme' 
    with cd(code_dir), prefix('source /usr/lib/ckan/default/bin/activate'):
        #run("git pull")
        #run('python ckanext/ctdata_theme/migration/manage.py upgrade 8')
        run('python setup.py develop')
        run('sudo service nginx restart')

def deploy():
    code_dir = '/home/ubuntu/ctdata_theme'
    with cd(code_dir), prefix('source /usr/lib/ckan/default/bin/activate'):
        run("git pull")
        #run('python ckanext/ctdata_theme/migration/manage.py upgrade 8')
        run('python setup.py develop')
        run('sudo service apache2 restart')
