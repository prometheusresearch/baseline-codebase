#
# Copyright (c) 2006-2013, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.domain import Domain
from htsql.core.tr.dump import DumpToDomain, DumpByDomain
from htsql.core.tr.fn.dump import DumpFunction
from htsql_pgsql.core.tr.dump import (
        PGSQLDumpDateIncrement, PGSQLDumpDateDecrement)
from ..domain import JSONDomain
from .signature import (
        EscapeIdentitySig, REMatchesSig, FTMatchesSig, FTQueryMatchesSig,
        FTHeadlineSig, FTQueryHeadlineSig, FTRankSig, FTQueryRankSig, JoinSig,
        AbsSig, SignSig, CeilSig, FloorSig, DivSig, ModSig, ExpSig, PowSig,
        LnSig, Log10Sig, LogSig, PiSig, ACosSig, ASinSig, ATanSig, ATan2Sig,
        CosSig, CotSig, SinSig, TanSig, RandomSig, ToJSONSig, JSONGetSig,
        JSONGetJSONSig, MedianSig)


class DeployDumpDateIncrement(PGSQLDumpDateIncrement):

    template = "({lop} + ({rop})::int4)"


class DeployDumpDateDecrement(PGSQLDumpDateDecrement):

    template = "({lop} - ({rop})::int4)"


class DumpToJSON(DumpToDomain):

    adapt(Domain, JSONDomain)

    def __call__(self):
        self.format("CAST ({base} AS JSONB)", base=self.base)


class DumpJSON(DumpByDomain):

    adapt(JSONDomain)

    def __call__(self):
        self.format("{value:literal}::JSONB", value=self.domain.dump(self.value))


class DumpConvertToJSON(DumpFunction):

    adapt(ToJSONSig)
    template = "TO_JSONB({op})"


class DumpJSONGet(DumpFunction):

    adapt(JSONGetSig)
    template = "({lop} ->> {rop})"


class DumpJSONGetJSON(DumpFunction):

    adapt(JSONGetJSONSig)
    template = "({lop} -> {rop})"


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


class DumpAbs(DumpFunction):

    adapt(AbsSig)
    template = "ABS({op})"


class DumpSign(DumpFunction):

    adapt(SignSig)
    template = "SIGN({op})"


class DumpCeil(DumpFunction):

    adapt(CeilSig)
    template = "CEIL({op})"


class DumpFloor(DumpFunction):

    adapt(FloorSig)
    template = "FLOOR({op})"


class DumpDiv(DumpFunction):

    adapt(DivSig)
    template = "DIV({lop}, {rop})"


class DumpMod(DumpFunction):

    adapt(ModSig)
    template = "MOD({lop}, {rop})"


class DumpExp(DumpFunction):

    adapt(ExpSig)
    template = "EXP({op})"


class DumpPow(DumpFunction):

    adapt(PowSig)
    template = "POWER({lop}, {rop})"


class DumpLn(DumpFunction):

    adapt(LnSig)
    template = "LN({op})"


class DumpLog10(DumpFunction):

    adapt(Log10Sig)
    template = "LOG({op})"


class DumpLog(DumpFunction):

    adapt(LogSig)
    template = "LOG({rop}, {lop})"


class DumpPi(DumpFunction):

    adapt(PiSig)
    template = "PI()"


class DumpACos(DumpFunction):

    adapt(ACosSig)
    template = "ACOS({op})"


class DumpASin(DumpFunction):

    adapt(ASinSig)
    template = "ASIN({op})"


class DumpATan(DumpFunction):

    adapt(ATanSig)
    template = "ATAN({op})"


class DumpATan2(DumpFunction):

    adapt(ATan2Sig)
    template = "ATAN2({lop}, {rop})"


class DumpCos(DumpFunction):

    adapt(CosSig)
    template = "COS({op})"


class DumpCot(DumpFunction):

    adapt(CotSig)
    template = "COT({op})"


class DumpSin(DumpFunction):

    adapt(SinSig)
    template = "SIN({op})"


class DumpTan(DumpFunction):

    adapt(TanSig)
    template = "TAN({op})"


class DumpRandom(DumpFunction):

    adapt(RandomSig)
    template = "RANDOM()"


class DumpEscapeIdentity(DumpFunction):

    adapt(EscapeIdentitySig)
    template = "(CASE WHEN {op} ~ '^[0-9A-Za-z_-]+$' THEN {op}" \
               " ELSE '''' || REPLACE({op}, '''', '''''') || '''' END)"


class DumpMedian(DumpFunction):

    adapt(MedianSig)
    template = "(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY {op}))"


