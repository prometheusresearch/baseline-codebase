#
# Copyright (c) 2016, Prometheus Research, LLC
#

# pylint: disable=invalid-name


project = 'rex.mart'
html_title = "REX.MART Documentation"
extensions = [
    'sphinx.ext.autodoc',
    'sphinxcontrib.autorex',
]
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'

