#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from .generate import Generate
import os, os.path
import json
import distutils.errors, distutils.dir_util
import setuptools, setuptools.command.install, setuptools.command.develop, \
        setuptools.command.sdist
import pkg_resources
from . import commonjs


def check_bundle(dist, attr, value):
    # The `value` must be a dictionary that maps a directory to a list
    # of URLs.
    if not (isinstance(value, dict) and
            all(isinstance(key, str) for key in value) and
            all(isinstance(value[key], list) for key in value) and
            all(isinstance(item, str) and ':' in item
                for key in value
                for item in value[key])):
        raise distutils.errors.DistutilsSetupError(
                "%s must be a dictionary that maps"
                " a directory to a list of URLs or bundles" % attr)


def write_bundle(cmd, basename, filename):
    # Saves the bundle mapping to `*.egg-info/rex.bundle.txt'
    bundle = cmd.distribution.rex_bundle or cmd.distribution.rex_download
    if bundle is not None:
        bundle = json.dumps(bundle, indent=2)
        bundle = "".join(line.rstrip()+"\n" for line in bundle.splitlines())
    cmd.write_or_delete_file("rex_bundle", filename, bundle)


class bundle(setuptools.Command):
    # Build generated files.

    description = "build generated files"

    user_options = [('install-dir=', 'd',
                     "directory where to install the files"),
                    ('force', 'f', "rebuild existing bundles"),
                    ('clean', 'c', "remove generated files")]

    boolean_options = ['force', 'clean']

    def initialize_options(self):
        # The prefix for data files (typically, coincides with $PREFIX).
        self.install_dir = None
         # Are we to rebuild existing bundles?
        self.force = False
        # Just remove generated files.
        self.clean = False
        # Local path to the `static` directory.
        self.rex_static = self.distribution.rex_static
        # Mapping of paths to bundles.  For backward compatibility,
        # accept both `rex_bundle` and `rex_download`.
        self.rex_bundle = (self.distribution.rex_bundle or
                           self.distribution.rex_download)
        # Strip `static` prefix from paths in `rex_bundle` (backward
        # compatibility).
        if self.rex_static and self.rex_bundle:
            prefixes = [self.rex_static+'/', './'+self.rex_static+'/']
            items = []
            for key, value in list(self.rex_bundle.items()):
                for prefix in prefixes:
                    if key.startswith(prefix):
                        key = key[len(prefix):]
                        break
                items.append((key, value))
            self.rex_bundle = dict(items)

    def finalize_options(self):
        # Set `install_dir` to the value of parameter `install_data`
        # from `install` command.
        self.set_undefined_options('install', ('install_data', 'install_dir'))

    def run(self):
        # If `rex_bundle` is not set, there's nothing to do.
        if not self.rex_bundle:
            return
        if not self.rex_static:
            raise distutils.errors.DistutilsSetupError(
                    "parameter `rex_static` is not set")
        # If `--clean` is set, remove `bower_components` directory.
        if self.clean:
            bower_components = os.path.join(
                    self.rex_static, 'js/bower_components')
            if os.path.exists(bower_components):
                distutils.dir_util.remove_tree(bower_components)
        # Bundle generators require a `pkg_resources.Distribution` object
        # corresponding to the package being installed.  It may be tricky to
        # create so we only make it if we really need it.
        dist = None
        # Original content of `*.egg-info/rex_static.txt`.  We may need to
        # replace it when `bundle` is run without installing the package.
        rex_static_txt = None
        # Loop over target directories.
        for base in sorted(self.rex_bundle):
            target = os.path.abspath(os.path.join(self.rex_static, base))
            # If `--clean` is set, just remove the target directory.
            if self.clean:
                if os.path.exists(target):
                    distutils.dir_util.remove_tree(target)
                continue
            # If `--force` is set and the target directory exists,
            # remove it.
            if self.force and os.path.exists(target):
                distutils.dir_util.remove_tree(target)
            # Skip if the target directory is already populated.
            if os.path.exists(target):
                continue
            # Create the directory and start populating.
            os.makedirs(target)
            try:
                # We need to prepare a `pkg_resources.Distribution` object
                # for the generator.  It could be tricky since the package
                # may not be installed yet.
                if dist is None:
                    # Make sure `*.egg-info` is built.
                    ei_cmd = self.get_finalized_command('egg_info')
                    if not os.path.exists(ei_cmd.egg_info):
                        self.run_command('egg_info')
                    dist = pkg_resources.Distribution(
                            ei_cmd.egg_base,
                            pkg_resources.PathMetadata(
                                ei_cmd.egg_base, ei_cmd.egg_info),
                            ei_cmd.egg_name, ei_cmd.egg_version)
                    # Save the content of `rex_static.txt` since we may
                    # need to override it.
                    # Override `rex_static.txt` to point it to the local
                    # `static` directory since `$PREFIX/share/rex/<package>`
                    # may be not populated yet.
                    rex_static_txt = dist.get_metadata('rex_static.txt')
                    # When the package is installed by `setup.py develop`,
                    # `rex_static.txt` contains a symlink to the local
                    # `static` directory, in which case we are good to go.
                    # Otherwise, the directory referred by `rex_static.txt`
                    # may not yet exist.  In this case, we override
                    # `rex_static.txt` to point to the local `static`
                    # directory.
                    if os.path.realpath(rex_static_txt) != \
                            os.path.realpath(self.rex_static):
                        rex_static_path = os.path.join(ei_cmd.egg_info,
                                                       'rex_static.txt')
                        with open(rex_static_path, 'w') as stream:
                            stream.write(self.rex_static)
                    else:
                        rex_static_txt = None
                    # Optionally install CommonJS package (if webpack generator is active
                    # for the distribution)
                    if self.rex_bundle:
                        has_webpack = False
                        has_js = False
                        for item in list(self.rex_bundle.values()):
                            for gen in item:
                                has_webpack = has_webpack or gen.startswith('webpack:')
                                has_js = has_js or gen.startswith('js:')
                        if has_js or has_webpack:
                            commonjs.install_package(dist,
                                    skip_if_installed=True,
                                    npm_install_production=not has_js)
                # Populate the directory from a set of URLs.
                for url in self.rex_bundle[base]:
                    # Find and invoke an appropriate generator.
                    generate_type = Generate.lookup(url)
                    if generate_type is None:
                        raise distutils.errors.DistutilsSetupError(
                                "cannot find a generator for bundle %s" % url)
                    generate = generate_type(dist, target, url)
                    generate()
            except:
                # On failure, do not leave an incomplete build.
                distutils.dir_util.remove_tree(target)
                raise
        if dist is not None:
            # Rebuild `SOURCES.txt` to include generated files.
            ei_cmd = self.get_finalized_command('egg_info')
            ei_cmd.find_sources()
        if rex_static_txt is not None:
            # Restore the original `rex_static.txt`.
            rex_static_path = os.path.join(ei_cmd.egg_info,
                                           'rex_static.txt')
            with open(rex_static_path, 'w') as stream:
                stream.write(rex_static_txt)


# Patch `sdist` command to call `bundle`.
_run = setuptools.command.sdist.sdist.run
def run(self):
    self.run_command('bundle')
    _run(self)
setuptools.command.sdist.sdist.run = run


