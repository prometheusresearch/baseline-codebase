"""

    rex.widget.widget
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
import yaml
from collections import OrderedDict
from rex.core import (
    Validate, Extension, cached, set_location,
    RecordField, OneOfVal, ProxyVal, MapVal, StrVal, IntVal, RecordVal)
from .state import StateGraph, MutableStateGraph
from .descriptor import (
    UIDescriptor, UIDescriptorChildren, WidgetDescriptor,
    StateReadWrite, StateRead, DataRead)
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


class WidgetFactory(object):

    def __init__(self, widget_class, *args, **kwargs):
        self.widget_class = widget_class
        self.args = args
        self.kwargs = kwargs
        self.location = None

    def __call__(self, context):
        widget = self.widget_class(context, *self.args, **self.kwargs)
        if self.location is not None:
            set_location(widget, self.location)
        return widget


class WidgetBase(Extension):
    pass


class Widget(WidgetBase):
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

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcs, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcs, name, bases, members)
            cls.fields = OrderedDict()

            fields = []

            for base in bases:
                if issubclass(base, WidgetBase) and not base is WidgetBase:
                    fields = base.fields.items() + fields

            own_fields = [(name, field) for name, field in members.items()
                      if isinstance(field, Field)]
            own_fields = sorted(own_fields, key=lambda (_, field): field.order)

            need_id_field = False

            for name, field in own_fields + fields:
                if isinstance(field, StateFieldBase):
                    need_id_field = True
                if field.name is None:
                    field.name = name
                cls.fields[name] = field

            # if we have at least one state field we need to inject id field
            if need_id_field and not 'id' in cls.fields:
                cls.id = cls.fields['id'] = Field(
                    OneOfVal(IntVal, StrVal),
                    name='id')

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

    def __init__(self, context, *args, **kwds):
        self.context = context
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
            field.attribute: arg(context) if isinstance(arg, WidgetFactory) else arg
            for arg, field in zip(args, self.record_fields)}

    @cached
    def descriptor(self):
        props = {}
        graph = MutableStateGraph()
        own_graph = MutableStateGraph()

        for name, value in self.values.items():
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

        return WidgetDescriptor(
            ui=UIDescriptor(self.js_type, props),
            state=graph.immutable())

    @property
    def state(self):
        return self.descriptor().state

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
                props[prop_name] = DataRead(descriptor.id)

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

    def __init__(self, context, children):
        children = [child(context) for child in children]
        super(GroupWidget, self).__init__(context, children)

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

    def __init__(self, context=None):
        super(NullWidget, self).__init__(context)

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
