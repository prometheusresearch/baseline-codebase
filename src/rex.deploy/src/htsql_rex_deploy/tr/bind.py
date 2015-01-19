#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, call
from htsql.core.domain import EntityDomain
from htsql.core.syn.syntax import StringSyntax
from htsql.core.tr.binding import TitleBinding
from htsql.core.tr.bind import SelectRecord
from htsql.core.tr.lookup import guess_header
from htsql.core.tr.fn.bind import BindCast
from .lookup import select_identity
from ..domain import JSONDomain


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


