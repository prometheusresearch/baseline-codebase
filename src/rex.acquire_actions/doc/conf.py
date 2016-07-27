#
# Copyright (c) 2016, Prometheus Research, LLC
#


project = 'rex.acquire_actions'
html_title = "REX.ACQUIRE_ACTIONS Documentation"
extensions = ['sphinx.ext.autodoc']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'

latex_documents = [
    (master_doc, 'rexacquire_actions.tex', u'rex.acquire\\_actions', u'', 'manual'),
]

