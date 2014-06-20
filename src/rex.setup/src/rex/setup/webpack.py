#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from .generate import Generate
from . import commonjs
import sys
import os
import tempfile
import pkg_resources


def webpack_config(package):
    # get a webpack config for a package or use default config bundled with
    # rex.setup
    config = commonjs.bower_component_filename(package, 'webpack.config.js')
    if config is not None:
        return ['--config', config]
    else:
        component_path = commonjs.bower_component_filename(package)
        # let webpack get entry via "main" key in bower.json
        entry = [component_path]
        # check if we have entry for stylesheets via "styleEntry" key in
        # bower.json
        meta = commonjs.bower_component_metadata(package)
        if 'styleEntry' in meta:
            entry = entry + [
                os.path.join(component_path, meta['styleEntry'])
            ]
        # resolve webpack.config.js installed as a part of rex-setup package
        config = commonjs.node([
            '-p',
            'require.resolve("rex-setup/webpack.config.js")'
        ]).strip()
        return [
            '--config', config,
            '--context', component_path
        ] + entry


def webpack(module, target):
    return commonjs.node([
        commonjs.find_executable('webpack'),
        '--bail',
        '--output-path', target
    ] + webpack_config(module))


def webpack_watch(module, target):
    return commonjs.node([
        commonjs.find_executable('webpack'),
        '--devtool', 'eval',
        '--output-path', target,
        '--watch'
    ] + webpack_config(module), daemon=True)


class GenerateWebpack(Generate):
    # Packs CommonJS modules for client-side usage.

    scheme = 'webpack'

    def __call__(self):
        # If the package is being installed from a repository
        # with `python setup.py install`, our CommonJS packages
        # has not been installed yet.
        commonjs.install_bower_components(self.dist)
        # Build the bundle.
        module = self.url.split(':', 1)[1]
        webpack(module, self.target)

    def watch(self):
        # If we are at this point, the package has been installed
        # with `python setup.py develop` and so CommonJS packages
        # must have been installed already.
        module = self.url.split(':', 1)[1]
        proc = webpack_watch(module, self.target)
        def terminate():
            try:
                proc.terminate()
            except OSError:
                # The server process must have died already.
                pass
        return terminate


