#
# Copyright (c) 2016, Prometheus Research, LLC
#


from .base import Processor


__all__ = (
    'AnalyzeProcessor',
)


class AnalyzeProcessor(Processor):
    """
    Invokes the PostgreSQL ANALYZE function on the Mart database.

    This Processor accepts no options.
    """

    #:
    name = 'analyze'

    def execute(self, options, interface):
        interface.get_deploy_driver().analyze()

