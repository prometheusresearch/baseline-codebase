#
# Copyright (c) 2015, Prometheus Research, LLC
#


project = 'rex.tabular_import'
html_title = "REX.TABULAR_IMPORT Documentation"
extensions = ['sphinx.ext.autodoc']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'

latex_documents = [
    (master_doc, 'rextabular_import.tex', u'rex.tabular\\_import', u'', 'manual'),
]

