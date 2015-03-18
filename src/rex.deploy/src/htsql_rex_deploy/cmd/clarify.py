#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.domain import TextDomain
from htsql.tweak.etl.cmd.insert import Clarify
from ..domain import JSONDomain



class ClarifyJSONFromText(Clarify):

    adapt(TextDomain, JSONDomain)

    def __call__(self):
        return self.domain.parse


