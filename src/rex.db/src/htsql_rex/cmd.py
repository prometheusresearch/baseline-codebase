#
# Copyright (c) 2013, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, call
from htsql.core.error import Error
from htsql.core.cmd.act import Act, ProduceAction, analyze
from htsql.core.cmd.command import Command
from htsql.core.cmd.summon import Summon, recognize
from htsql.core.cmd.fetch import Product


class DescribeCmd(Command):

    def __init__(self, feed):
        self.feed = feed


class SummonDescribe(Summon):

    call('describe')

    def __call__(self):
        if len(self.arguments) != 1:
            raise Error("Expected one argument")
        [syntax] = self.arguments
        feed = recognize(syntax)
        return DescribeCmd(feed)


class ProduceDescribe(Act):

    adapt(DescribeCmd, ProduceAction)

    def __call__(self):
        plan = analyze(self.command.feed)
        return Product(plan.meta, None)


