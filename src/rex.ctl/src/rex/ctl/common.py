#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import setting, env
from cogs.log import debug, fail
from rex.core import Rex, get_packages, Error
import shlex
import json


def pair(value):
    # Splits `PARAM=VALUE` into a 2-element tuple.
    if not isinstance(value, str):
        raise ValueError("expected a string")
    if '=' in value:
        return tuple(value.split('=', 1))
    else:
        return (value, True)


@setting
def PROJECT(name=None):
    """primary package

    The primary package of the application.
    """
    if not name:
        name = None
    if not (name is None or isinstance(name, str)):
        raise ValueError("expected a project name")
    env.project = name


@setting
def REQUIREMENTS(names=None):
    """additional application components

    Additional packages to include with the application.
    """
    if not names:
        names = []
    if isinstance(names, str):
        names = names.strip()
        if names.startswith('[') and names.endswith(']'):
            names = json.loads(names)
        else:
            names = shlex.split(names)
    if not (isinstance(names, list) and
            all(isinstance(item, basestring) for item in names)):
        raise ValueError("expected a list of requirements")
    env.requirements = names


@setting
def PARAMETERS(config=None):
    """application configuration

    A dictionary with application parameters.
    """
    if not config:
        config = {}
    if isinstance(config, str):
        config = config.strip()
        if config.startswith('{') and config.endswith('}'):
            config = json.loads(config)
        else:
            config = dict(pair(item)
                          for item in shlex.split(config))
    if not (isinstance(config, dict) and
            all(isinstance(key, basestring) for key in config)):
        raise ValueError("expected a dictionary of application parameters")
    env.parameters = config


class RexNoInit(Rex):
    # Makes a Rex application without executing `Initialize` interface.

    def initialize(self):
        with self:
            # Make sure the requirement list is valid.
            get_packages()


def make_rex(project=None, require_list=None, set_list=None,
             initialize=True):
    # Creates a Rex application from command-line parameters
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
        rex_type = RexNoInit
    try:
        return rex_type(*requirements, **parameters)
    except Error, error:
        raise fail(str(error))


