#
# Copyright (c) 2016, Prometheus Research, LLC
#


from htsql.core.context import context
from htsql.core.util import to_name
from htsql.core.addon import Addon, Variable
from htsql.core.adapter import adapt
from htsql.core.cmd.command import Command
from htsql.core.cmd.act import Act, act, ProduceAction
from htsql.core.cmd.summon import Summon, recognize


class NamedPortsGuard:

    def __init__(self, ports):
        self.ports = {}
        for key, port in list(ports.items()):
            self.ports[to_name(key)] = port

    def __enter__(self):
        named_ports = context.env.named_ports.copy()
        named_ports.update(self.ports)
        context.env.push(named_ports=named_ports)

    def __exit__(self, exc_type, exc_value, exc_traceback):
        context.env.pop()


class PortCmd(Command):

    def __init__(self, port, old, new):
        self.port = port
        self.old = old
        self.new = new


class SummonPort(Summon):

    @classmethod
    def __matches__(component, dispatch_key):
        return (dispatch_key in context.env.named_ports)

    def __call__(self):
        if not (1 <= len(self.arguments) <= 2):
            raise Error("Expected 1 or 2 arguments")
        port = context.env.named_ports[self.name]
        arguments = list(map(recognize, self.arguments))
        if len(arguments) == 1:
            arguments = [None]+arguments
        return PortCmd(port, *arguments)


class ProducePort(Act):

    adapt(PortCmd, ProduceAction)

    def __call__(self):
        old = None
        if self.command.old is not None:
            old = act(self.command.old, self.action).data
        new = None
        if self.command.new is not None:
            new = act(self.command.new, self.action).data
        return self.command.port.replace(old, new)


def named_ports(**ports):
    return NamedPortsGuard(ports)


class PortAddon(Addon):

    name = 'rex_port'
    hint = """invoke ports from HTSQL"""
    help = """
    This addon provides an ability to use ports in HTSQL queries.
    """

    variables = [
            Variable('named_ports', {}),
    ]

    @classmethod
    def get_extension(cls, app, attributes):
        return {
            'rex': {},
        }


