#
# Copyright (c) 2006-2013, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, adapt_many
from htsql.core.domain import (
        BooleanDomain, NumberDomain, IntegerDomain, DateDomain, TextDomain,
        UntypedDomain, IdentityDomain, RecordDomain)
from htsql.core.tr.flow import IdentityFlow, SelectionFlow
from htsql.core.tr.space import CastCode, LiteralCode, FormulaCode
from htsql.core.tr.encode import Convert, ConvertUntyped, ConvertToText
from htsql.core.tr.signature import IfNullSig
from ..domain import JSONDomain
from .signature import NullableConcatenateSig, EscapeIdentitySig, ToJSONSig
import json


class ConvertJSONAndText(ConvertToText):

    adapt_many((JSONDomain, TextDomain),
               (TextDomain, JSONDomain))


class ConvertUntypedToJSON(ConvertUntyped):

    adapt(UntypedDomain, JSONDomain)

    def __call__(self):
        flow = self.flow.clone(domain=TextDomain())
        code = Convert.__prepare__(flow, self.state)()
        return CastCode(code, self.domain, self.flow)


class ConvertRecordToJSON(Convert):

    adapt(RecordDomain, JSONDomain)

    def __call__(self):
        if not isinstance(self.flow.base, SelectionFlow):
            return super(ConvertRecordToJSON, self).__call__()
        chunks = []
        chunks.append(LiteralCode('{', TextDomain(), self.flow))
        for idx, field in enumerate(self.flow.base.domain.fields):
            if idx > 0:
                chunks.append(LiteralCode(',', TextDomain(), self.flow))
            chunks.append(
                    LiteralCode(
                        str(json.dumps(field.tag or '')) + ':',
                        TextDomain(), self.flow))
            element = self.state.encode(self.flow.base.elements[idx])
            if isinstance(element.domain, UntypedDomain):
                element = element.clone(domain=TextDomain())
            if not isinstance(
                    element.domain, (BooleanDomain, NumberDomain, JSONDomain)):
                element = CastCode(element, TextDomain(), element.flow)
            element = FormulaCode(
                    ToJSONSig(), JSONDomain(), element.flow, op=element)
            element = FormulaCode(
                    IfNullSig(), TextDomain(), element.flow,
                    lop=element,
                    rop=LiteralCode('null', TextDomain(), element.flow))
            chunks.append(element)
        chunks.append(LiteralCode('}', TextDomain(), self.flow))
        code = chunks[0]
        for chunk in chunks[1:]:
            code = FormulaCode(
                    NullableConcatenateSig(), TextDomain(), self.flow,
                    lop=code, rop=chunk)
        return CastCode(code, self.domain, self.flow)


class ConvertIdentityToText(Convert):

    adapt(IdentityDomain, TextDomain)

    def __call__(self):
        if not isinstance(self.flow.base, IdentityFlow):
            return super(ConvertIdentityToText, self).__call__()
        is_simple = all([not isinstance(element.domain, IdentityDomain)
                         for element in self.flow.base.elements[1:]])
        lparen = LiteralCode('(', TextDomain(), self.flow)
        rparen = LiteralCode(')', TextDomain(), self.flow)
        period = LiteralCode('.', TextDomain(), self.flow)
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


