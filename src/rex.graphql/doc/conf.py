#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


project = "rex.graphql"
html_title = "REX.GRAPHQL Documentation"
extensions = [
    "sphinx.ext.autodoc",
    "sphinxcontrib.autorex",
    "sphinx_autodoc_typehints",
]
master_doc = "index"
default_role = "obj"
autodoc_default_flags = ["members"]
autodoc_member_order = "bysource"
