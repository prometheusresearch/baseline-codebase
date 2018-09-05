#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, call
from htsql.core.error import Error, translate_guard
from htsql.core.domain import (UntypedDomain, BooleanDomain, TextDomain,
        IntegerDomain, DecimalDomain, FloatDomain, EntityDomain)
from htsql.core.syn.syntax import StringSyntax
from htsql.core.tr.binding import TitleBinding, FormulaBinding
from htsql.core.tr.bind import SelectRecord
from htsql.core.tr.lookup import guess_header, expand
from htsql.core.tr.fn.signature import AggregateSig
from htsql.core.tr.fn.bind import (BindCast, BindMonoFunction,
        BindPolyFunction, BindPolyAggregate, Correlate, CorrelateFunction,
        match)
from ..domain import JSONDomain
from .lookup import select_identity
from .signature import (REMatchesSig, FTMatchesSig, FTQueryMatchesSig,
        FTHeadlineSig, FTQueryHeadlineSig, FTRankSig, FTQueryRankSig, JoinSig,
        AbsSig, SignSig, CeilSig, FloorSig, DivSig, ModSig, ExpSig, PowSig,
        LnSig, Log10Sig, LogSig, PiSig, ACosSig, ASinSig, ATanSig, ATan2Sig,
        CosSig, CotSig, SinSig, TanSig, RandomSig, JSONGetSig, JSONGetJSONSig,
        MedianSig)


class SelectEntity(SelectRecord):

    adapt(EntityDomain)

    def __call__(self):
        recipe = select_identity(self.binding)
        if recipe is None:
            return super(SelectEntity, self).__call__()
        header = guess_header(self.binding)
        binding = self.state.use(
                recipe, self.binding.syntax, scope=self.binding)
        if header:
            binding = TitleBinding(
                    binding, StringSyntax(header), self.binding.syntax)
        return binding


class BindJSONCast(BindCast):

    call('json')
    codomain = JSONDomain()


class BindJSONGet(BindMonoFunction):

    call('json_get')
    signature = JSONGetSig
    domains = [JSONDomain(), TextDomain()]
    codomain = TextDomain()


class BindJSONGetJSON(BindMonoFunction):

    call('json_get_json')
    signature = JSONGetJSONSig
    domains = [JSONDomain(), TextDomain()]
    codomain = JSONDomain()


class BindREMatches(BindMonoFunction):

    call('re_matches')
    signature = REMatchesSig
    domains = [TextDomain(), TextDomain()]
    codomain = BooleanDomain()


class BindFTMatches(BindMonoFunction):

    call('ft_matches')
    signature = FTMatchesSig
    domains = [TextDomain(), TextDomain()]
    codomain = BooleanDomain()


class BindFTQueryMatches(BindFTMatches):

    call('ft_query_matches')
    signature = FTQueryMatchesSig


class BindFTHeadline(BindMonoFunction):

    call('ft_headline')
    signature = FTHeadlineSig
    domains = [TextDomain(), TextDomain()]
    codomain = TextDomain()


class BindFTQueryHeadline(BindFTHeadline):

    call('ft_query_headline')
    signature = FTQueryHeadlineSig


class BindFTRank(BindMonoFunction):

    call('ft_rank')
    signature = FTRankSig
    domains = [TextDomain(), TextDomain()]
    codomain = FloatDomain()


class BindFTQueryRank(BindFTRank):

    call('ft_query_rank')
    signature = FTQueryRankSig


class BindJoin(BindPolyFunction):

    call('join')
    signature = JoinSig
    codomain = UntypedDomain()

    def correlate(self, op, delimiter):
        recipes = expand(op, with_syntax=True)
        plural_base = None
        if recipes is not None:
            if len(recipes) != 1:
                with translate_guard(op):
                    raise Error("Function '%s' expects 1 field"
                                " for its first argument; got %s"
                                % (self.name, len(recipes)))
            plural_base = op
            syntax, recipe = recipes[0]
            op = self.state.use(recipe, syntax)
        binding = FormulaBinding(self.state.scope,
                                 self.signature(), self.codomain, self.syntax,
                                 op=op, delimiter=delimiter)
        binding = Correlate.__invoke__(binding, self.state)
        return FormulaBinding(self.state.scope,
                              AggregateSig(), binding.domain, binding.syntax,
                              plural_base=plural_base, op=binding)


class CorrelateTextJoin(CorrelateFunction):

    match(JoinSig, (TextDomain, TextDomain),
                   (TextDomain, UntypedDomain))
    signature = JoinSig
    domains = [TextDomain(), TextDomain()]
    codomain = TextDomain()


class BindAbs(BindPolyFunction):

    call('abs')
    signature = AbsSig


class CorrelateIntegerAbs(CorrelateFunction):

    match(AbsSig, IntegerDomain)
    signature = AbsSig
    domains = [IntegerDomain()]
    codomain = IntegerDomain()


