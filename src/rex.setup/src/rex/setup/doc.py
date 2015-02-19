#
# Copyright (c) 2015, Prometheus Research, LLC
#


from .generate import Generate
from .commonjs import exe
import os, os.path
import distutils.log, distutils.errors


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
        from sphinx.application import Sphinx
        sphinx = Sphinx(source, source, self.target, self.target, builder,
                        status=None)
        sphinx.build()
        # Build PDF.
        if builder == 'latex':
            exe('make', ['all-pdf'], cwd=self.target, commonjs=False)


