#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


# Distutils extension for distributing static files, providing metadata
# for RexDB extension mechanism, and downloading external dependencies.


import sys
import re
import os, os.path
import shutil
import urllib2
import cStringIO
import zipfile
import hashlib
import distutils.log, distutils.errors, distutils.dir_util
import setuptools, setuptools.command.install, setuptools.command.develop, \
        setuptools.command.egg_info, setuptools.archive_util
import pkg_resources


def check_init(dist, attr, value):
    # Verify that the value is a valid module name.
    if not isinstance(value, str) and \
            re.match(r'^[A-Za-z_][0-9A-Za-z_]*'
                     r'(?:\.[A-Za-z_][0-9A-Za-z_]*)*$', value):
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not a valid module name" % (attr, value))


def check_static(dist, attr, value):
    # Verify that the value is a directory.
    if not os.path.exists(value):
        raise distutils.errors.DistutilsSetupError(
                "%s %r does not exist" % (attr, value))
    if not os.path.isdir(value):
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not a directory" % (attr, value))


def check_download(dist, attr, value):
    # Verify that the value is a dictionary mapping a directory
    # to a list of URLs.
    if not (isinstance(value, dict) and
            all(isinstance(key, str) for key in value) and
            all(isinstance(value[key], list) for key in value) and
            all(isinstance(item, str) for key in value
                                      for item in value[key])):
        raise distutils.errors.DistutilsSetupError(
                "%s must be a dictionary that maps"
                " a directory to a list of URLs" % attr)


def write_init_txt(cmd, basename, filename):
    # Write `rex_init` parameter to `*.egg-info/rex_init.txt`.
    module = cmd.distribution.rex_init
    cmd.write_or_delete_file("rex_init", filename, module)


def write_static_txt(cmd, basename, filename):
    # Write the base directory for static files to `*.egg-info/rex_static.txt`.
    install_cmd = cmd.get_finalized_command("install")
    directory = os.path.join(install_cmd.install_data, 'share/rex',
                             cmd.distribution.get_name())
    if not cmd.distribution.rex_static:
        directory = None
    cmd.write_or_delete_file("rex_static", filename, directory)


class install_rex(setuptools.Command):
    # Copy static files from `rex_static` directory to
    #   `$PREFIX/share/rex/$NAME/`.

    description = "install static files"

    user_options = [('install-dir=', 'd',
                     "directory where to install the files")]

    def initialize_options(self):
        # The prefix for data files (typically, coincides with $PREFIX).
        self.install_dir = None
        # The `rex_static` parameter from `setup()`.
        self.rex_static = self.distribution.rex_static
        # List of created files.
        self.outfiles = []

    def finalize_options(self):
        # Set `install_dir` to the value of parameter `install_data`
        # from `install` command.
        self.set_undefined_options('install', ('install_data', 'install_dir'))

    def run(self):
        # Skip if `rex_static` is not set in `setup.py`.
        if not self.rex_static:
            return
        # `$PREFIX/share/rex/$NAME`.
        target = os.path.join(self.install_dir, 'share/rex',
                              self.distribution.get_name())
        # Delete old files if any.
        if os.path.isdir(target) and not os.path.islink(target):
            distutils.dir_util.remove_tree(target, dry_run=self.dry_run)
        elif os.path.exists(target) or os.path.islink(target):
            self.execute(os.unlink, (target,), "Removing "+target)
        # Copy all files from `rex_static`.
        if not self.dry_run:
            pkg_resources.ensure_directory(target)
        self.execute(self.copy_data, (self.rex_static, target),
                "Copying %s to %s" % (self.rex_static, target))

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
        setuptools.archive_util.unpack_archive(source, target, filter)


class develop_rex(setuptools.Command):
    # Create a symlink to `rex_static` directory from
    #   `$PREFIX/share/rexrunner/$NAME`.

    description = "install static files in development mode"

    user_options = [('install-dir=', 'd',
                     "directory where to install the files")]

    def initialize_options(self):
        # The prefix for data files (typically, coincides with $PREFIX).
        self.install_dir = None
        # The `rex_static` parameter of `setup()`.
        self.rex_static = self.distribution.rex_static

    def finalize_options(self):
        # Set `install_dir` to the value of parameter `install_data`
        # from `install` command.
        self.set_undefined_options('install', ('install_data', 'install_dir'))

    def run(self):
        # Skip unless `rex_static` is set in `setup.py`.
        if not self.rex_static:
            return
        # `$PREFIX/share/rex/$NAME`.
        target = os.path.join(self.install_dir, 'share/rex',
                              self.distribution.get_name())
        # Delete old files if there are any.
        if os.path.isdir(target) and not os.path.islink(target):
            distutils.dir_util.remove_tree(target, dry_run=self.dry_run)
        elif os.path.exists(target) or os.path.islink(target):
            self.execute(os.unlink, (target,), "Removing "+target)
        # Create a symlink.
        if not self.dry_run:
            pkg_resources.ensure_directory(target)
        filename = os.path.abspath(self.rex_static)
        self.execute(os.symlink, (filename, target),
                "Linking %s to %s" % (filename, target))


