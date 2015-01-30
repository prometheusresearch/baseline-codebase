#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, call
from htsql.core.error import Error, translate_guard
from htsql.core.domain import (UntypedDomain, BooleanDomain, TextDomain,
        FloatDomain, EntityDomain)
from htsql.core.syn.syntax import StringSyntax
from htsql.core.tr.binding import TitleBinding, FormulaBinding
from htsql.core.tr.bind import SelectRecord
from htsql.core.tr.lookup import guess_header, expand
from htsql.core.tr.fn.signature import AggregateSig
from htsql.core.tr.fn.bind import (BindCast, BindMonoFunction,
        BindPolyFunction, Correlate, CorrelateFunction, match)
from ..domain import JSONDomain
from .lookup import select_identity
from .signature import (REMatchesSig, FTMatchesSig, FTQueryMatchesSig,
        FTHeadlineSig, FTQueryHeadlineSig, FTRankSig, FTQueryRankSig, JoinSig)


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
                                % (self.name.encode('utf-8'), len(recipes)))
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


