"""

    rex.widget.parse
    ================

    Parse YAML into widget object model which contains location-annotated data
    with explicit WidgetDesc nodes. WidgetDesc nodes just hold widget name along
    with associated widget fields.

    For example the following YAML snippet::

        !<Container>
        size: 2
        children:
        - !<Label> text

    will be parsed into the following structure::

        WidgetDesc(
            name='Container',
            fields=[
                ('size', 2),
                ('children', [
                    WidgetDesc(
                        name='Label',
                        fields=[(None, 'text')])
                ])
            ])

    Such structure can be later interpretated by :mod:`rex.widget.validate` or
    :mod:`rex.widget.template` modules either to widget instance or widget
    template.

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple, OrderedDict

import yaml

from rex.core import Error, Location, Validate, ValidatingLoader, guard
from rex.core import RecordVal, StrVal, AnyVal

from .undefined import undefined
from .location import set_location, location_info_guard


__all__ = ('WidgetDesc', 'WidgetDescVal', 'parse')


class WidgetDesc(namedtuple( 'WidgetDesc', ['name', 'fields'])):
    """ Widget description.

    A parsed widget description which have unresolved widget name and field
    values.
    """

    __slots__ = ()


Slot = namedtuple('Slot', ['name', 'default'])


class WidgetDescVal(Validate):
    """ Parser and validator for widget object model."""

    _validate_slot = RecordVal(
        ('name', StrVal()),
        ('default', AnyVal(), undefined)
    )

    def __init__(self, allow_slots=False):
        self.allow_slots = allow_slots

    def __call__(self, value):
        return value

    def construct(self, loader, node):
        location = Location.from_node(node)
        constructed = self._construct(loader, node)
        constructed = set_location(constructed, location)
        return constructed

    def _construct(self, loader, node):
        location = Location.from_node(node)

        if isinstance(node, yaml.ScalarNode):
            if node.tag.isalnum():
                name = node.tag
                if node.value:
                    node = yaml.ScalarNode(
                        u'tag:yaml.org,2002:str',
                        node.value, node.start_mark, node.end_mark,
                        node.style)
                    value = super(WidgetDescVal, self).construct(loader, node)
                    value = set_location(value, Location.from_node(node))
                    fields = OrderedDict([(None, value)])
                else:
                    fields = OrderedDict()
                return WidgetDesc(name, fields)
            elif node.tag == '!slot':
                if not self.allow_slots:
                    raise Error("Slots are not allowed in this context")
                return Slot(node.value, NotImplemented)
            elif node.tag == '!undefined':
                return undefined
            else:
                return super(WidgetDescVal, self).construct(loader, node)

        elif isinstance(node, yaml.SequenceNode):
            if node.tag.isalnum():
                name = node.tag
                node = yaml.SequenceNode(
                    u'tag:yaml.org,2002:seq',
                    node.value, node.start_mark, node.end_mark,
                    node.flow_style)
                value = super(WidgetDescVal, self).construct(loader, node)
                value = set_location(value, Location.from_node(node))
                return WidgetDesc(name, OrderedDict([(None, value)]))
            elif node.tag == u'tag:yaml.org,2002:seq':
                return [self.construct(loader, item) for item in node.value]
            else:
                return super(WidgetVal, self).construct(loader, node)

        elif isinstance(node, yaml.MappingNode):
            if node.tag.isalnum():
                name = node.tag
                fields = OrderedDict()
                for key_node, value_node in node.value:
                    with loader.validating(StrVal()):
                        key = loader.construct_object(key_node, deep=True)
                    key = key.replace('-', '_').replace(' ', '_')
                    value = self.construct(loader, value_node)
                    value = set_location(value, Location.from_node(value_node))
                    if key in fields:
                        with location_info_guard(Location.from_node(node)), \
                                guard("While parsing widget:", "<%s>" % name), \
                                location_info_guard(Location.from_node(value_node)):
                            raise Error("Got duplicate field:", key)
                    fields[key] = value
                return WidgetDesc(name, fields)
            elif node.tag == '!slot':
                if not self.allow_slots:
                    raise Error("Slots are not allowed in this context")
                value = {
                    loader.construct_scalar(k): self.construct(loader, v)
                    for k, v in node.value
                }
                value = self._validate_slot(value)
                return Slot(value.name, value.default)
            else:
                return {
                    self.construct(loader, k): self.construct(loader, v)
                    for k, v in node.value
                }
        else:
            return super(WidgetDescVal, self).construct(loader, node)


def parse(stream, allow_slots=False):
    """ Parse ``stream`` into widget object model."""
    return WidgetDescVal(allow_slots=allow_slots).parse(stream)
