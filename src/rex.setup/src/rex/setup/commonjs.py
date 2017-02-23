#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


import sys
import platform
import os, os.path
import shutil
import stat
import subprocess
import tempfile
import json
import email
import distutils.log, distutils.errors
import setuptools
import pkg_resources


# npm version used for CommonJS environment
NPM_VERSION = '3.3.3'


class install_commonjs(setuptools.Command):

    description = "install commonjs package"

    npm_install_production = True
    force_npm_link = False

    user_options = [
        ('package-location=', None, 'Package location.')
    ]

    def initialize_options(self):
        self.package_location = None

    def finalize_options(self):
        pass

    def _make_dummy_dist(self):
        ei_cmd = self.get_finalized_command('egg_info')
        if not os.path.exists(ei_cmd.egg_info):
            self.run_command('egg_info')
        return pkg_resources.Distribution(
                ei_cmd.egg_base,
                pkg_resources.PathMetadata(
                    ei_cmd.egg_base, ei_cmd.egg_info),
                ei_cmd.egg_name, ei_cmd.egg_version)

    def run(self):
        dist = self._make_dummy_dist()
        install_package(
                dist,
                execute=self.execute,
                dest=self.package_location,
                force_npm_link=self.force_npm_link,
                npm_install_production=self.npm_install_production)


class develop_commonjs(install_commonjs):

    description = "install commonjs package in development mode"

    npm_install_production = False
    force_npm_link = True


def dummy_execute(func, args, message=None):
    if message:
        distutils.log.info(message)
    return func(*args)


def find_executable(executables, title=None):
    if not isinstance(executables, (tuple, list)):
        executables = [executables]
    # Finds the executable in $PATH; excludes wrappers generated by rex.setup.
    paths = os.environ['PATH'].split(os.pathsep)
    # if Python is installed in virtualenv we add its bin/ directory to checked
    # paths
    for executable in executables:
        if hasattr(sys, 'real_prefix'):
            paths.insert(0, os.path.join(sys.prefix, 'bin'))
        for path in paths:
            filename = os.path.join(path, executable)
            if os.path.isfile(filename):
                # Skip `node` and `npm` shims created by `setup_commonjs()`.
                with open(filename, 'rb') as stream:
                    stream.readline()
                    if 'rex.setup' in stream.readline():
                        continue
                return filename
    raise distutils.errors.DistutilsSetupError(
            "cannot find `%s` executable; %s is not installed?"
            % (executable, title or executable.title()))


def get_commonjs_environment():
    # Returns environment variables in which we execute `node` and `npm`.
    env = {}
    if hasattr(sys, 'real_prefix'):
        # If Python is installed in a virtualenv, make sure NodeJS loads and
        # installs modules within the virtualenv tree.
        env['NODE_PATH'] = os.path.join(sys.prefix, 'lib', 'node_modules')
        env['NPM_CONFIG_PREFIX'] = sys.prefix
        env['PATH'] = '%s:%s' % (
            os.path.join(sys.prefix, 'bin'),
            os.environ.get('PATH', '')
        )
    else:
        # Even if we are outside virtualenv, make sure we pick up any
        # environment customizations
        if 'NODE_PATH' in os.environ:
            env['NODE_PATH'] = os.environ['NODE_PATH']
        if 'NPM_CONFIG_PREFIX' in os.environ:
            env['NPM_CONFIG_PREFIX'] = os.environ['NPM_CONFIG_PREFIX']
    return env


def setup_commonjs():
    # Verifies that NodeJS and NPM are available.

    # Find `node` and `npm` executables.
    real_node_path = find_executable(('node', 'nodejs'), 'Node.js')
    real_npm_path = find_executable('npm', 'NPM')

    # When Python is installed in a virtualenv, add shim `node` and
    # `npm` executables to the virtualenv tree.  It is done for convenience
    # of developers working within the virtual environment, we never
    # start these executables in our code.
    env = get_commonjs_environment()
    if env:
        node_path = os.path.join(sys.prefix, 'bin', 'node')
        for (path, real_path) in [(node_path, real_node_path)]:
            if os.path.exists(path):
                continue
            distutils.log.info("creating %s shim" % path)
            stream = open(path, 'w')
            stream.write('#!/bin/sh\n')
            stream.write('# Autogenerated by rex.setup.\n')
            for key, value in sorted(env.items()):
                if key == 'NODE_PATH':
                    # For some reason Node fails if NODE_PATH contains dups
                    stream.write('if [ "${0}" != "{1}" ]; then export {0}="${0}:{1}"; fi\n'.format(key, value))
                else:
                    stream.write('export {0}="{1}"\n'.format(key, value))
            stream.write('exec {} "$@"\n'.format(real_path))
            stream.close()
            mode = os.stat(path).st_mode
            os.chmod(path, stat.S_IMODE(mode|0o111))


