#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Error
from htsql.core.util import to_name, maybe, listof, tupleof
from htsql.core.domain import Value, IdentityDomain
from htsql.core.entity import (TableEntity, ColumnEntity, DirectJoin,
        ReverseJoin)
from htsql.core.model import (HomeNode, TableNode, Arc, TableArc, ChainArc,
        ColumnArc, SyntaxArc)
from htsql.core.classify import classify, localize, relabel
from htsql.core.syn.syntax import Syntax
import collections
import decimal
import yaml


class ArmDumper(yaml.Dumper):

    def represent_unicode(self, data):
        return self.represent_scalar('tag:yaml.org,2002:str', data)

    def represent_decimal(self, data):
        return self.represent_scalar('tag:yaml.org,2002:float', str(data))

    def represent_ordered_dict(self, data):
        return self.represent_mapping('tag:yaml.org,2002:map', list(data.items()),
                                      flow_style=False)

ArmDumper.add_representer(str,
                          ArmDumper.represent_unicode)
ArmDumper.add_representer(decimal.Decimal,
                          ArmDumper.represent_decimal)
ArmDumper.add_representer(collections.OrderedDict,
                          ArmDumper.represent_ordered_dict)


def identify(node):
    arcs = localize(node)
    if arcs is None:
        node_name = None
        if isinstance(node, TableNode):
            node_arc = TableArc(node.table)
            node_labels = relabel(node_arc)
            if node_labels:
                node_name = node_labels[0].name
        if node_name is not None:
            raise Error("Detected table without identity:", node_name)
        else:
            raise Error("Detected table without identity")
    fields = []
    for arc in arcs:
        if isinstance(arc, ChainArc):
            field = identify(arc.target)
        else:
            field = arc.column.domain
        fields.append(field)
    return IdentityDomain(fields)


class Arm(object):

    is_plural = False
    kind = None

    def __init__(self, arc, arms):
        assert isinstance(arc, maybe(Arc))
        assert isinstance(arms, listof(tupleof(str, Arm)))
        self.arc = arc
        if arc is None:
            self.node = HomeNode()
        else:
            self.node = arc.target
        self.arms = collections.OrderedDict(arms)

    def grow(self, arms=[]):
        assert isinstance(arms, listof(tupleof(str, Arm)))
        return self.__class__(self.arc, list(self.arms.items())+arms)

    def __iter__(self):
        return iter(self.arms)

    def __getitem__(self, name):
        return self.arms[name]

    def __contains__(self, name):
        return (name in self.arms)

    def __len__(self):
        return len(self.arms)

    def get(self, name, default=None):
        return self.arms.get(name, default)

    def keys(self):
        return list(self.arms.keys())

    def values(self):
        return list(self.arms.values())

    def items(self):
        return list(self.arms.items())

    def walk(self, ArmType=object):
        if isinstance(self, ArmType):
            yield (), self
        for name, offshot in list(self.arms.items()):
            for path, arm in offshot.walk(ArmType):
                yield (name,)+path, arm

    def to_yaml(self, dumper, name=None):
        raise NotImplementedError()

    def labels(self):
        return classify(self.node)

    def label(self, name):
        name = to_name(name)
        for label in self.labels():
            if label.name == name:
                return label
        return None


class RootArm(Arm):

    kind = 'root'

    def __init__(self, arms, parameters={}):
        super(RootArm, self).__init__(None, arms)
        self.parameters = parameters

    def grow(self, arms=[], parameters={}):
        assert isinstance(arms, listof(tupleof(str, Arm)))
        new_parameters = self.parameters.copy()
        new_parameters.update(parameters)
        return self.__class__(list(self.arms.items())+arms, new_parameters)

    def to_yaml(self, name=None):
        assert name is None
        sequence = []
        for name, value in sorted(self.parameters.items()):
            mapping = collections.OrderedDict()
            mapping['parameter'] = name
            if isinstance(value, Value):
                value = value.data
            if value is not None:
                mapping['default'] = value
            sequence.append(mapping)
        for name, arm in list(self.arms.items()):
            sequence.append(arm.to_yaml(name))
        if len(sequence) == 0:
            return None
        elif len(sequence) == 1:
            return sequence[0]
        else:
            return sequence


