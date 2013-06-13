#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import setting, env
from cogs.log import debug
from rex.core import Rex, get_packages, Error
import shlex
import json


def pair(value):
    if not isinstance(value, str):
        raise ValueError("expected a string")
    if '=' in value:
        return tuple(value.split('=', 1))
    else:
        return (value, True)


@setting
def PROJECT(value=None):
    """package name

    This setting defines the package used by `serve` and
    other tasks when not specified on command line.
    """
    if not value:
        value = None
    if not (value is None or isinstance(value, str)):
        raise ValueError("expected a project name")
    env.project = value


@setting
def REQUIREMENTS(value=None):
    """list of package names

    Additional packages to include with the Rex application.
    """
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
        raise ValueError("expected a list of requirements")
    env.requirements = value


@setting
def SETTINGS(value=None):
    """application configuration

    This parameter is a dictionary with application configuration.
    """
    if not value:
        value = {}
    if isinstance(value, str):
        value = value.strip()
        if value.startswith('{') and value.endswith('}'):
            value = json.loads(value)
        else:
            value = dict(pair(item) for item in shlex.split(value))
    if not (isinstance(value, dict) and
            all(isinstance(key, str) for key in value)):
        raise ValueError("expected a dictionary of settings")
    env.settings = value


class RexNoInit(Rex):

    def initialize(self):
        with self:
            get_packages()


def make_rex(project=None, require_list=None, set_list=None,
             initialize=True):
    requirements = []
    if project is not None:
        requirements.append(project)
    elif env.project is not None:
        requirements.append(env.project)
    if require_list is not None:
        requirements.extend(require_list)
    requirements.extend(env.requirements)
    settings = {}
    if env.debug:
        settings['debug'] = True
    settings.update(env.settings)
    if set_list is not None:
        settings.update(set_list)
    rex_type = Rex
    if not initialize:
        rex_type = RexNoInit
    try:
        return rex_type(*requirements, **settings)
    except Error, error:
        raise fail(str(error))


