#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
This is a distutils extension for distributing static files, providing
metadata for RexDB extension mechanism, downloading external dependencies,
managing CommonJS packages and generating JavaScript and CSS bundles.
"""


from .init import check_init, write_init
from .static import check_static, write_static, install_static, develop_static
from .bundle import check_bundle, write_bundle, bundle
from .namespace import develop_namespace
from .generate import Generate, watch
from .download import GenerateDownload
from .webpack import GenerateWebpack
from .js import GenerateJS
from .doc import GenerateDoc
from .commonjs import node, npm, install_commonjs, develop_commonjs
import os


# Patch distutils.filelist.findall to prevent infinite loops over symlinks.

def findall(dir = os.curdir):
    """Find all files under 'dir' and return the list of full filenames
    (relative to 'dir').
    """
    seen = set()
    all_files = []
    for base, dirs, files in os.walk(dir, followlinks=True):
        seen.add(os.path.realpath(base))
        for dir in dirs[:]:
            realpath = os.path.realpath(os.path.join(base, dir))
            if realpath in seen:
                dirs.remove(dir)
        if base==os.curdir or base.startswith(os.curdir+os.sep):
            base = base[2:]
        if base:
            files = [os.path.join(base, f) for f in files]
        all_files.extend(list(filter(os.path.isfile, files)))
    return all_files

import setuptools, distutils.filelist
distutils.filelist.findall = findall


