#
# Copyright (c) 2015, Prometheus Research, LLC
#

import docutils_react_docgen
import os
import sphinx_rtd_theme

docutils_react_docgen.SETTINGS['react_docgen'] = os.path.join(
        os.path.dirname(__file__), 
        '..',
        'static/js/node_modules/react-docgen/bin/react-docgen.js')
 
docutils_react_docgen.SETTINGS['react_docgen'] = 'cat'

project = 'rex.widget'
html_title = "REX.WIDGET Documentation"
html_theme = 'sphinx_rtd_theme'
html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]
templates_path = ['_templates']
html_static_path = ['_static']
extensions = ['sphinx.ext.autodoc']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'
