#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#

import sphinx_rtd_theme

project = 'rex.workflow'
html_title = "REX.WORKFLOW Documentation"
html_theme = 'sphinx_rtd_theme'
html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]
templates_path = ['_templates']
html_static_path = ['_static']
extensions = ['sphinx.ext.autodoc']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'
