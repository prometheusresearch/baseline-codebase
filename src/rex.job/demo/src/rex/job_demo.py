#
# Copyright (c) 2017, Prometheus Research, LLC
#

import time

from rex.core import Error
from rex.job import JobExecutor


__all__ = (
    'FastExecutor',
    'SlowExecutor',
    'FragileExecutor',
)


class FastExecutor(JobExecutor):
    name = 'demo_fast'

    def execute(self, code, owner, payload):
        self.logger.info('FastExecutor executed!')


class SlowExecutor(JobExecutor):
    name = 'demo_slow'

    def execute(self, code, owner, payload):
        time.sleep(5)
        self.update_facet('slow', code, my_value=payload['foo'])
        self.logger.info('SlowExecutor executed!')


class FragileExecutor(JobExecutor):
    name = 'demo_fragile'

    def execute(self, code, owner, payload):
        raise Error('I crashed :(')

