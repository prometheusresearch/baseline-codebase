#
# Copyright (c) 2015, Prometheus Research, LLC
#

import docutils_react_docgen
import os
import sphinx_rtd_theme
import subprocess

def _setup():
    project_base = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    docutils_react_docgen.SETTINGS['project_base'] = project_base
    docutils_react_docgen.SETTINGS['react_docgen'] = os.path.join(
            project_base,
            'static/js/node_modules/.bin/react-docgen')
    assert os.access(
            docutils_react_docgen.SETTINGS['react_docgen'], 
            os.F_OK), 'react-docgen not found'

_setup()

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