class download_rex(setuptools.Command):
    # Download 3rd-party non-Python dependencies specified by the
    # `rex_download` parameter.

    description = "download external dependencies"

    user_options = []

    def initialize_options(self):
        # The `rex_download` parameter of `setup()`.
        self.rex_download = self.distribution.rex_download

    def finalize_options(self):
        pass

    def run(self):
        # If `rex_download` is not set, there's nothing to do.
        if not self.rex_download:
            return
        # Loop over base directories.
        for base in sorted(self.rex_download):
            # Skip if the base directory is already populated.
            if os.path.exists(base):
                continue
            # Create the directory.
            os.makedirs(base)
            try:
                # Populate the directory from a set of URLs.
                for url in self.rex_download[base]:
                    # Extract the MD5 hash from the URL.
                    md5_hash = None
                    if '#' in url:
                        url, fragment = url.split('#', 1)
                        if fragment.startswith('md5='):
                            md5_hash = fragment.split('=', 1)[1]
                    # Download the URL.
                    distutils.log.info("downloading %s into %s"
                                       % (url, base))
                    try:
                        stream = urllib2.urlopen(url)
                        data = stream.read()
                        stream.close()
                    except urllib2.HTTPError, exc:
                        raise distutils.errors.DistutilsSetupError(
                                "failed to download %s: %s" % (url, exc))
                    digest = hashlib.md5(data).hexdigest()
                    # Verify the MD5 hash.
                    if not md5_hash:
                        distutils.log.warn("missing md5 signature for %s" % url)
                    elif digest != md5_hash:
                        raise distutils.errors.DistutilsSetupError(
                                "md5 signature does not match for %s"
                                " (expected: %s, got %s)"
                                % (url, md5_hash, digest))
                    # If the URL is a ZIP archive, unpack it into
                    # the base directory.
                    if url.endswith('.zip'):
                        archive = zipfile.ZipFile(cStringIO.StringIO(data))
                        entries = archive.infolist()
                        assert entries
                        # Find the common prefix to strip from all filenames
                        # in the archive.
                        common = os.path.commonprefix(
                                [entry.filename for entry in entries])
                        if '/' in common:
                            common = common.rsplit('/', 1)[0]
                        else:
                            common = ''
                        # Unpack each entry.
                        for entry in entries:
                            filename = entry.filename[len(common):]
                            if filename.startswith('/'):
                                filename = filename[1:]
                            if not filename:
                                continue
                            filename = os.path.join(base, filename)
                            dirname = os.path.dirname(filename)
                            if not os.path.exists(dirname):
                                os.makedirs(dirname)
                            if not filename.endswith('/'):
                                stream = open(filename, 'wb')
                                stream.write(archive.read(entry))
                                stream.close()
                    # If the URL is not an archive, save it as a file
                    # to the base directory.
                    else:
                        filename = os.path.join(base, os.path.basename(url))
                        stream = open(filename, 'wb')
                        stream.write(data)
                        stream.close()
            except:
                distutils.dir_util.remove_tree(base)
                raise


# Patch `install` command to call `install_rex`.
setuptools.command.install.install.sub_commands.insert(0,
        ('install_rex', lambda self: self.distribution.rex_static))

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

# Patch `sdist` to include static files.
_add_defaults = setuptools.command.sdist.sdist.add_defaults
def add_defaults(self):
    _add_defaults(self)
    if self.distribution.rex_static:
        for path, directories, files in os.walk(self.distribution.rex_static):
            for file in files:
                self.filelist.append(os.path.join(path, file))
setuptools.command.sdist.sdist.add_defaults = add_defaults

# Patch `egg_info` to call `download_rex`.
_find_sources = setuptools.command.egg_info.egg_info.find_sources
def find_sources(self):
    self.run_command('download_rex')
    _find_sources(self)
setuptools.command.egg_info.egg_info.find_sources = find_sources


