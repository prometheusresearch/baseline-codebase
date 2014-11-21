#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
The ``rex`` HTSQL addon registers extensions specific to the RexDB platform:
none so far.
"""


from htsql.core.addon import Addon, Variable, Parameter
from htsql.core.application import Environment, Application
from htsql.core.validator import NameVal, ClassVal, MapVal
from htsql.core.adapter import Adapter, adapt
from htsql.core.context import context
from htsql.core.error import Error
from htsql.core.connect import Transact, connect
from htsql.core.domain import RecordDomain, TextDomain, BooleanDomain
from htsql.core.model import Node, HomeNode, TableNode, TableArc, ChainArc
from htsql.core.classify import relabel, classify
from htsql.core.syn.syntax import Syntax, IdentifierSyntax, FilterSyntax
from htsql.core.syn.parse import parse
from htsql.core.cmd.act import Act
from htsql.core.cmd.summon import Summon, SummonJSON
from htsql.core.tr.lookup import (Lookup, Probe, ReferenceProbe,
        ReferenceSetProbe, ExpansionProbe, lookup, identify, localize,
        prescribe)
from htsql.core.tr.binding import (Recipe, LiteralRecipe, ChainRecipe, Binding,
        RootBinding, TableBinding, ChainBinding, SieveBinding,
        ImplicitCastBinding)
from htsql.core.tr.bind import (BindByFreeTable, BindByAttachedTable,
        BindByRecipe)
from htsql.core.fmt.accept import AcceptJSON
from htsql.core.fmt.format import JSONFormat
from htsql.core.fmt.json import EmitJSON, to_json
from htsql.tweak.gateway.command import SummonGateway, ActGateway


class LazyConnection(object):

    def __init__(self):
        self.connection = None
        self.scope = 0

    def __call__(self):
        if self.connection is None:
            self.connection = connect()
        return self.connection

    def up(self):
        self.scope += 1

    def down(self, exc_type):
        self.scope -= 1
        if self.scope == 0 and self.connection is not None:
            if exc_type is None:
                self.connection.commit()
            else:
                self.connection.invalidate()
            self.connection.release()
            self.connection = None

    def __nonzero__(self):
        return bool(self.scope)


class LazyTransactionGuard(object):

    def __init__(self, is_lazy):
        self.is_lazy = is_lazy

    def __enter__(self):
        env = context.env
        if env.connection is None:
            env.push(connection=LazyConnection())
        env.connection.up()
        if not self.is_lazy:
            return env.connection()

    def __exit__(self, exc_type, exc_value, exc_traceback):
        env = context.env
        env.connection.down(exc_type)
        if not env.connection:
            env.pop()


class LazyTransact(Transact):

    def __init__(self, is_lazy=False):
        self.is_lazy = is_lazy

    def __call__(self):
        return LazyTransactionGuard(self.is_lazy)


class LazySession(object):

    def __init__(self, session):
        self.session = session

    def __call__(self):
        if callable(self.session):
            self.session = self.session()
        if isinstance(self.session, str):
            self.session = self.session.decode('utf-8', 'replace')
        if self.session is not None and not isinstance(self.session, unicode):
            self.session = unicode(self.session)
        return self.session


class SessionGuard(object):

    def __init__(self, session):
        self.session = session

    def __enter__(self):
        context.env.push(session=LazySession(self.session))

    def __exit__(self, exc_type, exc_value, exc_traceback):
        context.env.pop()


class Mask(object):

    def __init__(self, path, node, syntax):
        self.path = path
        self.node = node
        self.syntax = syntax


class LazyMasks(object):

    def __init__(self, values):
        self.values = values

    def __call__(self):
        if not all([isinstance(value, Mask) for value in self.values]):
            values = []
            for value in self.values:
                if callable(value):
                    value = value()
                if isinstance(value, list):
                    values.extend(value)
                else:
                    values.append(value)
            self.values = []
            for value in values:
                if not isinstance(value, Mask):
                    syntax = parse(value)
                    if not (isinstance(syntax, FilterSyntax) and
                            isinstance(syntax.larm, IdentifierSyntax)):
                        raise Error("Expected a mask expression", syntax)
                    name = syntax.larm.name
                    for label in classify(HomeNode()):
                        if (label.name == name and
                                isinstance(label.arc, TableArc)):
                            value = Mask([], label.arc.target, syntax.rarm)
                            break
                    else:
                        raise Error("Got unknown table", syntax)
                self.values.append(value)
        return self.values


class MasksGuard(object):

    def __init__(self, masks):
        self.masks = masks

    def __enter__(self):
        masks = ([context.env.masks] if context.env.masks else []) + self.masks
        context.env.push(masks=LazyMasks(masks))

    def __exit__(self, exc_type, exc_value, exc_traceback):
        context.env.pop()


def session(session):
    return SessionGuard(session)


def mask(*masks):
    return MasksGuard(list(masks))


class IsolateGuard(object):

    def __init__(self, app):
        self.app = app

    def __enter__(self):
        env = Environment(**self.app.variables)
        context.push(self.app, env)

    def __exit__(self, exc_type, exc_value, exc_traceback):
        context.pop(self.app)


def isolate(app):
    return IsolateGuard(app)


class JSONWithNullFormat(JSONFormat):

    def __init__(self):
        super(JSONWithNullFormat, self).__init__(with_null=True)


class RexSummonJSON(SummonJSON):

    format = JSONWithNullFormat


class RexAcceptJSON(AcceptJSON):

    format = JSONWithNullFormat


class RexEmitJSON(EmitJSON):

    def emit(self):
        if self.meta.tag or not isinstance(self.meta.domain, RecordDomain):
            for token in super(RexEmitJSON, self).emit():
                yield token
        else:
            product_to_json = to_json(self.meta.domain)
            for token in product_to_json(self.data):
                yield token


class LookupReferenceInRoot(Lookup):

    adapt(RootBinding, ReferenceProbe)

    def __call__(self):
        if self.probe.key == u'user':
            session = context.env.session()
            if isinstance(session, str):
                session = session.decode('utf-8', 'replace')
            if session is not None:
                session = unicode(session)
            return LiteralRecipe(session, TextDomain())
        return super(LookupReferenceInRoot, self).__call__()


class LookupReferenceSetInRoot(Lookup):

    adapt(RootBinding, ReferenceSetProbe)

    def __call__(self):
        references = super(LookupReferenceSetInRoot, self).__call__()
        references.add(u'user')
        return references


class Conceal(Adapter):

    adapt(Node)

    def __init__(self, node):
        self.node = node

    def __call__(self):
        return []


class ConcealTable(Conceal):

    adapt(TableNode)

    def __call__(self):
        masks = [mask for mask in context.env.masks()
                      if mask.node == self.node]
        for arc in (localize(self.node) or []):
            for mask in conceal(arc.target):
                mask = Mask([arc]+mask.path, mask.node, mask.syntax)
                masks.append(mask)
        return masks


conceal = Conceal.__invoke__


class CloakProbe(Probe):
    pass


class Cloak(Lookup):

    adapt(Binding, CloakProbe)

    def __call__(self):
        return []


class CloakTable(Lookup):

    adapt(TableBinding, CloakProbe)

    def __call__(self):
        node = TableNode(self.binding.table)
        recipes = []
        for mask in conceal(node):
            chain = []
            for arc in mask.path:
                chain.append(prescribe(arc, self.binding))
            syntax = mask.syntax
            chain.append(SyntaxRecipe(syntax))
            recipe = SieveRecipe(ChainRecipe(chain))
            recipes.append(recipe)
        return recipes


class CloakChain(Lookup):

    adapt(ChainBinding, CloakProbe)

    def __call__(self):
        parent_node = TableNode(self.binding.joins[0].origin)
        node = TableNode(self.binding.table)
        link = ChainArc(self.binding.joins[0].origin, self.binding.joins)
        reverse_link = link.reverse()
        parent_masks = conceal(parent_node)
        recipes = []
        for mask in conceal(node):
            if any([link]+mask.path == parent_mask.path and
                   mask.syntax == parent_mask.syntax
                   for parent_mask in parent_masks):
                continue
            if any(mask.path == [reverse_link]+parent_mask.path and
                   mask.syntax == parent_mask.syntax
                   for parent_mask in parent_masks):
                continue
            chain = []
            for arc in mask.path:
                chain.append(prescribe(arc, self.binding))
            syntax = mask.syntax
            chain.append(SyntaxRecipe(syntax))
            recipe = SieveRecipe(ChainRecipe(chain))
            recipes.append(recipe)
        return recipes


def cloak(binding):
    if context.env.masks is None:
        return []
    probe = CloakProbe()
    return lookup(binding, probe)


class SyntaxRecipe(Recipe):

    def __init__(self, syntax):
        assert isinstance(syntax, Syntax)
        self.syntax = syntax

    def __basis__(self):
        return (self.syntax,)


class SieveRecipe(Recipe):

    def __init__(self, filter):
        assert isinstance(filter, Recipe)
        self.filter = filter

    def __basis__(self):
        return (self.filter,)


class MaskedBindByTable(BindByFreeTable):

    @classmethod
    def __enabled__(component):
        if hasattr(context.app, 'rex_rdoma'):
            return False
        return super(MaskedBindByTable, component).__enabled__()

    def __call__(self):
        binding = TableBinding(self.state.scope,
                               self.recipe.table,
                               self.syntax)
        for recipe in cloak(binding):
            binding = self.state.use(recipe, self.syntax, scope=binding)
        return binding


class MaskedBindByChain(BindByAttachedTable):

    @classmethod
    def __enabled__(component):
        if hasattr(context.app, 'rex_rdoma'):
            return False
        return super(MaskedBindByChain, component).__enabled__()

    def __call__(self):
        binding = self.state.scope
        binding = ChainBinding(binding, self.recipe.joins, self.syntax)
        for recipe in cloak(binding):
            binding = self.state.use(recipe, self.syntax, scope=binding)
        return binding


class BindBySyntax(BindByRecipe):

    adapt(SyntaxRecipe)

    def __call__(self):
        return self.state.bind(self.recipe.syntax)


class BindBySieve(BindByRecipe):

    adapt(SieveRecipe)

    def __call__(self):
        filter = self.state.use(self.recipe.filter, self.syntax)
        filter = ImplicitCastBinding(filter, BooleanDomain(),
                                     filter.syntax)
        return SieveBinding(self.state.scope, filter, self.syntax)


class RexSummonGateway(SummonGateway, Summon):
    pass


class RexActGateway(ActGateway, Act):
    pass


class RexAddon(Addon):

    name = 'rex'
    hint = """HTSQL extensions for the RexDB platform"""
    help = __doc__

    variables = [
            Variable('session'),
            Variable('masks'),
    ]

    parameters = [
            Parameter('gateways', MapVal(NameVal(), ClassVal(Application)),
                      default={}),
    ]

    def __init__(self, app, attributes):
        super(RexAddon, self).__init__(app, attributes)
        self.functions = {}
        for name in sorted(self.gateways):
            instance = self.gateways[name]
            class_name = "Summon%s" % name.title().replace('_', '').encode('utf-8')
            namespace = {
                '__names__': [name.encode('utf-8')],
                'instance': instance,
            }
            summon_class = type(class_name, (RexSummonGateway,), namespace)
            self.functions[name] = summon_class


