#
# Copyright (c) 2016, Prometheus Research, LLC
#


import weakref
import collections


class Comparable(object):

    __slots__ = ('__weakref__',)

    _object_cache = weakref.WeakValueDictionary()

    class __metaclass__(type):

        def __call__(cls, *args, **kwds):
            cache = cls._object_cache
            basis = cls.__basis__(*args, **kwds)
            try:
                return cache[basis]
            except KeyError:
                return cache.setdefault(
                        basis,
                        type.__call__(cls, *args, **kwds))
            pass

    @classmethod
    def __basis__(cls):
        return (cls,)

    def __init__(self):
        pass

    def __repr__(self):
        return "%s()" % self.__class__.__name__


class InputMode(Comparable):

    __slots__ = ()

    def __or__(self, other):
        if not isinstance(other, InputMode):
            return NotImplemented
        return self


class OutputMode(Comparable):

    __slots__ = ('optional', 'plural')

    @classmethod
    def __basis__(cls, optional=False, plural=False):
        return (cls, optional, plural)

    def __init__(self, optional=False, plural=False):
        self.optional = optional
        self.plural = plural

    def __repr__(self):
        args = []
        if self.optional is not False:
            args.append("optional=%r" % self.optional)
        if self.plural is not False:
            args.append("plural=%r" % self.plural)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __lt__(self, other):
        if not isinstance(other, OutputMode):
            return NotImplemented
        return (self != other and
                self.optional <= other.optional and
                self.plural <= other.plural)

    def __le__(self, other):
        if not isinstance(other, OutputMode):
            return NotImplemented
        return (self.optional <= other.optional and
                self.plural <= other.plural)

    def __ge__(self, other):
        if not isinstance(other, OutputMode):
            return NotImplemented
        return (self.optional >= other.optional and
                self.plural >= other.plural)

    def __gt__(self, other):
        if not isinstance(other, OutputMode):
            return NotImplemented
        return (self != other and
                self.optional >= other.optional and
                self.plural >= other.plural)

    def __or__(self, other):
        if not isinstance(other, OutputMode):
            return NotImplemented
        return OutputMode(
                optional=(self.optional or other.optional),
                plural=(self.plural or other.plural))


class Domain(Comparable):

    __slots__ = ()

    @classmethod
    def convert(cls, value):
        if isinstance(value, Domain):
            return value
        if isinstance(value, unicode):
            return AtomicDomain(value)
        if value == ():
            return AtomicDomain(u"Void")
        if isinstance(value, tuple):
            if all([isinstance(item, unicode) for item in value]):
                return CategoricalDomain(value)
            if all([isinstance(item, Output) for item in value]):
                return DataSetDomain(value)
        raise TypeError(value)

    def __le__(self, other):
        if not isinstance(other, Domain):
            return NotImplemented
        return (self == other or
                isinstance(self, NullDomain) or
                isinstance(other, AnyDomain))

    def __or__(self, other):
        if not isinstance(other, Domain):
            return NotImplemented
        if self == other or isinstance(self, NullDomain):
            return other
        if isinstance(other, NullDomain):
            return self
        return AnyDomain()


class NullDomain(Domain):

    __slots__ = ()


class AnyDomain(Domain):

    __slots__ = ()


class AtomicDomain(Domain):

    __slots__ = ('name',)

    @classmethod
    def __basis__(cls, name):
        return (cls, name)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.name)


class EntityDomain(Domain):

    __slots__ = ('source',)

    @classmethod
    def __basis__(cls, source):
        return (cls, source)

    def __init__(self, source):
        self.source = source

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.source)


class CategoricalDomain(Domain):

    __slots__ = ('labels',)

    @classmethod
    def __basis__(cls, labels):
        return (cls, labels)

    def __init__(self, labels):
        self.labels = labels

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.labels)


class DataSetDomain(Domain):

    __slots__ = ('fields',)

    @classmethod
    def __basis__(cls, fields):
        return (cls, fields)

    def __init__(self, fields):
        self.fields = fields

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.fields)


null_t = NullDomain()
any_t = AnyDomain()
void_t = AtomicDomain(u'Void')
boolean_t = AtomicDomain(u'Boolean')
text_t = AtomicDomain(u'Text')
integer_t = AtomicDomain(u'Integer')


