#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
The ``rex`` HTSQL addon registers extensions specific to the RexDB platform:
none so far.
"""


from htsql.core.addon import Addon
from htsql.core.adapter import adapt
from htsql.core.domain import RecordDomain
from htsql.core.model import ChainArc
from htsql.core.classify import relabel
from htsql.core.syn.syntax import IdentifierSyntax
from htsql.core.cmd.summon import SummonJSON
from htsql.core.tr.lookup import Lookup, ExpansionProbe, identify
from htsql.core.tr.binding import ChainBinding
from htsql.core.fmt.accept import AcceptJSON
from htsql.core.fmt.format import JSONFormat
from htsql.core.fmt.json import EmitJSON, to_json


class JSONWithNullFormat(JSONFormat):

    def __init__(self):
        super(JSONWithNullFormat, self).__init__(with_null=True)


class RexSummonJSON(SummonJSON):

    format = JSONWithNullFormat


class RexAcceptJSON(AcceptJSON):

    format = JSONWithNullFormat


class RexEmitJSON(EmitJSON):

    def emit(self):
        if self.meta.tag or not isinstance(self.meta.domain, RecordDomain):
            for token in super(RexEmitJSON, self).emit():
                yield token
        else:
            product_to_json = to_json(self.meta.domain)
            for token in product_to_json(self.data):
                yield token


class RexAddon(Addon):

    name = 'rex'
    hint = """HTSQL extensions for the RexDB platform"""
    help = __doc__