def exe(cmd, args,
        cwd=None, daemon=False, env=None, quiet=False, commonjs=True):
    # Executes the command; returns the output or, if `daemon` is set,
    # the process object.
    if commonjs:
        setup_commonjs()
    args = [cmd] + args
    _env = {}
    _env.update(os.environ)
    if commonjs:
        _env.update(get_commonjs_environment())
    if env:
        _env.update(env)
    if not quiet:
        distutils.log.info("Executing %s" % " ".join(args))
    proc = subprocess.Popen(args,
            env=_env, cwd=cwd,
            stdin=subprocess.PIPE,
            stderr=subprocess.PIPE if not daemon else None,
            stdout=subprocess.PIPE if not daemon else None)
    if daemon:
        return proc
    out, err = proc.communicate()
    if proc.wait() != 0:
        if out:
            distutils.log.info(out)
        if err:
            distutils.log.info(err)
        raise distutils.errors.DistutilsSetupError(
                "failed to execute %s" % " ".join(args))
    return out, err


def node(args, cwd=None, daemon=False, env=None, quiet=False):
    # Executes `node args...`.
    result = exe('node', args, cwd=cwd, daemon=daemon, env=env, quiet=quiet)
    if daemon:
        return result
    else:
        out, err = result
        return out


def npm(args, cwd=None, env=None, quiet=False):
    # Executes `npm args...`.
    args = ['--loglevel', 'warn', '--color', 'false'] + args
    out, err = exe('npm', args, cwd=cwd, env=env, quiet=quiet)
    if out:
        distutils.log.info(out)
    # Check if npm emitted warning such as EPEERINVALID, we consider these to be
    # errors
    if any(line.startswith('npm WARN EPEERINVALID') for line in err.split('\n')):
        if err:
            distutils.log.info(err)
        raise distutils.errors.DistutilsSetupError(
                "failed to execute npm %s" % " ".join(args))


def static_filename(dist):
    dist = to_dist(dist)
    # Skip packages without CommonJS components.
    if not dist.has_metadata('rex_static.txt'):
        return
    static = dist.get_metadata('rex_static.txt')
    if not os.path.exists(static):
        # rex_static.txt is broken when a dist is installed via wheel dist format
        # so # maybe we can find static dir it in the standard location?
        static = os.path.join(
                sys.prefix, 'share/rex', os.path.basename(static))
        if not os.path.exists(static):
            return
    return static


def package_filename(dist, *filename):
    """ Return the absolute path to the JS package embedded in the Python
    package.

    If ``filename`` is provided then it will returned as absolute path to the
    filename inside the package.

    If Python package doesn't have JS package embedded then ``None`` will be
    returned.

    :param dist: Package distribution
    :type dist: pkg_resources.Distribution
    :keyword filename: Optional filename inside the JS package
    """
    static = static_filename(dist)
    if static is None:
        return
    if not os.path.exists(os.path.join(static, 'js', 'package.json')):
        return
    js_filename = os.path.abspath(os.path.join(static, 'js'))
    if filename is not None:
        js_filename = os.path.join(js_filename, *filename)
        if not os.path.exists(js_filename):
            return
    return js_filename


def package_metadata(dist):
    """ Return contents of ``package.json`` metadata for a JS package.

    Returns ``None`` if we package is not a commonjs package.

    :param dist: Package distribution
    :type dist: pkg_resources.Distribution
    :return: Component metdata
    :rtype: dict
    """
    return _read_package_metadata(dist, 'package.json')


def package_shrinkwrap(dist):
    return _read_package_metadata(dist, 'shrinkwrap.json')


def _read_package_metadata(dist, filename):
    filename = package_filename(dist, filename)
    if not filename:
        return None, None
    with open(filename, 'r') as stream:
        try:
            meta = json.load(stream)
            if not isinstance(meta, dict):
                raise ValueError("an object expected")
            if not 'rex' in meta:
                meta['rex'] = {}
        except ValueError, exc:
            raise distutils.errors.DistutilsSetupError(
                    "ill-formed JSON in %s: %s" % (filename, exc))
        else:
            return filename, meta