class CorrelateDecimalAbs(CorrelateFunction):

    match(AbsSig, DecimalDomain)
    signature = AbsSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatAbs(CorrelateFunction):

    match(AbsSig, FloatDomain)
    signature = AbsSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindSign(BindPolyFunction):

    call('sign')
    signature = SignSig


class CorrelateDecimalSign(CorrelateFunction):

    match(SignSig, IntegerDomain,
                   DecimalDomain)
    signature = SignSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatSign(CorrelateFunction):

    match(SignSig, FloatDomain)
    signature = SignSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindCeil(BindPolyFunction):

    call('ceil')
    signature = CeilSig


class CorrelateDecimalCeil(CorrelateFunction):

    match(CeilSig, IntegerDomain,
                   DecimalDomain)
    signature = CeilSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatCeil(CorrelateFunction):

    match(CeilSig, FloatDomain)
    signature = CeilSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindFloor(BindPolyFunction):

    call('floor')
    signature = FloorSig


class CorrelateDecimalFloor(CorrelateFunction):

    match(FloorSig, IntegerDomain,
                    DecimalDomain)
    signature = FloorSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatFloor(CorrelateFunction):

    match(FloorSig, FloatDomain)
    signature = FloorSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindDiv(BindPolyFunction):

    call('div')
    signature = DivSig


class CorrelateDecimalDiv(CorrelateFunction):

    match(DivSig, IntegerDomain,
                  DecimalDomain)
    signature = DivSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class BindMod(BindPolyFunction):

    call('mod')
    signature = ModSig


class CorrelateDecimalMod(CorrelateFunction):

    match(ModSig, IntegerDomain,
                  DecimalDomain)
    signature = ModSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class BindExp(BindPolyFunction):

    call('exp')
    signature = ExpSig


class CorrelateDecimalExp(CorrelateFunction):

    match(ExpSig, IntegerDomain,
                  DecimalDomain)
    signature = ExpSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatExp(CorrelateFunction):

    match(ExpSig, FloatDomain)
    signature = ExpSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindPow(BindPolyFunction):

    call('pow')
    signature = PowSig


class CorrelateDecimalPow(CorrelateFunction):

    match(PowSig, (IntegerDomain, IntegerDomain),
                  (IntegerDomain, DecimalDomain),
                  (DecimalDomain, IntegerDomain),
                  (DecimalDomain, DecimalDomain))
    signature = PowSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatPow(CorrelateFunction):

    match(PowSig, (IntegerDomain, FloatDomain),
                  (DecimalDomain, FloatDomain),
                  (FloatDomain, IntegerDomain),
                  (FloatDomain, DecimalDomain),
                  (FloatDomain, FloatDomain))
    signature = PowSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindLn(BindPolyFunction):

    call('ln')
    signature = LnSig


class CorrelateDecimalLn(CorrelateFunction):

    match(LnSig, IntegerDomain,
                 DecimalDomain)
    signature = LnSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatLn(CorrelateFunction):

    match(LnSig, FloatDomain)
    signature = LnSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindLog10(BindPolyFunction):

    call('log10')
    signature = Log10Sig


class CorrelateDecimalLog10(CorrelateFunction):

    match(Log10Sig, IntegerDomain,
                    DecimalDomain)
    signature = Log10Sig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class CorrelateFloatLog10(CorrelateFunction):

    match(Log10Sig, FloatDomain)
    signature = Log10Sig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindLog(BindPolyFunction):

    call('log')
    signature = LogSig


class CorrelateDecimalLog(CorrelateFunction):

    match(LogSig, (IntegerDomain, IntegerDomain),
                  (IntegerDomain, DecimalDomain),
                  (DecimalDomain, IntegerDomain),
                  (DecimalDomain, DecimalDomain))
    signature = LogSig
    domains = [DecimalDomain()]
    codomain = DecimalDomain()


class BindPi(BindMonoFunction):

    call('pi')
    signature = PiSig
    domains = []
    codomain = FloatDomain()


class BindACos(BindMonoFunction):

    call('acos')
    signature = ACosSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindASin(BindMonoFunction):

    call('asin')
    signature = ASinSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindATan(BindMonoFunction):

    call('atan')
    signature = ATanSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindATan2(BindMonoFunction):

    call('atan2')
    signature = ATan2Sig
    domains = [FloatDomain(), FloatDomain()]
    codomain = FloatDomain()


class BindCos(BindMonoFunction):

    call('cos')
    signature = CosSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindCot(BindMonoFunction):

    call('cot')
    signature = CotSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindSin(BindMonoFunction):

    call('sin')
    signature = SinSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindTan(BindMonoFunction):

    call('tan')
    signature = TanSig
    domains = [FloatDomain()]
    codomain = FloatDomain()


class BindRandom(BindMonoFunction):

    call('random')
    signature = RandomSig
    domains = []
    codomain = FloatDomain()


class BindMedian(BindPolyAggregate):

    call('median')
    signature = MedianSig


class BindFloatMedian(CorrelateFunction):

    match(MedianSig, IntegerDomain,
                     DecimalDomain,
                     FloatDomain)
    signature = MedianSig
    domain = [FloatDomain()]
    codomain = FloatDomain()


