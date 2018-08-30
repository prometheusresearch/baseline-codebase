#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Error, UStrVal, Location, set_location
from htsql.core import HTSQLAddon
from htsql.core.application import Application
from htsql.core.adapter import ComponentRegistry
from htsql.core.error import Error as HTSQLError
from htsql.core.syn.syntax import Syntax
from htsql.core.syn.decode import decode
from htsql.core.syn.scan import prepare_scan
from htsql.core.syn.parse import prepare_parse


class DummyHTSQL(Application):

    def __init__(self):
        self.htsql = HTSQLAddon(self, {})
        self.addons = [self.htsql]
        self.variables = {}
        for addon in self.addons:
            for variable in addon.variables:
                self.variables[variable.attribute] = variable.default
        self.component_registry = ComponentRegistry(self.addons)


with DummyHTSQL():

    def decode_htsql(text):
        """
        Decodes a %-encoded HTSQL expression.
        """
        return decode(text)

    def scan_htsql(text, start=None, scan=prepare_scan()):
        """
        Converts an HTSQL expression to an array of tokens.
        """
        return scan(decode(text), start)

    def parse_htsql(
            text, start=None,
            scan=prepare_scan(), parse=prepare_parse(),
            cache={}, cache_max_size=10000):
        """
        Converts an HTSQL expression to a syntax tree.
        """
        cache_key = (text, start)
        try:
            return cache[cache_key]
        except KeyError:
            syntax = parse(scan(decode(text)), start)
            if len(cache) > cache_max_size:
                cache.clear()
            cache[cache_key] = syntax
            return syntax


class SyntaxVal(UStrVal):
    """
    Verifies if the input is a valid HTSQL expression.
    """

    def __init__(self, start=None):
        self.start = start

    def __call__(self, data):
        if isinstance(data, Syntax):
            return data
        data = super(SyntaxVal, self).__call__(data)
        try:
            syntax = parse_htsql(data, self.start)
        except HTSQLError as exc:
            raise Error("Failed to parse an HTSQL expression:", str(exc))
        return syntax

    def construct(self, loader, node):
        syntax = super(SyntaxVal, self).construct(loader, node)
        location = Location.from_node(node)
        set_location(syntax, location)
        return syntax