def validate_package_metadata(filename, meta, expected_name, expected_version):
    """ Validate package metadata against ``expected_name`` and
    ``expected_version``.
    """
    if meta.get('name') != expected_name:
        raise distutils.errors.DistutilsSetupError(
                "unexpected JS package name in %s: expected %s; got %s"
                % (filename, expected_name, meta.get('name')))
    if meta.get('version') != expected_version:
        raise distutils.errors.DistutilsSetupError(
                "unexpected JS package version in %s: expected %s; got %s"
                % (filename, expected_version, meta.get('version')))
    if meta.get('dependencies') and not isinstance(meta['dependencies'], dict):
        raise distutils.errors.DistutilsSetupError(
                "\"dependencies\" key should be a JSON object in %s"
                % filename)
    if meta.get('peerDependencies') and not isinstance(meta['peerDependencies'], dict):
        raise distutils.errors.DistutilsSetupError(
                "\"peerDependencies\" key should be a JSON object in %s"
                % filename)
    if meta.get('devDependencies') and not isinstance(meta['devDependencies'], dict):
        raise distutils.errors.DistutilsSetupError(
                "\"devDependencies\" key should be a JSON object in %s"
                % filename)
    if meta.get('rex'):
        if not isinstance(meta['rex'], dict):
            raise distutils.errors.DistutilsSetupError(
                    "\"rex\" key should be a JSON object in %s"
                    % filename)
        if meta['rex'].get('dependencies') and not isinstance(meta['rex']['dependencies'], dict):
            raise distutils.errors.DistutilsSetupError(
                    "\"rex.dependencies\" key should be a JSON object in %s"
                    % filename)


def bootstrap():
    """ Bootstrap CommonJS environment.

    This includes installing/updating npm version within the environment,
    installing bunlder with other utilities.
    """
    path = node(['-p',
                 'try { require.resolve("rex-setup") } catch (e) {""}'],
                 quiet=True)
    if not path.strip():
        cwd = pkg_resources.resource_filename('rex.setup', 'commonjs')
        # bootstrap
        npm_path = find_executable('npm', 'NPM')
        out, err = exe(npm_path, ['--version'])
        npm_version = out.strip()
        if npm_version[0] not in ('3', '2'):
            npm(['install', '--global', 'npm@2.x.x'])
        npm(['install', '--global', 'npm@' + NPM_VERSION])
        # install deps
        deps = [
            "webpack@1.12.x",
            "chalk@1.1.x",
            "styling@^0.4.0",
            "babel-core@^6.9.1",
            "babel-loader@^6.2.5",
            "babel-preset-prometheusresearch@^0.1.0",
            "css-loader@0.15.x",
            "style-loader@0.12.x",
            "less-loader@0.7.x",
            "url-loader@0.5.x",
            "json-loader@0.5.x",
            "imports-loader@0.6.x",
            "exports-loader@0.6.x",
            "file-loader@0.8.x",
            "source-map-loader@0.1.x",
            "extract-text-webpack-plugin@0.8.x",
            "webpack-package-loaders-plugin@2.1.x",
            "core-js@0.9.18",
            "node-libs-browser@0.5.x",
            "whatwg-fetch@0.9.x",
            "less@1.5.x"
        ]
        if platform.system() == 'Darwin':
            deps = deps + [
                "fsevents@1.0.17"
            ]
        npm(['install', '--global'] + deps, cwd=cwd)
        # install itself
        npm(['install', '--global', '.'], cwd=cwd)


class Sandbox(object):

    def __init__(self, directory, meta, execute=dummy_execute):
        self.directory = os.path.join(directory, '.rex-setup')
        self.meta = meta
        self.execute = execute

    def __enter__(self):
        self.execute(self.create, (), 'Creating package sandbox at %s' % self.directory)
        return self.directory

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.execute(self.remove, (), 'Removing package sandbox at %s' % self.directory)

    def create(self):
        rm(self.directory)
        os.mkdir(self.directory)
        for name, value in self.meta.items():
            if value is None:
                continue
            with open(os.path.join(self.directory, name), 'w') as f:
                f.write(json.dumps(value))

    def remove(self):
        rm(self.directory)