class Input(Comparable):

    __slots__ = ('domain', 'mode')

    @classmethod
    def __basis__(cls, domain, mode=None):
        if not isinstance(domain, Domain):
            domain = Domain.convert(domain)
        if mode is None:
            mode = InputMode()
        return (cls, domain, mode)

    def __init__(self, domain, mode=None):
        if not isinstance(domain, Domain):
            domain = Domain.convert(domain)
        if mode is None:
            mode = InputMode()
        self.domain = domain
        self.mode = mode

    def __repr__(self):
        args = [repr(self.domain)]
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __or__(self, other):
        if not isinstance(other, Input):
            return NotImplemented
        return Input(self.domain|other.domain, self.mode|other.mode)


class Output(Comparable):

    __slots__ = ('domain', 'mode', 'optional', 'plural')

    @classmethod
    def __basis__(cls, domain, mode=None, optional=False, plural=False):
        if not isinstance(domain, Domain):
            domain = Domain.convert(domain)
        if mode is None:
            mode = OutputMode(optional=optional, plural=plural)
        return (cls, domain, mode)

    def __init__(self, domain, mode=None, optional=False, plural=False):
        if not isinstance(domain, Domain):
            domain = Domain.convert(domain)
        if mode is None:
            mode = OutputMode(optional=optional, plural=plural)
        self.domain = domain
        self.mode = mode
        self.optional = mode.optional
        self.plural = mode.plural

    def __repr__(self):
        args = [repr(self.domain)]
        if self.optional is not False:
            args.append("optional=%r" % self.optional)
        if self.plural is not False:
            args.append("plural=%r" % self.plural)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __or__(self, other):
        if not isinstance(other, Output):
            return NotImplemented
        return Output(self.domain|other.domain, self.mode|other.mode)


SQLSchema = collections.namedtuple('SQLSchema', ['name'])
SQLTable = collections.namedtuple('SQLTable', ['schema', 'name'])
SQLColumn = collections.namedtuple('SQLColumn', ['table', 'name'])
SQLKey = collections.namedtuple('SQLKey', ['table', 'names'])


class Pipe(Comparable):

    __slots__ = ('input', 'output')

    def __rshift__(self, other):
        if not isinstance(other, Pipe):
            return NotImplemented
        return ComposePipe(self, other)


class SQLTablePipe(Pipe):

    __slots__ = ('table',)

    @classmethod
    def __basis__(cls, table):
        return (cls, table)

    def __init__(self, table):
        self.table = table
        self.input = Input(void_t)
        self.output = Output(EntityDomain(table), optional=True, plural=True)

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.table)


class SQLColumnPipe(Pipe):

    __slots__ = ('column', 'domain', 'optional')

    @classmethod
    def __basis__(cls, column, domain, optional=False):
        domain = Domain.convert(domain)
        return (cls, column, domain, optional)

    def __init__(self, column, domain, optional=False):
        domain = Domain.convert(domain)
        self.column = column
        self.domain = domain
        self.optional = optional
        self.input = Input(EntityDomain(column.table))
        self.output = Output(domain, optional=optional)

    def __repr__(self):
        args = [repr(self.column), repr(self.domain)]
        if self.optional is not False:
            args.append("optional=%r" % self.optional)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class SQLLinkPipe(Pipe):

    __slots__ = ('origin', 'target', 'optional', 'plural')

    @classmethod
    def __basis__(cls, origin, target, optional=False, plural=False):
        return (origin, target, optional, plural)

    def __init__(self, origin, target, optional=False, plural=False):
        self.origin = origin
        self.target = target
        self.optional = optional
        self.plural = plural
        self.input = Input(EntityDomain(origin.table))
        self.output = Output(
                EntityDomain(target.table), optional=optional, plural=plural)

    def __repr__(self):
        args = [repr(self.origin), repr(self.target)]
        if self.optional is not False:
            args.append("optional=%r" % self.optional)
        if self.plural is not False:
            args.append("plural=%r" % self.plural)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class ComposePipe(Pipe):

    __slots__ = ('p', 'q')

    @classmethod
    def __basis__(cls, p, q):
        return (cls, p, q)

    def __init__(self, p, q):
        assert p.output.domain <= q.input.domain
        self.p = p
        self.q = q
        self.input = Input(p.input.domain, p.input.mode|q.input.mode)
        self.output = Output(q.output.domain, p.output.mode|q.output.mode)

    def __repr__(self):
        return "(%r >> %r)" % (self.p, self.q)


