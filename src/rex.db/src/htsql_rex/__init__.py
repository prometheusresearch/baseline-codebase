#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
The ``rex`` HTSQL addon registers extensions specific to the RexDB platform:
none so far.
"""


from htsql.core.addon import Addon, Variable, Parameter
from htsql.core.application import Environment, Application
from htsql.core.validator import StrVal, UIntVal, NameVal, ClassVal, MapVal
from htsql.core.adapter import Adapter, adapt, call, rank
from htsql.core.context import context
from htsql.core.error import Error
from htsql.core.connect import Transact, TransactionGuard, Connect, connect
from htsql.core.domain import (ListDomain, RecordDomain, TextDomain,
        BooleanDomain, EnumDomain, Product)
from htsql.core.model import Node, HomeNode, TableNode, TableArc, ChainArc
from htsql.core.classify import relabel, classify
from htsql.core.syn.syntax import (Syntax, IntegerSyntax, IdentifierSyntax,
        FilterSyntax)
from htsql.core.syn.parse import parse
from htsql.core.cmd.act import Act, ProduceAction, produce, analyze, act
from htsql.core.cmd.command import Command
from htsql.core.cmd.summon import Summon, SummonJSON, recognize
from htsql.core.tr.lookup import (Lookup, Probe, ReferenceProbe,
        ReferenceSetProbe, ExpansionProbe, lookup, identify, localize,
        prescribe)
from htsql.core.tr.binding import (Recipe, LiteralRecipe, ChainRecipe, Binding,
        RootBinding, TableBinding, ChainBinding, SieveBinding,
        ImplicitCastBinding, LiteralBinding)
from htsql.core.tr.bind import (BindByFreeTable, BindByAttachedTable,
        BindByRecipe)
from htsql.core.tr.decorate import decorate_void
from htsql.core.tr.signature import Signature, Slot, IsInSig
from htsql.core.tr.fn.bind import BindFunction, BindAmong
from htsql.core.fmt.accept import AcceptJSON
from htsql.core.fmt.format import JSONFormat
from htsql.core.fmt.json import (EmitJSON, to_json, DomainToRaw, JS_MAP,
        JS_SEQ, JS_END)
from htsql.tweak.gateway.command import SummonGateway, ActGateway
import re


class RexConnect(Connect):

    rank(2.0)

    @classmethod
    def __enabled__(component):
        if not hasattr(context.app, 'rex') or \
                context.app.rex.connection is None:
            return False
        return super(RexConnect, component).__enabled__()

    def open(self):
        if context.app.rex.connection is not None:
            return context.app.rex.connection
        return super(RexConnect, self).open()


class LazyConnection(object):

    def __init__(self):
        self.connection = None
        self.session = context.env.session
        self.scope = 0

    def __call__(self):
        if self.connection is None:
            self.connection = connect()
            if context.app.htsql.db.engine == 'pgsql':
                if self.session is not None:
                    session = self.session()
                    if session:
                        cursor = self.connection.cursor()
                        cursor.execute("""
                            SELECT set_config('rex.session', %s, TRUE);
                        """, (session,))
                if context.app.rex.timeout:
                    cursor = self.connection.cursor()
                    cursor.execute("""
                        SET SESSION STATEMENT_TIMEOUT TO %s;
                    """ % (context.app.rex.timeout*1000))

        return self.connection

    def up(self):
        self.scope += 1

    def down(self, exc_type):
        self.scope -= 1
        if self.scope == 0 and self.connection is not None:
            if exc_type is None:
                self.connection.commit()
            else:
                self.connection.rollback()
                self.connection.invalidate()
            self.connection.release()
            self.connection = None

    def __bool__(self):
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


class PassthroughTransactionGuard(TransactionGuard):

    def __exit__(self, exc_type, exc_value, exc_traceback):
        if self.connection is None:
            context.env.connection.release()
            context.env.pop()


class RexTransact(Transact):

    def __init__(self, is_lazy=False):
        self.is_lazy = is_lazy

    def __call__(self):
        if context.app.rex.connection is None:
            return LazyTransactionGuard(self.is_lazy)
        return PassthroughTransactionGuard()


class LazySession(object):

    def __init__(self, session):
        self.session = session

    def __call__(self):
        if callable(self.session):
            self.session = self.session()
        if isinstance(self.session, str):
            self.session = self.session.decode('utf-8', 'replace')
        if self.session is not None and not isinstance(self.session, str):
            self.session = str(self.session)
        return self.session


class SessionGuard(object):

    def __init__(self, session):
        self.session = session

    def __enter__(self):
        context.env.push(
                session=LazySession(self.session),
                session_properties={})

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


class EnumDomainToRaw(DomainToRaw):

    adapt(EnumDomain)

    def __call__(self):
        yield JS_MAP
        yield "type"
        yield str(self.domain.__class__)
        yield "labels"
        yield JS_SEQ
        for label in self.domain.labels:
            yield label
        yield JS_END
        yield JS_END


class LookupReferenceInRoot(Lookup):

    adapt(RootBinding, ReferenceProbe)

    def __call__(self):
        if self.probe.key == 'user':
            session = (context.env.session()
                       if context.env.session is not None else None)
            if isinstance(session, str):
                session = session.decode('utf-8', 'replace')
            if session is not None:
                session = str(session)
            return LiteralRecipe(session, TextDomain())
        elif self.probe.key in context.app.rex.properties and \
                context.env.session_properties is not None:
            if self.probe.key not in context.env.session_properties:
                syntax = context.app.rex.properties[self.probe.key]
                method = lambda: produce(syntax)
                if re.match(r'^(\w+)(\.\w+)*:\w+$', syntax):
                    module, name = syntax.split(':')
                    try:
                        module = __import__(module, fromlist=[name])
                    except ImportError:
                        pass
                    else:
                        if hasattr(module, name):
                            function = getattr(module, name)
                            session = (context.env.session()
                                       if context.env.session is not None
                                       else None)
                            method = lambda: function(session)
                product = method()
                recipe = LiteralRecipe(product.data, product.domain)
                context.env.session_properties[self.probe.key] = recipe
            return context.env.session_properties[self.probe.key]
        return super(LookupReferenceInRoot, self).__call__()


class LookupReferenceSetInRoot(Lookup):

    adapt(RootBinding, ReferenceSetProbe)

    def __call__(self):
        references = super(LookupReferenceSetInRoot, self).__call__()
        references.add('user')
        for key in context.app.rex.properties:
            references.add(key)
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
            if any([[link]+mask.path == parent_mask.path and
                    mask.syntax == parent_mask.syntax
                    for parent_mask in parent_masks]):
                continue
            if any([mask.path == [reverse_link]+parent_mask.path and
                    mask.syntax == parent_mask.syntax
                    for parent_mask in parent_masks]):
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
            with context.env(masks=None):
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
            with context.env(masks=None):
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


class InSig(Signature):

    slots = [
            Slot('lop'),
            Slot('rops', is_mandatory=False, is_singular=False)
    ]


class BindIn(BindAmong):

    call('in')
    signature = InSig

    def correlate(self, lop, rops):
        if not rops:
            return LiteralBinding(
                    self.state.scope, False, BooleanDomain(), self.syntax)
        if len(rops) == 1:
            rop = rops[0]
            if isinstance(rop, LiteralBinding) and \
                    isinstance(rop.domain, ListDomain):
                rops = [LiteralBinding(
                            rop.base, item, rop.domain.item_domain, rop.syntax)
                        for item in (rop.value or [])]
                return self.correlate(lop, rops)
        self.signature = IsInSig
        binding = super(BindIn, self).correlate(lop, rops)
        self.signature = InSig
        return binding


class RexSummonGateway(SummonGateway, Summon):

    @classmethod
    def __enabled__(component):
        if not super(RexSummonGateway, component).__enabled__():
            return False
        if not (component is RexSummonGateway or
                component in context.app.rex.gateway_adapters):
            return False
        return True


class RexActGateway(ActGateway, Act):
    pass


class DescribeCmd(Command):

    def __init__(self, feed):
        self.feed = feed


class SummonDescribe(Summon):

    call('describe')

    def __call__(self):
        if len(self.arguments) != 1:
            raise Error("Expected one argument")
        [syntax] = self.arguments
        feed = recognize(syntax)
        return DescribeCmd(feed)


class ProduceDescribe(Act):

    adapt(DescribeCmd, ProduceAction)

    def __call__(self):
        plan = analyze(self.command.feed)
        return Product(plan.meta, None)


class PivotCmd(Command):

    def __init__(self, feed, on=-2, by=-1):
        self.feed = feed
        self.on = on
        self.by = by


class SummonPivot(Summon):

    call('pivot')

    def __call__(self):
        if not (1 <= len(self.arguments) <= 3):
            raise Error("Expected 1 to 3 arguments")
        feed = recognize(self.arguments[0])
        if len(self.arguments) >= 2:
            syntax = self.arguments[1]
            if not isinstance(syntax, IntegerSyntax):
                raise Error("Expected an integer", syntax)
            on = syntax.value
        else:
            on = -2
        if len(self.arguments) >= 3:
            syntax = self.arguments[2]
            if not isinstance(syntax, IntegerSyntax):
                raise Error("Expected an integer", syntax)
            by = syntax.value
        else:
            by = -1
        return PivotCmd(feed, on, by)


class ProducePivot(Act):

    adapt(PivotCmd, ProduceAction)

    def __call__(self):
        product = act(self.command.feed, self.action)
        if product.data is None:
            return product
        profile = product.meta
        if not (isinstance(profile.domain, ListDomain) and
                isinstance(profile.domain.item_domain, RecordDomain)):
            raise Error("Expected a list of records; got", str(profile.domain))
        source_fields = profile.domain.item_domain.fields
        on = self.command.on
        if on > 0:
            on -= 1
        else:
            on += len(source_fields)
        by = self.command.by
        if by > 0:
            by -= 1
        else:
            by += len(source_fields)
        if not (0 <= on < len(source_fields)):
            raise Error("'on' is out of range", self.command.on)
        if not (0 <= by < len(source_fields)):
            raise Error("'by' is out of range", self.command.by)
        if on == by:
            raise Error("'on' and 'by' should not coincide", self.command.on)
        pivot_domain = source_fields[on].domain
        pivot_values = set()
        for row in product.data:
            try:
                pivot_values.add(row[on])
            except TypeError:
                raise Error("Cannot pivot on type", pivot_domain)
        pivot_values = sorted(pivot_values)
        value_domain = source_fields[by].domain
        value_fields = []
        for value in pivot_values:
            value_header = pivot_domain.dump(value)
            if value_header is None:
                value_header = ""
            value_field = decorate_void()
            value_field = value_field.clone(header=value_header,
                                            domain=value_domain)
            value_fields.append(value_field)
        value_record = RecordDomain(value_fields)
        target_fields = []
        for idx, field in enumerate(source_fields):
            if idx == on:
                target_fields.append(field.clone(domain=value_record))
            elif idx != by:
                target_fields.append(field)
        target_record = RecordDomain(target_fields)
        target_profile = profile.clone(domain=
                profile.domain.clone(item_domain=target_record))
        keys = []
        values = []
        key_to_position = {}
        for row in product.data:
            key = tuple(item for idx, item in enumerate(row)
                             if idx not in (on, by))
            try:
                position = key_to_position.get(key)
            except TypeError:
                raise Error("Cannot use pivot with",
                            profile.domain.item_domain)
            if position is None:
                position = key_to_position[key] = len(keys)
                keys.append(key)
                values.append([None]*len(value_fields))
            value_index = pivot_values.index(row[on])
            if row[by] is not None:
                if (values[position][value_index] is not None and
                        values[position][value_index] != row[by]):
                    raise Error("Got duplicate row",
                                profile.domain.item_domain.dump(row))
                values[position][value_index] = row[by]
        target_rows = []
        for position, key in enumerate(keys):
            target_row = list(key)
            target_row.insert(on, tuple(values[position]))
            target_row = tuple(target_row)
            target_rows.append(target_row)
        return product.clone(meta=target_profile, data=target_rows)


class RexAddon(Addon):

    name = 'rex'
    hint = """HTSQL extensions for the RexDB platform"""
    help = __doc__

    variables = [
            Variable('session'),
            Variable('masks'),
            Variable('session_properties'),
    ]

    parameters = [
            Parameter(
                'connection',
                ClassVal(object),
                default=None),
            Parameter(
                'gateways',
                MapVal(NameVal(), ClassVal(Application)),
                default={}),
            Parameter(
                'properties',
                MapVal(NameVal(), StrVal()),
                default={}),
            Parameter(
                'timeout',
                UIntVal(is_nullable=True),
                default=None),
    ]

    def __init__(self, app, attributes):
        super(RexAddon, self).__init__(app, attributes)
        self.gateway_adapters = set()
        for name in sorted(self.gateways):
            instance = self.gateways[name]
            class_name = "Summon%s" % name.title().replace('_', '').encode('utf-8')
            namespace = {
                '__names__': [name.encode('utf-8')],
                'instance': instance,
            }
            summon_class = type(class_name, (RexSummonGateway,), namespace)
            self.gateway_adapters.add(summon_class)


