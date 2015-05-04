#
# Copyright (c) 2015, Prometheus Research, LLC
#

import docutils_react_docgen

project = 'rex.widget'
html_title = "REX.WIDGET Documentation"
html_theme = 'rex'
templates_path = ['_templates']
html_static_path = ['_static']
extensions = ['sphinx.ext.autodoc', 'rex.widget.sphinx.autowidget']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'

