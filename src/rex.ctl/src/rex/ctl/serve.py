#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import env, task, setting, argument, option
from cogs.log import log
from rex.core import Rex, get_settings, get_packages
import wsgiref.simple_server


@setting
def PROJECT(value=None):
    if not value:
        env.project = None
    elif isinstance(value, str):
        env.project = value
    else:
        raise ValueError("project name is expected")


@setting
def REQUIREMENTS(value=None):
    if not value:
        env.requirements = []
    elif isinstance(value, str):
        env.requirements = value.split()
    elif isinstance(value, list) and \
            all(isinstance(item, str) for item in value):
        env.requirements = value
    else:
        raise ValueError("list of requirements is expected")


@setting
def SETTINGS(value=None):
    if not value:
        env.settings = {}
    elif isinstance(value, dict) and \
            all(isinstance(key, str) for key in value):
        env.settings = value
    else:
        raise ValueError("dictionary of settings is expected")


@setting
def HTTP_HOST(value=None):
    if not value:
        env.http_host = None
    elif isinstance(value, str):
        env.http_host = value
    else:
        raise ValueError("host name is expected")


@setting
def HTTP_PORT(value=None):
    if not value:
        env.http_port = None
    elif isinstance(value, int) and 0 < value < 65535:
        env.http_port = value
    else:
        raise ValueError("port number is expected")


@task
class SERVE:

    project = argument(str, default=None)
    requirement = option('r', str, default=[], plural=True)
    setting = option('s', str, default={}, plural=True)
    host = option('h', str, default=None)
    port = option('p', int, default=None)

    def __init__(self, project, requirement, setting, host, port):
        self.requirements = []
        if project:
            self.requirements.append(project)
        elif env.project:
            self.requirements.append(env.project)
        self.requirements.extend(requirement)
        self.requirements.extend(env.requirements)
        self.settings = {}
        self.settings.update(env.settings)
        self.settings.update(setting)
        self.host = host or env.http_port or 'localhost'
        self.port = port or env.http_port or 8080

    def __call__(self):
        rex = Rex(*self.requirements, **self.settings)
        log("Rex: {}", rex)
        with rex:
            settings = get_settings()
            packages = get_packages()
        log("Settings: {}", settings)
        log("Packages: {}", packages)
        log("Starting Rex application on `{}:{}`", self.host, self.port)
        httpd = wsgiref.simple_server.make_server(self.host, self.port, rex)
        httpd.serve_forever()


