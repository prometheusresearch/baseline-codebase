#
# Copyright (c) 2012-2017, Prometheus Research, LLC
#


from .generate import Generate
from . import commonjs


def webpack(module, target):
    commonjs.bootstrap()
    cwd = commonjs.package_filename(module)
    env = {'REACT_SCRIPTS_BUILD': target}
    return commonjs.exe(
        commonjs.find_executable('node'),
        [commonjs.find_executable('react-scripts'), 'build'],
        env=env, cwd=cwd)


def webpack_watch(module, target):
    commonjs.bootstrap()
    cwd = commonjs.package_filename(module)
    env = {'REACT_SCRIPTS_BUILD': target}
    return commonjs.exe(
        commonjs.find_executable('node'),
        [commonjs.find_executable('react-scripts'), 'watch'],
        env=env, cwd=cwd, daemon=True)


class GenerateWebpack(Generate):
    # Packs CommonJS modules for client-side usage.

    scheme = 'webpack'

    def __call__(self):
        # If the package is being installed from a repository
        # with `python setup.py install`, our CommonJS packages
        # has not been installed yet.
        # Build the bundle.
        webpack(self.dist, self.target)

    def watch(self):
        # If we are at this point, the package has been installed
        # with `python setup.py develop` and so CommonJS packages
        # must have been installed already.
        proc = webpack_watch(self.dist, self.target)
        def terminate():
            try:
                proc.terminate()
            except OSError:
                # The server process must have died already.
                pass
        return terminate
