#
# Copyright (c) 2012, Prometheus Research, LLC
#


# Distutils extensions for distributing static files.


import sys
import re
import os, os.path
import json
import distutils.log, distutils.errors, distutils.dir_util
import setuptools, setuptools.command.install, setuptools.command.develop, \
        setuptools.archive_util
import pkg_resources


def check_dir(dist, attr, value):
    # Verify that the value is a valid directory.
    try:
        assert isinstance(value, str) and os.path.isdir(value)
    except AssertionError:
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not found or not a directory"
                % (attr, value))


def check_file(dist, attr, value):
    try:
        assert isinstance(value, str) and os.path.isfile(value)
    except AssertionError:
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not found or not a file"
                % (attr, value))


def check_prefix(dist, attr, value):
    # Verify that the value has the form: `/prefix`.
    try:
        assert isinstance(value, str) and \
                re.match(r'^/(?:[0-9A-Za-z._~@-]+/?)?$', value)
    except AssertionError:
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not a valid www prefix"
                " (expected `/prefix`)" % (attr, value))


def check_module(dist, attr, value):
    # Verify that the value is a valid module name.
    try:
        assert isinstance(value, str) and \
                re.match(r'^[A-Za-z_][0-9A-Za-z_]*'
                         r'(?:\.[A-Za-z_][0-9A-Za-z_]*)*$', value)
    except AssertionError:
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not a valid www prefix"
                " (expected `/prefix`)" % (attr, value))


def get_prefix(dist):
    # Generate a www prefix from the name of a Python distribution.
    prefix = dist.www_prefix
    if prefix is None:
        prefix = dist.get_name().lower()
        prefix = re.sub(r'[^0-9A-Za-z._-]', '-', prefix)
        prefix = '/'+prefix
    return prefix


def write_www_txt(cmd, basename, filename):
    # Write a configuration to `*.egg-info/www.txt`.
    value = None
    if (cmd.distribution.www_dir or
            cmd.distribution.www_module):
        install_cmd = cmd.get_finalized_command("install")
        root = os.path.join(install_cmd.install_data, 'share/rexrunner')
        if not cmd.distribution.www_dir:
            root = None
        prefix = get_prefix(cmd.distribution)
        module = cmd.distribution.www_module
        settings = None
        if cmd.distribution.www_settings is not None:
            settings = open(cmd.distribution.www_settings, 'r').read()
        value = json.dumps({'root': root,
                            'prefix': prefix,
                            'module': module,
                            'settings': settings})
    cmd.write_or_delete_file("www_dir", filename, value)


class install_www(setuptools.Command):
    # Copy static files from `www_dir` directory to
    #   `$PREFIX/share/rexrunner/$NAME/`.

    description = "install www files"

    user_options = [('install-dir=', 'd',
                     "directory where to install the files")]

    def initialize_options(self):
        # The prefix for data files (typically, coincides with $PREFIX).
        self.install_dir = None
        # The `www_dir` parameter of `setup()`.
        self.www_dir = self.distribution.www_dir
        # List of created files.
        self.outfiles = []

    def finalize_options(self):
        # Set `install_dir` to the value of parameter `install_data`
        # from `install` command.
        self.set_undefined_options('install', ('install_data', 'install_dir'))

    def run(self):
        # Skip if `www_dir` was not set in `setup.py`.
        if not self.www_dir:
            return
        # Get `egg_info` command (to get EGG name of the distribution).
        info_cmd = self.get_finalized_command('egg_info')
        # `$PREFIX/share/rexrunner`.
        target = os.path.join(self.install_dir, 'share/rexrunner')
        # Check if the distribution is installed as an EGG; that is,
        # installed into a dedicated `*.egg` directory.  In this case,
        # create a dedicated subdirectory for static files as well.
        caller = sys._getframe(3)
        if caller.f_code.co_name == 'do_egg_install':
            basename = pkg_resources.Distribution(None, None,
                    info_cmd.egg_name, info_cmd.egg_version).egg_name()
            target = os.path.join(target, basename)
        # Append the distribution name.
        target = os.path.join(target, self.distribution.get_name())
        # Delete old files if they are any.
        if os.path.isdir(target) and not os.path.islink(target):
            distutils.dir_util.remove_tree(target, dry_run=self.dry_run)
        elif os.path.exists(target) or os.path.islink(target):
            self.execute(os.unlink, (target,), "Removing "+target)
        # Create the directory.
        if not self.dry_run:
            pkg_resources.ensure_directory(target)
        # Copy all files from `www_dir`.
        self.execute(self.copy_www, (self.www_dir, target),
                "Copying %s to %s" % (self.www_dir, target))

    def get_outputs(self):
        # Get a list of files that were created.
        return self.outfiles

    def copy_www(self, source, target):
        # Copy static files from `source` to `target`.
        def filter(src, dst):
            # Skip files starting from `.`.
            if src.startswith('.') or '/.' in src:
                return None
            self.outfiles.append(dst)
            distutils.log.info("copying %s to %s", src, dst)
            return dst
        setuptools.archive_util.unpack_archive(source, target, filter)


class develop_www(setuptools.Command):
    # Create a symlink to `www_dir` directory at
    #   `$PREFIX/share/rexrunner/$NAME/`.

    description = "install www files in development mode"

    user_options = [('install-dir=', 'd',
                     "directory where to install the files")]

    def initialize_options(self):
        # The prefix for data files (typically, coincides with $PREFIX).
        self.install_dir = None
        # The `www_dir` parameter of `setup()`.
        self.www_dir = self.distribution.www_dir

    def finalize_options(self):
        # Set `install_dir` to the value of parameter `install_data`
        # from `install` command.
        self.set_undefined_options('install', ('install_data', 'install_dir'))

    def run(self):
        # Skip unless `www_dir` is set in `setup.py`.
        if not self.www_dir:
            return
        # `$PREFIX/share/rexrunner/$NAME`.
        target = os.path.join(self.install_dir, 'share/rexrunner',
                              self.distribution.get_name())
        # Delete old files if they are any.
        if os.path.isdir(target) and not os.path.islink(target):
            distutils.dir_util.remove_tree(target, dry_run=self.dry_run)
        elif os.path.exists(target) or os.path.islink(target):
            self.execute(os.unlink, (target,), "Removing "+target)
        if not self.dry_run:
            pkg_resources.ensure_directory(target)
        # Create a link to  `www_dir` at `target`.
        www_dir = os.path.abspath(self.www_dir)
        self.execute(os.symlink, (www_dir, target),
                "Linking %s to %s" % (www_dir, target))


# Patch `install` command to call `install_www`.
setuptools.command.install.install.sub_commands.insert(0,
        ('install_www', lambda self: self.distribution.www_dir))

# Patch `install` command to call `install_www` (in EGG mode).
_do_egg_install = setuptools.command.install.install.do_egg_install
def do_egg_install(self):
    _do_egg_install(self)
    self.run_command('install_www')
setuptools.command.install.install.do_egg_install = do_egg_install

# Patch `develop` command to call `develop_www`.
_install_for_development = \
        setuptools.command.develop.develop.install_for_development
def install_for_development(self):
    _install_for_development(self)
    self.run_command('develop_www')
setuptools.command.develop.develop.install_for_development = \
        install_for_development


