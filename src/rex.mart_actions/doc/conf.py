#
# Copyright (c) 2016, Prometheus Research, LLC
#


project = 'rex.mart_actions'
html_title = "REX.MART_ACTIONS Documentation"
extensions = ['sphinx.ext.autodoc']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'

latex_documents = [
    (master_doc, 'rexmart_actions.tex', 'rex.mart\\_actions', '', 'manual'),
]

