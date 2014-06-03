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
from .generate import Generate, watch
from .download import GenerateDownload
from .webpack import GenerateWebpack
from .commonjs import node, npm


