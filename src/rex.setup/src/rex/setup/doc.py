#
# Copyright (c) 2015, Prometheus Research, LLC
#


from .generate import Generate
from .commonjs import exe
import os, os.path
import subprocess
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
        sphinx.connect('html-page-context', self.on_context)
        sphinx.connect('build-finished', self.on_finished)
        sphinx.build()

    def on_context(self, app, pagename, templatename, context, doctree):
        # Replaces `pathto` implementation.
        _pathto = context.get('pathto')
        def pathto(uri, *args, **kwds):
            return _pathto(uri.lstrip('_'), *args, **kwds)
        context['pathto'] = pathto

    def on_finished(self, app, exc):
        # Renames `_<name>` to `<name>`; builds PDF.
        for name in ['sources', 'static', 'images']:
            src = os.path.join(app.builder.outdir, '_'+name)
            dst = os.path.join(app.builder.outdir, name)
            if os.path.exists(src):
                os.rename(src, dst)
        if app.builder.name == 'latex':
            exe('make', ['all-pdf'], cwd=app.builder.outdir, commonjs=False)