class ConstPipe(Pipe):

    __slots__ = ('value', 'domain')

    @classmethod
    def __basis__(cls, value, domain):
        domain = Domain.convert(domain)
        return (cls, value, domain)

    def __init__(self, value, domain):
        domain = Domain.convert(domain)
        self.value = value
        self.domain = domain
        self.input = Input(())
        self.output = Output(domain)

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__, self.value, self.domain)


class NullPipe(Pipe):

    __slots__ = ()

    def __init__(self):
        self.input = Input(void_t)
        self.output = Output(null_t, optional=True)


class EmptyPipe(Pipe):

    __slots__ = ()

    def __init__(self):
        self.input = Input(void_t)
        self.output = Output(null_t, optional=True, plural=True)


class VoidPipe(Pipe):

    __slots__ = ('domain',)

    @classmethod
    def __basis__(cls, domain):
        domain = Domain.convert(domain)
        return (cls, domain)

    def __init__(self, domain):
        domain = Domain.convert(domain)
        self.domain = domain
        self.input = Input(domain)
        self.output = Output(void_t)

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.domain)


class HerePipe(Pipe):

    __slots__ = ('domain',)

    @classmethod
    def __basis__(cls, domain):
        domain = Domain.convert(domain)
        return (cls, domain)

    def __init__(self, domain):
        domain = Domain.convert(domain)
        self.domain = domain
        self.input = Input(domain)
        self.output = Output(domain)

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.domain)


class DataSetPipe(Pipe):

    __slots__ = ('generators',)

    @classmethod
    def __basis__(cls, generators):
        return (cls, generators)

    def __init__(self, generators):
        self.generators = generators
        input = Input(any_t)
        for generator in generators:
            input = input|generator.input
        self.input = input
        self.output = Output(
                DataSetDomain(
                    tuple([generator.output for generator in generators])))

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.generators)


class FieldPipe(Pipe):

    __slots__ = ('fields', 'index')

    @classmethod
    def __basis__(cls, fields, index):
        return (cls, fields, index)

    def __init__(self, fields, index):
        self.fields = fields
        self.index = index
        self.input = Input(DataSetDomain(fields))
        self.output = fields[index]

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__, self.fields, self.index)


class FilterPipe(Pipe):

    __slots__ = ('base', 'predicate')

    @classmethod
    def __basis__(cls, base, predicate):
        return (cls, base, predicate)

    def __init__(self, base, predicate):
        assert base.output.domain <= predicate.input.domain
        assert predicate.output.domain <= boolean_t
        assert base.output.plural and not predicate.output.plural
        self.base = base
        slef.predicate = predicate
        self.input = Input(
                base.input.domain,
                base.input.mode|predicate.input.mode)
        self.output = base.output

    def __repr__(self):
        return "%s(%r, %r)" % (
                self.__class__.__name__, self.base, self.predicate)


class SortPipe(Pipe):

    __slots__ = ('base', 'keys', 'orders')

    @classmethod
    def __basis__(cls, base, keys, orders):
        return (cls, base, keys, orders)

    def __init__(self, base, keys, orders):
        assert base.output.plural
        for key in keys:
            assert base.output.domain <= key.input.domain
            assert not key.output.plural
        self.base = base
        self.keys = keys
        self.orders = orders
        input = base.input
        for key in keys:
            input = Input(input.domain, input.mode|key.input.mode)
        self.input = input
        self.output = base.output

    def __repr__(self):
        return "%s(%r, %r, %r)" % (
                self.__class__.__name__, self.base, self.keys, self.orders)


class GroupPipe(Pipe):

    __slots__ = ('base', 'keys')

    @classmethod
    def __basis__(cls, base, keys):
        return (cls, base, keys)

    def __init__(self, base, keys):
        assert base.output.plural
        for key in keys:
            assert base.output.domain <= key.input.domain
            assert not key.output.plural
        self.base = base
        self.keys = keys
        input = base.input
        for key in keys:
            input = Input(input.domain, input.mode|key.input.mode)
        self.input = input
        fields = []
        for key in keys:
            fields.append(Output(key.domain))
        fields.append(Output(base.domain, plural=True))
        self.output = Output(
                DataSetDomain(tuple(fields)),
                optional=True, plural=True)

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__, self.base, self.keys)


