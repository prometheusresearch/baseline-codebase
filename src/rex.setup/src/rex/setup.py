#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


# Distutils extension for distributing static files and providing
# additional metadata.


import sys
import re
import os, os.path
import shutil
import distutils.log, distutils.errors, distutils.dir_util
import setuptools, setuptools.command.install, setuptools.command.develop, \
        setuptools.archive_util
import pkg_resources


def check_data(dist, attr, value):
    # Verify that the value is a list of files and directories.
    if not isinstance(value, (list, tuple)):
        raise distutils.errors.DistutilsSetupError("%s is not a list" % attr)
    for item in value:
        if not os.path.exists(item):
            raise distutils.errors.DistutilsSetupError(
                    "%s %r does not exist" % (attr, value))


def check_prefix(dist, attr, value):
    # Verify that the value has the form: `/<prefix>`.
    if not isinstance(value, str) and \
            re.match(r'^/(?:[0-9A-Za-z._~@-]+/?)?$', value):
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not a valid URL root"
                " (expected `/<prefix>`)" % (attr, value))


def check_load(dist, attr, value):
    # Verify that the value is a valid module name.
    if not isinstance(value, str) and \
            re.match(r'^[A-Za-z_][0-9A-Za-z_]*'
                     r'(?:\.[A-Za-z_][0-9A-Za-z_]*)*$', value):
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not a valid module name" % (attr, value))


def write_data_txt(cmd, basename, filename):
    # Write the base directory for static files to `*.egg-info/rex_data.txt`.
    install_cmd = cmd.get_finalized_command("install")
    directory = os.path.join(install_cmd.install_data, 'share/rex')
    if not cmd.distribution.rex_data:
        directory = None
    cmd.write_or_delete_file("rex_data", filename, directory)


def write_prefix_txt(cmd, basename, filename):
    # Write `rex_prefix` parameter to `*.egg-info/rex_prefix.txt`.
    prefix = cmd.distribution.rex_prefix
    if prefix is None:
        # If not set, autogenerate from the package name.
        prefix = cmd.distribution.get_name().lower()
        prefix = re.sub(r'[^0-9A-Za-z._-]', '-', prefix)
        prefix = '/'+prefix
    cmd.write_or_delete_file("rex_prefix", filename, prefix)


def write_load_txt(cmd, basename, filename):
    # Write `rex_load` parameter to `*.egg-info/rex_load.txt`.
    module = cmd.distribution.rex_load
    cmd.write_or_delete_file("rex_load", filename, module)


class install_rex(setuptools.Command):
    # Copy static files from `rex_data` list to
    #   `$PREFIX/share/rex/$NAME/`.

    description = "install static files"

    user_options = [('install-dir=', 'd',
                     "directory where to install the files")]

    def initialize_options(self):
        # The prefix for data files (typically, coincides with $PREFIX).
        self.install_dir = None
        # The `rex_data` parameter from `setup()`.
        self.rex_data = self.distribution.rex_data
        # List of created files.
        self.outfiles = []

    def finalize_options(self):
        # Set `install_dir` to the value of parameter `install_data`
        # from `install` command.
        self.set_undefined_options('install', ('install_data', 'install_dir'))

    def run(self):
        # Skip if `rex_data` is not set in `setup.py`.
        if not self.rex_data:
            return
        # Get `egg_info` command (to get EGG name of the distribution).
        info_cmd = self.get_finalized_command('egg_info')
        # `$PREFIX/share/rex`.
        target_base = os.path.join(self.install_dir, 'share/rex')
        # Check if the distribution is installed as an EGG; that is,
        # installed into a dedicated `*.egg` directory.  In this case,
        # create a dedicated subdirectory for static files as well.
        caller = sys._getframe(3)
        if caller.f_code.co_name == 'do_egg_install':
            basename = pkg_resources.Distribution(None, None,
                    info_cmd.egg_name, info_cmd.egg_version).egg_name()
            target_base = os.path.join(target_base, basename)
        # Append the distribution name.
        target_base = os.path.join(target_base, self.distribution.get_name())
        # Delete old files if they are any.
        if os.path.isdir(target_base) and not os.path.islink(target_base):
            distutils.dir_util.remove_tree(target_base, dry_run=self.dry_run)
        elif os.path.exists(target_base) or os.path.islink(target_base):
            self.execute(os.unlink, (target_base,), "Removing "+target_base)
        # Copy all files from `rex_data`.
        for filename in self.rex_data:
            target = os.path.join(target_base, filename)
            if not self.dry_run:
                pkg_resources.ensure_directory(target)
            self.execute(self.copy_data, (filename, target),
                    "Copying %s to %s" % (filename, target))

    def get_outputs(self):
        # Get a list of files that were created.
        return self.outfiles

    def copy_data(self, source, target):
        # Copy static files from `source` to `target`.
        def filter(src, dst):
            # Skip files starting from `.`.
            if src.startswith('.') or '/.' in src:
                return None
            self.outfiles.append(dst)
            distutils.log.info("copying %s to %s", src, dst)
            return dst
        if os.path.isfile(source):
            shutil.copyfile(source, target)
            shutil.copystat(source, target)
        else:
            setuptools.archive_util.unpack_archive(source, target, filter)


class develop_rex(setuptools.Command):
    # For each entry in `rex_data` list, create a symlink at
    #   `$PREFIX/share/rexrunner/$NAME/`.

    description = "install static files in development mode"

    user_options = [('install-dir=', 'd',
                     "directory where to install the files")]

    def initialize_options(self):
        # The prefix for data files (typically, coincides with $PREFIX).
        self.install_dir = None
        # The `rex_data` parameter of `setup()`.
        self.rex_data = self.distribution.rex_data

    def finalize_options(self):
        # Set `install_dir` to the value of parameter `install_data`
        # from `install` command.
        self.set_undefined_options('install', ('install_data', 'install_dir'))

    def run(self):
        # Skip unless `rex_data` is set in `setup.py`.
        if not self.rex_data:
            return
        # `$PREFIX/share/rex/$NAME`.
        target_base = os.path.join(self.install_dir, 'share/rex',
                                   self.distribution.get_name())
        # Delete old files if there are any.
        if os.path.isdir(target_base) and not os.path.islink(target_base):
            distutils.dir_util.remove_tree(target_base, dry_run=self.dry_run)
        elif os.path.exists(target_base) or os.path.islink(target_base):
            self.execute(os.unlink, (target_base,), "Removing "+target_base)
        # For each entry in `rex_data`, create a symlink.
        for filename in self.rex_data:
            target = os.path.join(target_base, filename)
            if not self.dry_run:
                pkg_resources.ensure_directory(target)
            filename = os.path.abspath(filename)
            self.execute(os.symlink, (filename, target),
                    "Linking %s to %s" % (filename, target))


# Patch `install` command to call `install_rex`.
setuptools.command.install.install.sub_commands.insert(0,
        ('install_rex', lambda self: self.distribution.rex_data))

# Patch `install` command to call `install_rex` (in EGG mode).
_do_egg_install = setuptools.command.install.install.do_egg_install
def do_egg_install(self):
    _do_egg_install(self)
    self.run_command('install_rex')
setuptools.command.install.install.do_egg_install = do_egg_install

# Patch `develop` command to call `develop_rex`.
_install_for_development = \
        setuptools.command.develop.develop.install_for_development
def install_for_development(self):
    _install_for_development(self)
    self.run_command('develop_rex')
setuptools.command.develop.develop.install_for_development = \
        install_for_development


