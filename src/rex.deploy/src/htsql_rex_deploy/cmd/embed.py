#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.domain import Value
from htsql.core.cmd.embed import Embed
from ..domain import JSONDomain
import json


class EmbedDict(Embed):

    adapt(dict)

    def __call__(self):
        json.dumps(self.data)
        return Value(JSONDomain(), self.data)


