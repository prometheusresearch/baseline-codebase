#
# Copyright (c) 2015, Prometheus Research, LLC
#

import docutils_react_docgen
import docutils_shell
import os
import subprocess

def _setup():
    project_base = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    docutils_react_docgen.SETTINGS['project_base'] = project_base
    docutils_shell.SETTINGS['project_base'] = project_base

_setup()

project = 'rex.widget'
html_title = "REX.WIDGET Documentation"
extensions = ['sphinx.ext.autodoc']
master_doc = 'index'
default_role = 'obj'
autodoc_default_flags = ['members']
autodoc_member_order = 'bysource'

