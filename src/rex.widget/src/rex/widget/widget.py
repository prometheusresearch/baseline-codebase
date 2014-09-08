"""

    rex.widget.widget
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
import yaml
from collections import OrderedDict
from rex.core import (
    Extension, cached,
    RecordField, OneOfVal, ProxyVal, MapVal, StrVal, IntVal, RecordVal)
from .state import StateGraph, MutableStateGraph
from .descriptor import (
    UIDescriptor, UIDescriptorChildren, WidgetDescriptor,
    StateReadWrite, StateRead)
from .fields import Field, StateField, StateFieldBase
from .handle import handle


def state(validator, dependencies=None, default=NotImplemented):
    """ Decorator for defining :class:`StateField` instances with inline
    computator."""
    def register_computator(computator):
        return StateField(
            validator,
            default=default,
            computator=computator,
            dependencies=dependencies)
    return register_computator


state_configuration = RecordVal(RecordField('alias', StrVal()))
state_configuration_mapping = MapVal(StrVal(), state_configuration)


class Widget(Extension):
    """ Base class for widgets.

    Widget definition in Rex Widget is consist of two parts.

    One part is a Python subclass of :class:`Widget` which defines field
    validation and widget state management (for stateful widgets).

    Another part is a React component which defines UI and models user
    interactions.

    A basic example of defining a new widget looks like::

        class Label(Widget):
            name = 'Label'
            js_type = 'my-app/lib/Label'
            text = Field(StrVal)

    This will allow to use widget from the URL mapping::

        <!Label>
        text: Hello, world!

    Also the React component counter part should be defined in
    `my-app/lib/Label` CommonJS module.
    """

    name = None
    js_type = NotImplemented

    fields = OrderedDict()
    record_fields = []

    validate = ProxyVal()

    NON_PROP_FIELDS = set(['states'])

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcs, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcs, name, bases, members)
            cls.fields = OrderedDict()

            fields = ((name, field) for name, field in members.items()
                      if isinstance(field, Field))
            fields = sorted(fields, key=lambda (_, field): field.order)

            need_id_field = False

            for name, field in fields:
                if isinstance(field, StateFieldBase):
                    need_id_field = True
                field.name = name
                cls.fields[name] = field

            # if we have at least one state field we need to inject id field
            if need_id_field and not 'id' in cls.fields:
                cls.id = cls.fields['id'] = Field(
                    OneOfVal(IntVal, StrVal),
                    name='id')

            # inject state configuration field
            cls.states = cls.fields['states'] = Field(
                    state_configuration_mapping,
                    default={}, name='states')

            cls.record_fields = [f.record_field for f in cls.fields.values()]
            return cls

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    @cached
    def map_all(cls):
        mapping = {}
        for extension in cls.all():
            # FIXME: include full module path to already registered and to-be
            # registered module classes
            assert extension.name not in mapping, \
                "duplicate widget %r defined by '%r' and '%r'" % (
                    extension.name, mapping[extension.name], extension)
            mapping[extension.name] = extension
        return mapping

    @classmethod
    def parse(cls, stream):
        if isinstance(stream, (str, unicode)) or hasattr(stream, 'read'):
            return cls.validate.parse(stream)
        else:
            return cls.validate(stream)

    def __init__(self, *args, **kwds):
        # Convert any keywords to positional arguments.
        args_tail = []
        for field in self.record_fields[len(args):]:
            attribute = field.attribute
            if attribute in kwds:
                args_tail.append(kwds.pop(attribute))
            elif field.has_default:
                args_tail.append(field.default)
            else:
                raise TypeError("missing field %r" % attribute)
        args = args + tuple(args_tail)
        # Complain if there are any keywords left.
        if kwds:
            attr = sorted(kwds)[0]
            if any(field.attribute == attr for field in self.record_fields):
                raise TypeError("duplicate field %r" % attr)
            else:
                raise TypeError("unknown field %r" % attr)
        # Assign field values.
        if len(args) != len(self.record_fields):
            raise TypeError("expected %d arguments, got %d"
                            % (len(self.record_fields), len(args)))
        self.values = {
            field.attribute: arg
            for arg, field in zip(args, self.record_fields)}

    @cached
    def descriptor(self):
        props = {}
        graph = MutableStateGraph()
        own_graph = MutableStateGraph()

        for name, value in self.values.items():
            if name in self.NON_PROP_FIELDS:
                continue
            field = self.fields[name]
            name = to_camelcase(name)

            # XXX: we shouldn't make Widget and StateField to be mutually
            # exclusive
            if isinstance(value, Widget):
                self.on_widget(props, graph, name, value)
            elif isinstance(field, StateFieldBase):
                self.on_state(props, own_graph, name, value, field)
            else:
                props[name] = value

        if own_graph:
            own_graph = assign_aliases(own_graph, self.id) # pylint: disable=no-member
            graph.update(own_graph)

        # override states from state configuration
        for state_id, conf in self.states.items(): # pylint: disable=no-member
            if state_id in graph:
                graph[state_id] = graph[state_id]._replace(alias=conf.alias) # pylint: disable=protected-access

        return WidgetDescriptor(
            ui=UIDescriptor(self.js_type, props),
            state=graph.immutable())

    def on_widget(self, props, graph, name, widget): # pylint: disable=no-self-use
        descriptor = widget.descriptor()
        props[name] = descriptor.ui
        graph.update(descriptor.state)

    def on_state(self, props, graph, name, value, field): # pylint: disable=too-many-arguments
        for prop_name, descriptor in field.describe(name, value, self):
            graph[descriptor.id] = descriptor
            if descriptor.is_writable:
                props[prop_name] = StateReadWrite(descriptor.id)
            else:
                props[prop_name] = StateRead(descriptor.id)

    __call__ = handle

    def __str__(self):
        text = yaml.dump(self, Dumper=WidgetYAMLDumper)
        return text.rstrip()

    def __repr__(self):
        args = []
        for field in self.record_fields:
            value = getattr(self, field.attribute)
            if field.has_default and field.default == value:
                continue
            args.append("%s=%r" % (field.attribute, value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


def assign_aliases(graph, widget_id):
    writable_state = [s for s in graph.values() if s.is_writable]
    if len(writable_state) == 1:
        key = writable_state[0].id
        graph[key] = graph[key]._replace(alias=widget_id) # pylint: disable=protected-access
    return graph


class GroupWidget(Widget):

    children = Field(Widget.validate)

    @cached
    def descriptor(self):
        graph = MutableStateGraph()
        children = []

        for child in self.children:
            descriptor = child.descriptor()
            graph.update(descriptor.state)
            children.append(descriptor.ui)

        return WidgetDescriptor(
            ui=UIDescriptorChildren(children),
            state=graph.immutable())


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    @cached
    def descriptor(self):
        return WidgetDescriptor(None, StateGraph())


def iterate(widget):
    """ Iterate widget or a group of widgets."""
    if isinstance(widget, GroupWidget):
        for child in widget.children:
            for grand_child in iterate(child):
                yield grand_child
    elif isinstance(widget, NullWidget):
        pass
    else:
        yield widget


class WidgetYAMLDumper(yaml.Dumper): # pylint: disable=too-many-ancestors,too-many-public-methods

    def represent_unicode(self, data):
        return self.represent_scalar(u'tag:yaml.org,2002:str', data)

    def represent_widget(self, data):
        if isinstance(data, GroupWidget):
            return self.represent_sequence(u'tag:yaml.org,2002:seq',
                                           data.children)
        if isinstance(data, NullWidget):
            return self.represent_scalar(u'tag:yaml.org,2002:null', u'')
        tag = unicode(data.name)
        mapping = []
        for field in data.record_fields:
            value = getattr(data, field.attribute)
            if field.has_default and field.default == value:
                continue
            mapping.append((field.name, value))
        if mapping:
            return self.represent_mapping(tag, mapping, flow_style=False)
        else:
            return self.represent_scalar(tag, u"")


WidgetYAMLDumper.add_representer(
    unicode, WidgetYAMLDumper.represent_unicode)
WidgetYAMLDumper.add_multi_representer(
    Widget, WidgetYAMLDumper.represent_widget)


to_camelcase_re = re.compile(r'_([a-zA-Z])')

def to_camelcase(value):
    return to_camelcase_re.sub(lambda m: m.group(1).upper(), value)
