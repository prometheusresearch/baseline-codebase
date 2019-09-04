#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .core import env, debug, fail
from rex.setup import watch
from rex.core import Rex, LatentRex, get_packages, PythonPackage, Error
import sys
import os
import shlex
import json
import atexit


def pair(value):
    # Splits `PARAM=VALUE` into a 2-element tuple.
    if not isinstance(value, str):
        raise ValueError("expected a string")
    if '=' in value:
        return tuple(value.split('=', 1))
    else:
        return (value, True)


def sequence(value):
    # Accepts a sequence of parameters.
    if not value:
        value = []
    if isinstance(value, str):
        value = value.strip()
        if value.startswith('[') and value.endswith(']'):
            value = json.loads(value)
        else:
            value = shlex.split(value)
    if not (isinstance(value, list) and
            all(isinstance(item, str) for item in value)):
        raise ValueError("expected a sequence of parameters")
    return value


def collection(value):
    # Accepts a collection of configuration parameters.
    if not value:
        value = {}
    if isinstance(value, str):
        value = value.strip()
        if value.startswith('{') and value.endswith('}'):
            value = json.loads(value)
        else:
            value = dict(pair(item)
                         for item in shlex.split(value))
    if not (isinstance(value, dict) and
            all(isinstance(key, str) for key in value)):
        raise ValueError("expected a collection of parameters")
    return value


def make_rex(project=None, require_list=None, set_list=None,
             initialize=True, attached_watch=False, detached_watch=False,
             ensure=None):
    # Creates a RexDB application from command-line parameters
    # and global settings.

    # Form the list of requirements.
    requirements = []
    if project is not None:
        requirements.append(project)
    elif env.project is not None:
        requirements.append(env.project)
    if require_list is not None:
        requirements.extend(require_list)
    requirements.extend(env.requirements)

    # Gather application parameters.
    parameters = {}
    if env.debug:
        parameters['debug'] = True
    parameters.update(env.parameters)
    if set_list is not None:
        parameters.update(set_list)

    # Build the application.
    rex_type = Rex
    if not initialize:
        rex_type = LatentRex
    try:
        app = rex_type(*requirements, **parameters)
    except Error as error:
        raise fail(str(error))
    if ensure is not None:
        with app:
            try:
                packages = get_packages()
            except Error as error:
                raise fail(str(error))
        if ensure not in packages:
            if requirements:
                raise fail("package `{}` must be included with the application",
                           ensure)
            else:
                raise fail("project is not specified")

    # Start watchers for generated files.
    if attached_watch or detached_watch:
        with app:
            to_watch = [package.name for package in get_packages()
                                     if isinstance(package, PythonPackage)]

        if attached_watch:
            terminate = watch(*to_watch)
            if terminate is not None:
                atexit.register(terminate)

        elif detached_watch:
            # Fork off a daemon.
            readfd, writefd = os.pipe()
            if os.fork() == 0:
                os.close(writefd)
                os.setsid()
                if os.fork() != 0:
                    os._exit(0)
                # Start the watchers.
                terminate = watch(*to_watch)
                if terminate is None:
                    os._exit(0)
                atexit.register(terminate)
                # Wait till the parent process terminates.
                os.read(readfd, 1)
                sys.exit(0)

    return app


