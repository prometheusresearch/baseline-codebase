#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#

import sphinx_rtd_theme

project = 'rex.action'
html_title = "REX.ACTION Documentation"
extensions = ['sphinx.ext.autodoc']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'
