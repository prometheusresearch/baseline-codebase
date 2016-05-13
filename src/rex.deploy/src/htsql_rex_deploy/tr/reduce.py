#
# Copyright (c) 2016, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.tr.frame import FormulaPhrase
from htsql.core.tr.fn.reduce import ReduceConcatenate
from .signature import NullableConcatenateSig


class ReduceNullableConcatenate(ReduceConcatenate):

    adapt(NullableConcatenateSig)

    def __call__(self):
        arguments = self.arguments.map(self.state.reduce)
        return FormulaPhrase(
                self.signature,
                self.domain,
                self.is_nullable,
                self.phrase.expression,
                **arguments)


