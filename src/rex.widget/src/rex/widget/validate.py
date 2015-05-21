"""

    rex.widget.parse
    ================

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

import types
import contextlib
import json
import yaml

from rex.core import ValidatingLoader, Error, Location, guard
from rex.core import Validate, AnyVal, StrVal, RecordVal, RecordField

from .widget import Widget, GroupWidget, NullWidget
from .field import Field

__all__ = ('WidgetVal', 'Deferred', 'DeferredVal')


class Deferred(object):

    __slots__ = ('loader', 'node')

    def __init__(self, loader, node):
        self.loader = loader
        self.node = node

    def construct(self, validate):
        return validate.construct(self.loader, self.node)


class DeferredVal(Validate):

    def __call__(self, value):
        return value

    def construct(self, loader, node):
        return Deferred(loader, node)


class WidgetVal(Validate):
    """ Validator for widget values.
    
    Can be used as a field value validator for widgets which want to have other
    widgets as their values::

        class Panel(Widget):

            children = Field(
                WidgetVal(),
                doc="Children widgets")

        class Title(Widget):

            title = Field(
                StrVal(),
                doc="Title")

        panel = Panel(children=Title(title='Title'))

    """

    def __init__(self, widget_class=None, context=None):
        super(WidgetVal, self).__init__()
        self.widget_class = widget_class
        self.context = context or {}

    def __call__(self, data):
        with guard("While validating:", repr(data)):
            if data is None:
                return NullWidget()
            elif isinstance(data, list):
                return GroupWidget.validated(children=[self(item) for item in data])
            elif isinstance(data, Widget):
                if self.widget_class and not isinstance(data, self.widget_class):
                    error = Error("Expected a widget of type:", self.widget_class.__name__)
                    error = error.wrap("But got widget of type:", data.__class__.__name__)
                    raise error
                widget_class = data.__class__
                data = data.values
                data = self.validate_values(widget_class, data)
                return widget_class.validated(**data)
            else:
                raise Error("Expected a widget")

    def validate_values(self, widget_class, data):
        record_fields = [RecordField(f.name, f.validate, f.default)
                         for f in widget_class._fields.values()
                         if isinstance(f, Field)]
        field_by_name = {f.name: f for f in record_fields}
        values = {}
        with guard("Of widget:", widget_class.name):
            for name in sorted(data):
                value = data[name]
                name = name.replace('-', '_').replace(' ', '_')
                if name not in field_by_name:
                    raise Error("Got unexpected field:", name)
                attribute = field_by_name[name].attribute
                values[attribute] = value

            for field in record_fields:
                attribute = field.attribute
                if attribute in values:
                    validate = field.validate
                    with guard("While validating field:", field.name):
                        values[attribute] = validate(values[attribute])
                elif field.has_default:
                    values[attribute] = field.default
                else:
                    raise Error("Missing mandatory field:", field.name)
        return values

    def construct(self, loader, node):
        with patched_loader(loader, self.context):
            return self._construct(loader, node)

    def _construct(self, loader, node):
        widget_classes = Widget.mapped()
        location = Location.from_node(node)
        name = None
        pairs = []
        if isinstance(node, yaml.ScalarNode):
            if node.tag == u'tag:yaml.org,2002:null':
                return NullWidget()
            if node.tag.isalnum():
                name = node.tag
                if node.value:
                    value = yaml.ScalarNode(
                        u'tag:yaml.org,2002:str',
                        node.value, node.start_mark, node.end_mark,
                        node.style)
                    pairs = [(None, value)]
        elif isinstance(node, yaml.SequenceNode):
            if node.tag == u'tag:yaml.org,2002:seq':
                return GroupWidget.validated(children=[self.construct(loader, item)
                                                       for item in node.value])
            if node.tag.isalnum():
                name = node.tag
                value = yaml.SequenceNode(
                    u'tag:yaml.org,2002:seq',
                    node.value, node.start_mark, node.end_mark,
                    node.flow_style)
                pairs = [(None, value)]
        elif isinstance(node, yaml.MappingNode):
            if node.tag.isalnum() or self.widget_class:
                name = node.tag
                pairs = node.value
        if name in widget_classes:
            widget_class = widget_classes[name]
        elif self.widget_class is not None:
            widget_class = self.widget_class
        elif not name:
            error = Error("Expected a widget")
            error.wrap("Got:", node.value
                            if isinstance(node, yaml.ScalarNode)
                            else "a %s" % node.id)
            error.wrap("While parsing:", location)
            raise error
        else:
            error = Error("Found unknown widget:", name)
            error.wrap("While parsing:", location)
            raise error
        if self.widget_class is not None:
            if not (widget_class is self.widget_class or issubclass(widget_class, self.widget_class)):
                error = Error("Expected widget of type:", "<%s>" % self.widget_class.__name__)
                error.wrap("Instead got widget of type:", "<%s>" % widget_class.__name__)
                error.wrap("While parsing:", location)
                raise error
        record_fields = [RecordField(f.name, f.validate, f.default)
                         for f in widget_class._fields.values()
                         if isinstance(f, Field)]
        field_by_name = {f.name: f for f in record_fields}
        fields_with_no_defaults = [f for f in record_fields if not f.has_default]
        values = {}
        for key_node, value_node in pairs:
            if key_node is None:
                if len(fields_with_no_defaults) == 1:
                    name = fields_with_no_defaults[0].name
                    key_node = node
                else:
                    error = Error("Expected a mapping")
                    error.wrap("Got:", node.value
                                       if isinstance(node, yaml.ScalarNode)
                                       else "a %s" % node.id)
                    error.wrap("While parsing:", location)
                    raise error
            else:
                with loader.validating(StrVal()):
                    name = loader.construct_object(key_node, deep=True)
            name = name.replace('-', '_').replace(' ', '_')
            with guard("While parsing:", Location.from_node(key_node)):
                if name not in field_by_name:
                    raise Error("Got unexpected field:", name)
                if name in values:
                    raise Error("Got duplicate field:", name)
            field = field_by_name[name]
            with guard("Of widget:", widget_class.name), \
                 guard("While validating field:", name), \
                 loader.validating(field.validate):
                value = loader.construct_object(value_node, deep=True)
            values[field.attribute] = value
        for field in record_fields:
            attribute = field.attribute
            if attribute not in values:
                if field.has_default:
                    values[attribute] = field.default
                else:
                    raise Error("Missing mandatory field:", field.name) \
                            .wrap("Of widget:", widget_class.name)
        widget = widget_class.validated(**values)
        widget.location = location
        return widget


@contextlib.contextmanager
def patched_loader(loader, context):
    patched = loader.validating.im_func is ValidatingLoader_validating
    if not patched:
        loader.__slots_context = context
        loader.validating = types.MethodType(ValidatingLoader_validating, loader)
    yield
    if not patched:
        del loader.__slots_context
        del loader.validating


orig_ValidatingLoader_validating = ValidatingLoader.validating


def ValidatingLoader_validating(self, validate):
    if validate is not None:
        validate = SlotResolveVal(validate, self.__slots_context)
    return orig_ValidatingLoader_validating(self, validate)


class SlotResolveVal(Validate):

    slot_val = RecordVal(
        ('name', StrVal()),
        ('default', DeferredVal()),
    )

    def __init__(self, validate, context):
        self.validate = validate
        self.context = context

    def __call__(self, value):
        return self.validate(value)

    def _construct(self, loader, node):
        if self.validate is not None:
            return self.validate.construct(loader, node)
        else:
            return loader.construct_object(node, deep=True)

    def construct(self, loader, node):
        if isinstance(node, yaml.MappingNode) and node.tag == '!slot':
            node = yaml.MappingNode(u'tag:yaml.org,2002:map', node.value,
                                    start_mark=node.start_mark,
                                    end_mark=node.end_mark,
                                    flow_style=node.flow_style)
            slot = self.slot_val.construct(loader, node)
            if slot.name in self.context:
                return self._construct(loader, self.context[slot.name].node)
            else:
                return self._construct(loader, slot.default.node)
        return self._construct(loader, node)


_validator = WidgetVal()
Widget._validate.set(_validator)
Widget._validate_values = _validator.validate_values
