#
# Copyright (c) 2014, Prometheus Research, LLC
#


from htsql.core.addon import Addon
from . import classify, cmd, connect, domain, introspect, fmt, tr


class DeployAddon(Addon):

    name = 'rex_deploy'
    hint = """configure rex.deploy databases"""
    help = """
    This addon provides metadata configuration for database
    schemas generated with `rex.deploy`.
    """
    packages = ['.', '.cmd', '.fmt', '.tr']

    @classmethod
    def get_extension(cls, app, attributes):
        return {
            'rex': {},
        }


