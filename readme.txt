You'll need to have datastore, datapusher and filestore extensions installed and configured to be able to upload
datasets to your local CKAN instance. Also you'll need the disqus and the pages plugin for the CTData portal custom
functionality.

Installing the theme:
1. Activate virtualenv
2. go to the ckanext-ctdata_theme/ directory
3. run the following command: "python setup.py develop"

Creating About, News and Special Project pages using the Pages plugin:
1. Make sure you have the Pages plugin installed
2. Change the content of the ckanext-pages/ckanext/pages/theme/templates_main/ckanext_pages/page.html file with the
content of modified_pages_template.html (located in the same as this readme file)
3. Login to your CKAN instance using user with admin priviliges
4. Go to the http://your_ckan_instance_url/pages, and create respective pages with the content of the files in the
ckanext-ctdata_theme/ckanext/ctdata_theme/templates/ folder (news.html, special_projects.html) and use the content of the
ckanext-ctdata_theme/ckanext/ctdata_theme/templates/home/about.html file for the About page. Important: Only copy the html,
don't copy ninja2 tags from those files.