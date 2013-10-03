#
# Copyright (c) 2013, Prometheus Research, LLC
#


from htsql.core.addon import Addon
from . import classify


class DeployAddon(Addon):

    name = 'rex_deploy'

    @classmethod
    def get_extension(cls, app, attributes):
        return {
            'rex': {},
        }


