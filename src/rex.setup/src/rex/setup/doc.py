#
# Copyright (c) 2015, Prometheus Research, LLC
#


from .generate import Generate
import os, os.path
import distutils.log
from sphinx.application import Sphinx


class GenerateDoc(Generate):
    # Downloads files; unpacks ZIP archives.

    scheme = 'doc'

    def __call__(self):
        # The builder and the source directory.
        builder = self.url.split(':', 2)[1] or 'html'
        source = os.path.abspath('doc')
        # Build the documentation.
        distutils.log.info("building %s documentation" % builder)
        sphinx = Sphinx(source, source, self.target, self.target, builder,
                        status=None)
        sphinx.build()


