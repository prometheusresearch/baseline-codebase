#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


project = "rex.graphql"
html_title = "REX.GRAPHQL Documentation"
html_theme = 'sphinx_rtd_theme'
extensions = [
    "sphinx.ext.autodoc",
    "sphinxcontrib.autorex"
]
master_doc = "index"
default_role = "obj"
autodoc_default_flags = ["members"]
autodoc_member_order = "bysource"
