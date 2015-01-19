#
# Copyright (c) 2006-2013, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, adapt_many
from htsql.core.domain import TextDomain, UntypedDomain
from htsql.core.tr.space import CastCode
from htsql.core.tr.encode import Convert, ConvertUntyped, ConvertToText
from ..domain import JSONDomain


class ConvertJSONAndText(ConvertToText):

    adapt_many((JSONDomain, TextDomain),
               (TextDomain, JSONDomain))


class ConvertUntypedToJSON(ConvertUntyped):

    adapt(UntypedDomain, JSONDomain)

    def __call__(self):
        flow = self.flow.clone(domain=TextDomain())
        code = Convert.__prepare__(flow, self.state)()
        return CastCode(code, self.domain, self.flow)


