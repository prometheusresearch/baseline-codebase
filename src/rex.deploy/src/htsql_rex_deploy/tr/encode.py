#
# Copyright (c) 2006-2013, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, adapt_many
from htsql.core.domain import (
        BooleanDomain, IntegerDomain, DateDomain, TextDomain, UntypedDomain,
        IdentityDomain)
from htsql.core.tr.flow import IdentityFlow
from htsql.core.tr.space import CastCode, LiteralCode, FormulaCode
from htsql.core.tr.encode import Convert, ConvertUntyped, ConvertToText
from ..domain import JSONDomain
from .signature import NullableConcatenateSig, EscapeIdentitySig


class ConvertJSONAndText(ConvertToText):

    adapt_many((JSONDomain, TextDomain),
               (TextDomain, JSONDomain))


class ConvertUntypedToJSON(ConvertUntyped):

    adapt(UntypedDomain, JSONDomain)

    def __call__(self):
        flow = self.flow.clone(domain=TextDomain())
        code = Convert.__prepare__(flow, self.state)()
        return CastCode(code, self.domain, self.flow)


class ConvertIdentityToText(Convert):

    adapt(IdentityDomain, TextDomain)

    def __call__(self):
        if not isinstance(self.flow.base, IdentityFlow):
            return super(ConvertIdentityToText, self).__call__()
        is_simple = all([not isinstance(element.domain, IdentityDomain)
                         for element in self.flow.base.elements[1:]])
        lparen = LiteralCode(u'(', TextDomain(), self.flow)
        rparen = LiteralCode(u')', TextDomain(), self.flow)
        period = LiteralCode(u'.', TextDomain(), self.flow)
        codes = []
        for element in self.flow.base.elements:
            flow = self.flow.clone(base=element)
            code = Convert.__prepare__(flow, self.state)()
            if isinstance(element.domain, IdentityDomain):
                is_flattened = (is_simple or len(element.domain.labels) == 1)
                if not is_flattened:
                    code = FormulaCode(
                            NullableConcatenateSig(), TextDomain(), self.flow,
                            lop=lparen, rop=code)
                    code = FormulaCode(
                            NullableConcatenateSig(), TextDomain(), self.flow,
                            lop=code, rop=rparen)
            elif not isinstance(
                        element.domain,
                        (BooleanDomain, IntegerDomain, DateDomain)):
                code = FormulaCode(
                        EscapeIdentitySig(), TextDomain(), self.flow, op=code)
            codes.append(code)
        identity = codes[0]
        for code in codes[1:]:
            identity = FormulaCode(
                    NullableConcatenateSig(), TextDomain(), self.flow,
                    lop=identity, rop=period)
            identity = FormulaCode(
                    NullableConcatenateSig(), TextDomain(), self.flow,
                    lop=identity, rop=code)
        return identity


