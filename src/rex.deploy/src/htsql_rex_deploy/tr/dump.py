#
# Copyright (c) 2006-2013, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.domain import Domain
from htsql.core.tr.dump import DumpToDomain
from htsql.core.tr.fn.dump import DumpFunction
from ..domain import JSONDomain
from .signature import (REMatchesSig, FTMatchesSig, FTQueryMatchesSig,
        FTHeadlineSig, FTQueryHeadlineSig, FTRankSig, FTQueryRankSig, JoinSig)


class DumpToJSON(DumpToDomain):

    adapt(Domain, JSONDomain)

    def __call__(self):
        self.format("CAST ({base} AS JSON)", base=self.base)


class DumpREMatches(DumpFunction):

    adapt(REMatchesSig)
    template = "({lop} ~* {rop})"


class DumpFTMatches(DumpFunction):

    adapt(FTMatchesSig)
    template = ("(TO_TSVECTOR('english', {lop})"
                " @@ PLAINTO_TSQUERY('english', {rop}))")


class DumpFTQueryMatches(DumpFunction):

    adapt(FTQueryMatchesSig)
    template = ("(TO_TSVECTOR('english', {lop})"
                " @@ TO_TSQUERY('english', {rop}))")


class DumpFTHeadline(DumpFunction):

    adapt(FTHeadlineSig)
    template = ("TS_HEADLINE('english', {lop},"
                " PLAINTO_TSQUERY('english', {rop}))")


class DumpFTQueryHeadline(DumpFunction):

    adapt(FTQueryHeadlineSig)
    template = ("TS_HEADLINE('english', {lop},"
                " TO_TSQUERY('english', {rop}))")


class DumpFTRank(DumpFunction):

    adapt(FTRankSig)
    template = ("TS_RANK(TO_TSVECTOR('english', {lop}),"
                " PLAINTO_TSQUERY('english', {rop}))")


class DumpFTQueryRank(DumpFunction):

    adapt(FTQueryRankSig)
    template = ("TS_RANK(TO_TSVECTOR('english', {lop}),"
                " TO_TSQUERY('english', {rop}))")


class DumpJoin(DumpFunction):

    adapt(JoinSig)
    template = "STRING_AGG({op}, {delimiter})"


