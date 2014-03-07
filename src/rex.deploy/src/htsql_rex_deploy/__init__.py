#
# Copyright (c) 2014, Prometheus Research, LLC
#


from htsql.core.addon import Addon
from . import classify, introspect, tr


class DeployAddon(Addon):

    name = 'rex_deploy'
    hint = """configure rex.deploy databases"""
    help = """
    This addon provides metadata configuration for database
    schemas generated with `rex.deploy`.
    """
    packages = ['.', '.tr']

    @classmethod
    def get_extension(cls, app, attributes):
        return {
#            'rex': {},
        }


