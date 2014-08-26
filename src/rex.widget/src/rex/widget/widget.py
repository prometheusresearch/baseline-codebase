"""

    rex.widget.widget
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
import simplejson as json
import yaml
import pyquerystring
from collections import namedtuple
from webob import Response
from webob.exc import HTTPBadRequest, HTTPMethodNotAllowed
from rex.core import (
    Extension, cached, Record,
    MaybeVal, RecordField, ProxyVal, OneOfVal, MapVal, StrVal, RecordVal)
from rex.web import render_to_response
from .state import (
    Data, Append,
    unknown,
    State, StateVal, StateDescriptor,
    StateGraph, MutableStateGraph, compute, compute_update)
from .jsval import JSValue


_WidgetDescriptor = namedtuple('WidgetDescriptor', [
    'ui',
    'state'
])


class WidgetDescriptor(_WidgetDescriptor):
    """ Descriptor for a widget.

    :attr ui: UI descriptor
    :attr state: State graph
    """

    __slots__ = ()


_UIDescriptor = namedtuple('UIDescriptor', ['type', 'props'])


class UIDescriptor(_UIDescriptor):
    """ UI descriptiton.

    :attr type: CommonJS module which exports React component
    :attr props: Properties which should be passed to a React component
    """

    __slots__ = ()


_UIDescriptorChildren = namedtuple('UIDescriptorChildren', ['children'])


class UIDescriptorChildren(_UIDescriptorChildren):
    """ List of UI descriptitons.

    :attr children: A list of UI descriptors.
    """

    __slots__ = ()


class Field(object):
    """ Definition of a widget's field.

    :param validator: Validator
    :param default: Default value
    """

    # we maintain order as a global counter which is used to assign ordering to
    # field instances
    order = 0

    def __new__(cls, *args, **kwargs):
        # increment global counter
        cls.order += 1
        self = object.__new__(cls, *args, **kwargs)
        # assign current order value on an instance to define ordering between
        # all Field instances
        self.order = cls.order
        return self

    def __init__(self, validator, default=RecordField.NODEFAULT):
        self.validator = validator
        self.default = default

        # TODO: remove lines below after state refactor
        if hasattr(validator, 'default'):
            self.default = validator.default

    def to_record_field(self, name):
        validator = self.validator
        if isinstance(validator, type):
            validator = validator()
        return RecordField(name, validator, self.default)


class StateField(Field):
    """ Definition of a widget's stateful field.

    :param validator: Validator
    :param default: Default value

    Other params are passed through to :class:`State` constructor.
    """

    def __init__(self, validator, default=RecordField.NODEFAULT, **params):
        super(StateField, self).__init__(validator, default=default)
        self.params = params

    def to_record_field(self, name):
        default = unknown if self.default is RecordField.NODEFAULT else self.default

        validator = StateVal(
                MaybeVal(self.validator),
                default=default,
                **self.params)

        if default is not RecordField.NODEFAULT:
            default = validator(default)

        return RecordField(name, validator, default)

    def set_dependencies(self, dependencies):
        self.dependencies = dependencies


def state(validator, dependencies=None, default=RecordField.NODEFAULT):
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

    fields = []

    validate = ProxyVal()

    NON_PROP_NAMES = ('states',)

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcls, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcls, name, bases, members)

            # collect all Field instances ordered by order attribute
            cls.fields = [
                field.to_record_field(name)
                for name, field in sorted((
                    (name, field)
                    for name, field in members.items()
                    if isinstance(field, Field)),
                    key=lambda (_, field): field.order)
            ]

            cls.fields.append(
                RecordField('states', state_configuration_mapping, {}))

            return cls
    @classmethod
    def enabled(cls):
        return (cls.name is not None)

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
        for field in self.fields[len(args):]:
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
            if any(field.attribute == attr for field in self.fields):
                raise TypeError("duplicate field %r" % attr)
            else:
                raise TypeError("unknown field %r" % attr)
        # Assign field values.
        if len(args) != len(self.fields):
            raise TypeError("expected %d arguments, got %d"
                            % (len(self.fields), len(args)))
        self.values = {}
        for arg, field in zip(args, self.fields):
            setattr(self, field.attribute, arg)
            if not field.attribute in self.NON_PROP_NAMES:
                self.values[field.attribute] = arg

    @cached
    def state_configuration(self):
        return {
            state_id: state_configuration.record_type(alias=config)
                      if isinstance(config, basestring)
                      else config
            for state_id, config
            in self.states.items()
        }

    @cached
    def descriptor(self):
        props = {}
        state = MutableStateGraph()

        for name, value in self.values.items():
            name = to_camelcase(name)
            if isinstance(value, Widget):
                self.on_widget(props, state, name, value)
            elif isinstance(value, JSValue):
                props[name] = {"__reference__": value.reference}
            elif isinstance(value, StateDescriptor):
                self.on_state_descriptor(props, state, name, value)
            else:
                props[name] = value

        for state_id, conf in self.state_configuration().items():
            if state_id in state:
                if conf.alias:
                    state[state_id] = state[state_id]._replace(alias=conf.alias)

        return WidgetDescriptor(
            UIDescriptor(self.js_type, props),
            state.immutable())

    def on_widget(self, props, state, name, widget):
        descriptor = widget.descriptor()
        props[name] = descriptor.ui
        state.update(descriptor.state)

    def on_state_descriptor(self, props, state, name, state_descriptor):
        for prop_name, descriptor in state_descriptor.describe_state(self, name):
            state[descriptor.id] = descriptor
            if descriptor.is_writable:
                props[prop_name] = {"__state_read_write__": descriptor.id}
            else:
                props[prop_name] = {"__state_read__": descriptor.id}

    def request_to_spec(self, req):
        user = req.environ.get('rex.user')
        descriptor = self.descriptor()
        widget, state = self.descriptor()
        if req.method == 'GET':
            values = pyquerystring.parse(req.query_string)
            for k, v in values.items():
                if k in state and state[k].validator is not None:
                    values[k] = state[k].validator(v)
            state = compute(state, values=values, user=user, defer=True)
            return descriptor._replace(state=state)
        elif req.method == 'POST':
            state, origins = state_update_params(state, req.json)
            if not origins:
                state = compute(state, user=user)
            else:
                state = compute_update(state, origins, user=user)
            return {"state": state}
        else:
            raise HTTPMethodNotAllowed()

    def __call__(self, req):
        accept = req.accept.best_match(['text/html', 'application/json'])
        spec = self.request_to_spec(req)
        spec = to_json(spec)
        if accept == 'application/json':
            return Response(spec, content_type='application/json')
        else:
            return render_to_response(
                    'rex.widget:/templates/index.html', req, spec=spec)

    def __str__(self):
        text = yaml.dump(self, Dumper=WidgetYAMLDumper)
        return text.rstrip()

    def __repr__(self):
        args = []
        for field in self.fields:
            value = getattr(self, field.attribute)
            if field.has_default and field.default == value:
                continue
            args.append("%s=%r" % (field.attribute, value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


def merge_querystring(state, querystring):
    pass


def state_update_params(state, params):
    origins = []
    updates = {}

    for id, value in params.items():
        if id.startswith('update:'):
            id = id[7:]
            origins.append(id)

        if not id in state:
            raise HTTPBadRequest("invalid state id: %s" % id)

        if value != unknown.tag:
            updates[id] = state[id]._replace(value=value)

    state = state.merge(updates)

    return state, origins

class GroupWidget(Widget):

    children = Field(Widget.validate)

    @cached
    def descriptor(self):
        state = MutableStateGraph()
        children = []

        for child in self.children:
            descriptor = child.descriptor()
            state.update(descriptor.state)
            children.append(descriptor.ui)

        return WidgetDescriptor(
            UIDescriptorChildren(children),
            state.immutable())


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    @cached
    def descriptor(self):
        return WidgetDescriptor(None, StateGraph())


def iterate_widget(widget):
    """ Iterate widget or a group of widgets."""
    if isinstance(widget, GroupWidget):
        for child in widget.children:
            for grand_child in iterate_widget(child):
                yield grand_child
    elif isinstance(widget, NullWidget):
        pass
    else:
        yield widget


def to_json(obj):
    encoder = WidgetJSONEncoder(
        indent=2,
        tuple_as_array=False,
        namedtuple_as_object=False
    )
    return encoder.encode(obj)


class WidgetJSONEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, UIDescriptor):
            return {"__type__": obj.type, "props": obj.props}
        if isinstance(obj, UIDescriptorChildren):
            return {"__children__": obj.children}
        if isinstance(obj, WidgetDescriptor):
            return {
                "ui": obj.ui,
                "state": obj.state
            }
        if isinstance(obj, StateGraph):
            return obj.storage
        if obj is unknown:
            return "__unknown__"
        if isinstance(obj, Data):
            return {
                "data": obj.data,
                "meta": obj.meta,
                "updating": obj.updating,
                "hasMore": obj.has_more
            }
        if isinstance(obj, Append):
            return {"__append__": obj.data}
        if isinstance(obj, State):
            return {
                "id": obj.id,
                "value": obj.value,
                "dependencies": [dep.id
                    for dep in obj.dependencies
                    if not dep.reset_only],
                "persistence": obj.persistence,
                "isWritable": obj.is_writable,
                "defer": obj.defer,
                "alias": obj.alias,
            }
        return super(WidgetJSONEncoder, self).default(obj)

    def encode(self, obj):
        # XXX: Check if we need more aggresive escape here!
        return super(WidgetJSONEncoder, self).encode(obj).replace('</', '<\\/')


class WidgetYAMLDumper(yaml.Dumper):

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
        for field in data.fields:
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

def to_camelcase(s):
    return to_camelcase_re.sub(lambda m: m.group(1).upper(), s)


def capitalize(s):
    return s[:1].upper() + s[1:]
