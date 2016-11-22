#
# Copyright (c) 2016, Prometheus Research, LLC
#


from htsql.core.addon import Addon
from htsql.core.adapter import adapt
from htsql.core.tr.binding import Recipe, BindingRecipe, RerouteBinding
from htsql.core.tr.bind import BindByRecipe


class BindingRecipe(BindingRecipe):

    def __init__(self, binding, optional=False, plural=False):
        self.binding = binding
        self.optional = optional
        self.plural = plural

    def __basis__(self):
        return (self.binding, self.optional, self.plural)


class DefinitionRecipe(Recipe):

    def __init__(self, base, definition, optional=False, plural=False):
        self.base = base
        self.definition = definition
        self.optional = optional
        self.plural = plural

    def __basis__(self):
        return (self.base, self.definition, self.optional, self.plural)


class BindByDefinition(BindByRecipe):

    adapt(DefinitionRecipe)

    def __call__(self):
        scope = RerouteBinding(
                self.state.scope,
                self.recipe.base,
                self.state.scope.syntax)
        self.state.push_scope(scope)
        binding = self.state(self.recipe.definition).binding
        self.state.pop_scope()
        return binding


class RexQueryAddon(Addon):

    name = 'rex_query'
    hint = """HTSQL rex.query extensions"""