def install_package(dist, skip_if_installed=False, execute=dummy_execute,
        dest=None,
        force_npm_link=False,
        npm_install_production=True):
    if not isinstance(dist, pkg_resources.Distribution):
        req = dist
        if not isinstance(req, pkg_resources.Requirement):
            req = pkg_resources.Requirement.parse(req)
        dist = get_distribution(req)
    req = to_requirement(dist)
    dest = dest or package_filename(dist)
    if not dest:
        return
    if skip_if_installed and os.path.exists(os.path.join(dest, 'node_modules')):
        return


    execute(bootstrap, (), 'Bootstrapping CommonJS environment')
    python_dependencies = collect_dependencies(dist)

    _, shrinkwrap = package_shrinkwrap(dist)
    _, meta = package_metadata(dist)

    dependencies = {}
    dependencies.update(meta.get('dependencies', {}))
    dependencies.update(meta.get('peerDependencies', {}))

    for _, jsname, jspath in python_dependencies:
        dependencies[jsname] = jspath
        # this is dependent on shrinkwrap format
        if shrinkwrap and jsname in shrinkwrap['dependencies']:
            shrinkwrap['dependencies'][jsname]['resolved'] = jspath

    sandbox_meta = {
        'package.json': {
            'name': meta.get('name', 'rex-setup-synthetic-package'),
            'version': meta.get('version', '1.0.0'),
            'dependencies': dependencies,
            'devDependencies': meta.get('devDependencies', {})
        },
        'npm-shrinkwrap.json': shrinkwrap,
    }

    with Sandbox(dest, sandbox_meta, execute=execute) as sandbox:
        if npm_install_production:
            execute(npm,
                    (['install', '--production', '.'], sandbox),
                    'Executing npm install --production')
        else:
            execute(npm,
                    (['install', '.'], sandbox),
                    'Executing npm install')
        for pyname, jsname, jspath in python_dependencies:
            is_dev_install = os.path.islink(static_filename(pyname))
            if is_dev_install or force_npm_link:
                for path in ('src', 'lib', 'style', 'package.json'):
                    installed_path = os.path.join(sandbox, 'node_modules', jsname, path)
                    src_path = os.path.join(jspath, path)
                    if os.path.exists(src_path):
                        execute(replace_with_link, (installed_path, src_path),
                                'Linking %s/%s' % (jsname, path))

        dest_node_modules = os.path.join(dest, 'node_modules')
        sandbox_node_modules = os.path.join(sandbox, 'node_modules')
        execute(
            rm, (dest_node_modules,),
            'Removing %s' % dest_node_modules)
        execute(
            shutil.move, (sandbox_node_modules, dest_node_modules),
            'Moving %s to %s' % (sandbox_node_modules, dest_node_modules))


def collect_dependencies(dist):
    result = []
    seen = {}
    for req, pyname, jsname, jspath in _collect_dependencies(dist):
        if not jsname in seen:
            result.append((pyname, jsname, jspath))
        seen.setdefault(jsname, set()).add(to_requirement(dist).key)
    for jsname, from_reqs in seen.items():
        distutils.log.info('Requirement %s (via %s)', jsname, ', '.join(str(r) for r in list(from_reqs)))
    return result


def to_requirement(req):
    if isinstance(req, pkg_resources.Requirement):
        return req
    elif isinstance(req, pkg_resources.Distribution):
        return req.as_requirement()
    else:
        return pkg_resources.Requirement.parse(req)


def to_dist(dist):
    if not isinstance(dist, pkg_resources.Distribution):
        dist = get_distribution(dist)
    if dist is None:
        raise distutils.errors.DistutilsSetupError(
            "failed to find a Python package with embedded JS package: %s" % dist)
    return dist


MIGRATION_DOCS = "https://doc.rexdb.us/rex.setup/3.0.0/guide.html#migrating-from-bower-json-to-package-json"


def _collect_dependencies(dist):
    dist = to_dist(dist)
    req = to_requirement(dist)
    if package_filename(dist, 'bower.json'):
        raise distutils.errors.DistutilsSetupError(
            "Package %s has static/js/bower.json metadata which should be "
            "replaced with package.json metadata starting with Rex Setup 3.0. "
            "See %s for upgrade instructions." % (
                dist, MIGRATION_DOCS))
    filename, meta = package_metadata(dist)
    validate_package_metadata(filename, meta, to_js_name(req.key), dist.version)
    if meta:
        mask = meta['rex'].get('dependencies')
        for pyname in dist.requires():
            jsname = to_js_name(pyname)
            if mask is not None and mask.get(jsname) is False:
                continue
            if not package_filename(pyname, 'package.json'):
                continue
            for _subdeps in _collect_dependencies(pyname):
                yield _subdeps
            yield req, pyname, jsname, package_filename(pyname)


def replace_with_link(src, dest):
    rm(src)
    os.symlink(dest, src)


def rm(path):
    if os.path.exists(path):
        if os.path.islink(path):
            os.unlink(path)
        elif os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)


def get_distribution(req):
    # Returns a distribution object for the given requirement string.
    if isinstance(req, pkg_resources.Distribution):
        return req
    if not isinstance(req, pkg_resources.Requirement):
        req = pkg_resources.Requirement.parse(req)
    try:
        return pkg_resources.get_distribution(req)
    except pkg_resources.DistributionNotFound:
        pass


def to_js_name(req):
    if isinstance(req, pkg_resources.Requirement):
        req = req.key
    return req.replace('.', '-').replace('_', '-')