Signature = collections.namedtuple('Signature', ['name', 'domains', 'range'])

int_add_sig = Signature(u'+', (integer_t, integer_t), integer_t)
int_sub_sig = Signature(u'-', (integer_t, integer_t), integer_t)
int_mul_sig = Signature(u'*', (integer_t, integer_t), integer_t)
int_div_sig = Signature(u'/', (integer_t, integer_t), integer_t)

concat_sig = Signature(u'+', (text_t, text_t), text_t)

not_sig = Signature(u'!', (boolean_t,), boolean_t)
and_sig = Signature(u'&', (boolean_t, boolean_t), boolean_t)
or_sig = Signature(u'|', (boolean_t, boolean_t), boolean_t)

int_lt_sig = Signature(u'<', (integer_t, integer_t), boolean_t)
int_le_sig = Signature(u'<=', (integer_t, integer_t), boolean_t)
int_eq_sig = Signature(u'=', (integer_t, integer_t), boolean_t)
int_ne_sig = Signature(u'!=', (integer_t, integer_t), boolean_t)
int_ge_sig = Signature(u'>=', (integer_t, integer_t), boolean_t)
int_gt_sig = Signature(u'>', (integer_t, integer_t), boolean_t)

text_lt_sig = Signature(u'<', (text_t, text_t), boolean_t)
text_le_sig = Signature(u'<=', (text_t, text_t), boolean_t)
text_eq_sig = Signature(u'=', (text_t, text_t), boolean_t)
text_ne_sig = Signature(u'!=', (text_t, text_t), boolean_t)
text_ge_sig = Signature(u'>=', (text_t, text_t), boolean_t)
text_gt_sig = Signature(u'>', (text_t, text_t), boolean_t)

count_sig = Signature(u'count', (any_t,), integer_t)
exists_sig = Signature(u'exists', (any_t,), boolean_t)
any_sig = Signature(u'any', (boolean_t,), boolean_t)
all_sig = Signature(u'all', (boolean_t,), boolean_t)
min_sig = Signature(u'min', (integer_t,), integer_t)
max_sig = Signature(u'max', (integer_t,), integer_t)
sum_sig = Signature(u'sum', (integer_t,), integer_t)


class FormulaPipe(Pipe):

    __slots__ = ('signature', 'arguments')

    @classmethod
    def __basis__(cls, signature, arguments):
        return (cls, signature, arguments)

    def __init__(self, signature, arguments):
        assert len(signature.domains) == len(arguments)
        for domain, argument in zip(signature.domains, arguments):
            assert argument.output.type <= domain
        self.signature = signature
        self.arguments = arguments
        input = Input(any_t)
        for argument in arguments:
            input = input|argument.input
        self.input = input
        mode = OutputMode()
        for argument in arguments:
            mode = mode|argument.output.mode
        self.output = Output(signature.range, mode)

    def __repr__(self):
        return "%s(%r, %r)" % (
                self.__class__.__name__, self.signature, self.arguments)



class AggregatePipe(FormulaPipe):

    __slots__ = ()

    def __init__(self, signature, arguments):
        assert len(signature.domains) == len(arguments)
        for domain, argument in zip(signature.domains, arguments):
            assert argument.output.domain <= domain
        self.signature = signature
        self.arguments = arguments
        input = Input(any_t)
        for argument in arguments:
            input = input|argument.input
        self.input = input
        self.output = Output(signature.range)


class OptionalAggregatePipe(AggregatePipe):

    __slots__ = ()

    def __init__(self, signature, arguments):
        assert len(signature.domains) == len(arguments)
        for domain, argument in zip(signature.domains, arguments):
            assert argument.output.type <= domain
        self.signature = signature
        self.arguments = arguments
        input = Input(any_t)
        for argument in arguments:
            input = input|argument.input
        self.input = input
        optional = False
        for argument in arguments:
            if arguments.output.mode.optional:
                optional = True
                break
        self.output = Output(signature.range, optional=optional)


