#
# Copyright (c) 2016, Prometheus Research, LLC
#

import os.path
import subprocess
import shutil

from .generate import Generate
from .commonjs import exe, package_filename

class GenerateJS(Generate):
    # Runs npm run build command to produce build/ directory, then copies it to
    # the target directory.

    scheme = 'js'

    def __call__(self):
        src = package_filename(self.dist)
        exe('npm', ['run', 'build'], cwd=src)
        shutil.rmtree(
            self.target)
        # The expectation is that `npm run build` produces static/js/build
        # directory, we probably need to make `npm run build` configurable
        # through env var instead.
        shutil.copytree(
            os.path.join(src, 'build'),
            self.target)
        # We don't need index.html as we render a template instead.
        os.unlink(
            os.path.join(self.target, 'index.html'))
