#
# Copyright (c) 2016, Prometheus Research, LLC
#


from htsql.core.addon import Addon
from htsql.core.adapter import adapt
from htsql.core.tr.binding import (
        Recipe, BindingRecipe, RerouteBinding, SelectionBinding)
from htsql.core.tr.bind import BindByRecipe
from htsql.core.tr.lookup import Lookup, ExpansionProbe


class SelectionBinding(SelectionBinding):

    def __init__(self, base, recipes, elements, domain, syntax):
        super(SelectionBinding, self).__init__(base, elements, domain, syntax)
        self.recipes = recipes


class BindingRecipe(BindingRecipe):

    def __init__(self, binding, optional=False, plural=False):
        self.binding = binding
        self.optional = optional
        self.plural = plural

    def __basis__(self):
        return (self.binding, self.optional, self.plural)


class DefinitionRecipe(Recipe):

    def __init__(self, base, definition, vars, optional=False, plural=False):
        self.base = base
        self.definition = definition
        self.vars = vars
        self.optional = optional
        self.plural = plural

    def __basis__(self):
        return (self.base, self.definition, self.optional, self.plural, self.vars)


class SelectSyntaxRecipe(DefinitionRecipe):
    pass


class BindByDefinition(BindByRecipe):

    adapt(DefinitionRecipe)

    def __call__(self):
        scope = RerouteBinding(
                self.state.scope,
                self.recipe.base,
                self.state.scope.syntax)
        self.state.push_scope(scope)
        with self.state.with_vars(self.recipe.vars):
            binding = self.state(self.recipe.definition).binding
        self.state.pop_scope()
        return binding


class BindBySelectSyntax(BindByRecipe):

    adapt(SelectSyntaxRecipe)

    def __call__(self):
        scope = RerouteBinding(
                self.state.scope,
                self.recipe.base,
                self.state.scope.syntax)
        self.state.push_scope(scope)
        with self.state.with_vars(self.recipe.vars):
            binding = self.state.collect(self.state(self.recipe.definition))
        self.state.pop_scope()
        return binding


class ExpandSelection(Lookup):

    adapt(SelectionBinding, ExpansionProbe)

    def itemize(self):
        for recipe, element in zip(self.binding.recipes, self.binding.elements):
            yield (element.syntax, recipe)


class RexQueryAddon(Addon):

    name = 'rex_query'
    hint = """HTSQL rex.query extensions"""


