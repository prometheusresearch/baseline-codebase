#
# Copyright (c) 2015, Prometheus Research, LLC
#


from .generate import Generate
import os, os.path
import distutils.log, distutils.errors
from sphinx.application import Sphinx


class GenerateDoc(Generate):
    # Downloads files; unpacks ZIP archives.

    scheme = 'doc'

    def __call__(self):
        # The builder and the source directory.
        builder = self.url.split(':', 2)[1] or 'html'
        for source in ['.', './doc', './docs']:
            if os.path.exists(os.path.join(source, 'conf.py')):
                break
        else:
            raise distutils.errors.DistutilsSetupError(
                    "cannot find package documentation")
        source = os.path.abspath(source)
        # Build the documentation.
        distutils.log.info("building %s documentation" % builder)
        sphinx = Sphinx(source, source, self.target, self.target, builder,
                        status=None)
        sphinx.build()