class TableArm(Arm):

    kind = 'entity'

    def __init__(self, arc, arms, mask, filters, parameters={}):
        assert isinstance(arc, (TableArc, ChainArc))
        assert isinstance(mask, maybe(Mask))
        assert isinstance(filters, listof(tupleof(str, Filter)))
        super(TableArm, self).__init__(arc, arms)
        self.table = arc.target.table
        self.mask = mask
        self.filters = collections.OrderedDict(filters)
        self.domain = identify(arc.target)
        self.parameters = parameters

    def grow(self, arms=[], mask=None, filters=[]):
        assert isinstance(arms, listof(tupleof(str, Arm)))
        assert isinstance(mask, maybe(Mask))
        assert isinstance(filters, listof(tupleof(str, Filter)))
        arms = list(self.arms.items())+arms
        mask = self.mask.merge(mask) if self.mask is not None else mask
        filters = list(self.filters.items())+filters
        parameters = self.parameters.copy()
        return self.__class__(self.arc, arms, mask, filters, parameters)

    def to_yaml(self, name):
        mapping = collections.OrderedDict()
        mapping['entity'] = name
        if self.mask:
            mapping['mask'] = self.mask.to_yaml()
        filters = []
        for name, filter in list(self.filters.items()):
            filters.append(filter.to_yaml(name))
        if filters:
            mapping['filters'] = filters
        select = []
        with_ = []
        for name, arm in list(self.arms.items()):
            if isinstance(arm, (ColumnArm, LinkArm)):
                select.append(name)
            else:
                with_.append(arm.to_yaml(name))
        mapping['select'] = select
        if with_:
            mapping['with'] = with_
        return mapping


class TrunkArm(TableArm):

    kind = 'trunk entity'
    is_plural = True

    def __init__(self, table, arms, mask, filters, parameters={}):
        assert isinstance(table, (TableArc, TableEntity))
        arc = table if isinstance(table, TableArc) else TableArc(table)
        super(TrunkArm, self).__init__(arc, arms, mask, filters, parameters)


class BranchArm(TableArm):

    kind = 'branch entity'
    is_plural = True

    def __init__(self, join, arms, mask, filters, parameters={}):
        assert (isinstance(join, ChainArc) or
                isinstance(join, ReverseJoin) and not join.is_contracting)
        arc = join if isinstance(join, ChainArc) \
              else ChainArc(join.origin, [join])
        super(BranchArm, self).__init__(arc, arms, mask, filters, parameters)


class FacetArm(TableArm):

    kind = 'facet entity'

    def __init__(self, join, arms, mask, filters, parameters={}):
        assert (isinstance(join, ChainArc) or
                isinstance(join, ReverseJoin) and join.is_contracting)
        arc = join if isinstance(join, ChainArc) \
              else ChainArc(join.origin, [join])
        super(FacetArm, self).__init__(arc, arms, mask, filters, parameters)


class JoinArm(TableArm):

    kind = 'join entity'

    def __init__(self, join, arms, mask, filters, parameters={}):
        assert isinstance(join, ChainArc) or isinstance(join, DirectJoin)
        arc = join if isinstance(join, ChainArc) \
              else ChainArc(join.origin, [join])
        super(JoinArm, self).__init__(arc, arms, mask, filters, parameters)


class ColumnArm(Arm):

    kind = 'column'

    def __init__(self, column):
        assert isinstance(column, ColumnEntity)
        super(ColumnArm, self).__init__(ColumnArc(column.table, column), [])
        self.column = column
        self.domain = column.domain

    def grow(self):
        return self


class LinkArm(Arm):

    kind = 'link'

    def __init__(self, join):
        assert isinstance(join, DirectJoin)
        super(LinkArm, self).__init__(ChainArc(join.origin, [join]), [])
        self.join = join
        self.domain = identify(self.arc.target)

    def grow(self):
        return self


class SyntaxArm(Arm):

    kind = 'calculation'

    def __init__(self, origin, syntax, domain):
        super(SyntaxArm, self).__init__(SyntaxArc(origin, None, syntax), [])
        self.syntax = syntax
        self.domain = domain

    def grow(self):
        return self

    def to_yaml(self, name):
        mapping = collections.OrderedDict()
        mapping['calculation'] = name
        mapping['expression'] = str(self.syntax)
        return mapping


class Mask(object):

    def __init__(self, syntax):
        assert isinstance(syntax, Syntax)
        self.syntax = syntax

    def merge(self, syntax):
        assert isinstance(syntax, maybe(Syntax))
        if syntax is None:
            return self
        return Mask(OperatorSyntax('&', self.syntax, syntax))

    def to_yaml(self):
        return str(self.syntax)


class Filter(object):

    def __init__(self, parameters, syntax):
        assert isinstance(parameters, listof(str))
        assert isinstance(syntax, Syntax)
        self.parameters = parameters
        self.syntax = syntax

    def to_yaml(self, name):
        return "%s(%s) := %s" \
                % (name,
                   ", ".join('$'+parameter
                              for parameter in self.parameters),
                   self.syntax)


