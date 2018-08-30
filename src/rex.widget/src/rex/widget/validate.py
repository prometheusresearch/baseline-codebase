"""

    rex.widget.parse
    ================

    :copyright: 2014, Prometheus Research, LLC

"""



import sys
import types
import yaml
from collections import namedtuple

from cached_property import cached_property

from rex.core import ValidatingLoader, Error, Location, guard, set_location
from rex.core import Validate, StrVal, RecordVal, RecordField, AnyVal

from .widget import Widget, GroupWidget, NullWidget, RawWidget
from .field import Field
from .transitionable import as_transitionable

__all__ = ('WidgetVal', 'Deferred', 'DeferredVal')


class Deferred(object):
    """ Object which defers either validation or construction."""

    def resolve(self, validate=None):
        """ Resolve deferred value.

        If ``validate`` is passed then it is used instead of validator supplied
        at construction time.
        """
        raise NotImplementedError(
                '%s.resolve(validate=None) is not implemented' % \
                self.__class__.__name__)


SourceLocation = namedtuple('SourceLocation', ['name', 'line', 'column'])

@as_transitionable(SourceLocation, tag='map')
def _format_SourceLocation(location, req, path):
    return location._asdict()

SourceLocationRange = namedtuple('SourceLocationRange', ['name', 'start', 'end'])

@as_transitionable(SourceLocationRange, tag='map')
def _format_SourceLocationRange(location, req, path):
    return location._asdict()


class DeferredConstruction(Deferred):
    """ Deferred construction."""

    __slots__ = ('loader', 'node', 'validate')

    def __init__(self, loader, node, validate):
        self.loader = loader
        self.node = node
        self.validate = validate

    def resolve(self, validate=None):
        validate = validate or self.validate or AnyVal()
        return validate.construct(self.loader, self.node)

    @cached_property
    def source_location(self):
        start_loc = SourceLocation(
            self.node.start_mark.name,
            self.node.start_mark.line,
            self.node.start_mark.column)
        end_loc = SourceLocation(
            self.node.end_mark.name,
            self.node.end_mark.line,
            self.node.end_mark.column)
        return SourceLocationRange(start_loc.name, start_loc, end_loc)


class DeferredValidation(Deferred):
    """ Deferred validation."""

    __slots__ = ('value', 'validate')

    source_location = None

    def __init__(self, value, validate):
        self.value = value
        self.validate = validate

    def resolve(self, validate=None):
        validate = validate or self.validate or AnyVal()
        return validate(self.value)


class DeferredVal(Validate):
    """ Validator which produces deferred values."""

    def __init__(self, validate=None):
        self.validate = validate

    def __call__(self, value):
        if isinstance(value, (DeferredConstruction, DeferredValidation)):
            return value
        return DeferredValidation(value, self.validate)

    def construct(self, loader, node):
        return DeferredConstruction(loader, node, self.validate)

    def __hash__(self):
        return hash(self.validate)


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

    def __init__(self,
            widget_class=None,
            package=None,
            single=False):
        super(WidgetVal, self).__init__()
        self.widget_class = widget_class
        self.package = package
        self.single = single

    def __call__(self, data):
        with guard("While validating:", repr(data)):
            if isinstance(data, RawWidget):
                return data
            if data is None:
                return NullWidget()
            elif isinstance(data, list):
                if self.single:
                    raise Error('Only single widget is allowed in this context')
                return GroupWidget.validated(
                    children=[self(item) for item in data])
            elif isinstance(data, Widget):
                if self.widget_class and \
                   not isinstance(data, self.widget_class):
                    error = Error("Expected a widget of type:",
                                  self.widget_class.__name__)
                    error = error.wrap("But got widget of type:",
                                       data.__class__.__name__)
                    raise error
                widget_class = data.__class__
                data = data.values
                data = self.validate_values(widget_class, data)
                return widget_class.validated(package=self.package, **data)
            else:
                raise Error("Expected a widget")

    def validate_values(self, widget_class, data):
        record_fields = [(RecordField(f.name, f.validate, f.default), f)
                         for f in list(widget_class._configuration.fields.values())
                         if isinstance(f, Field)]
        field_by_name = {f.name: (v, f) for v, f in record_fields}
        values = {}
        with guard("Of widget:", widget_class.name):
            for name in sorted(data):
                value = data[name]
                name = name.replace('-', '_').replace(' ', '_')
                if name not in field_by_name:
                    raise Error("Got unexpected field:", name)
                validate, field = field_by_name[name]
                if field.deprecated:
                    print_deprecation_warning(widget_class, field)
                values[validate.attribute] = value

            for validate, field in record_fields:
                attribute = validate.attribute
                if attribute in values:
                    validate = validate.validate
                    with guard("While validating field:", field.name):
                        values[attribute] = validate(values[attribute])
                elif validate.has_default:
                    values[attribute] = validate.default
                else:
                    raise Error("Missing mandatory field:", field.name)
        return values

    def construct(self, loader, node): # pylint: disable=too-many-statements,too-many-branches,too-many-locals
        widget_classes = Widget.mapped() # pylint: disable=no-member
        location = Location.from_node(node)
        name = None
        pairs = []
        if isinstance(node, yaml.ScalarNode):
            if node.tag == 'tag:yaml.org,2002:null':
                return NullWidget()
            if node.tag.isalnum():
                name = node.tag
                if node.value:
                    value = yaml.ScalarNode(
                        'tag:yaml.org,2002:str',
                        node.value, node.start_mark, node.end_mark,
                        node.style)
                    pairs = [(None, value)]
        elif isinstance(node, yaml.SequenceNode):
            if node.tag == 'tag:yaml.org,2002:seq':
                if self.single:
                    raise Error('Only single widget is allowed in this context')
                return GroupWidget.validated(
                    children=[self.construct(loader, item)
                              for item in node.value])
            if node.tag.isalnum():
                name = node.tag
                value = yaml.SequenceNode(
                    'tag:yaml.org,2002:seq',
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
            error.wrap("Got:", node.value \
                               if isinstance(node, yaml.ScalarNode) \
                               else "a %s" % node.id)
            error.wrap("While parsing:", location)
            raise error
        else:
            error = Error("Found unknown widget:", name)
            error.wrap("While parsing:", location)
            raise error
        if self.widget_class is not None:
            if not (widget_class is self.widget_class
                    or issubclass(widget_class, self.widget_class)):
                error = Error("Expected widget of type:", "<%s>" % \
                              self.widget_class.__name__)
                error.wrap("Instead got widget of type:", "<%s>" % \
                           widget_class.__name__)
                error.wrap("While parsing:", location)
                raise error
        record_fields = [(RecordField(f.name, f.validate, f.default), f)
                         for f in list(widget_class._configuration.fields.values())
                         if isinstance(f, Field)]
        field_by_name = {f.name: (v, f) for v, f in record_fields}
        fields_with_no_defaults = [f for f, _ in record_fields
                                   if not f.has_default]
        values = {}
        for key_node, value_node in pairs:
            if key_node is None:
                if len(fields_with_no_defaults) == 1:
                    name = fields_with_no_defaults[0].name
                    key_node = node
                else:
                    error = Error("Expected a mapping")
                    error.wrap("Got:", node.value \
                                       if isinstance(node, yaml.ScalarNode) \
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
            validate, field = field_by_name[name]
            if field.deprecated:
                print_deprecation_warning(widget_class, field, node=key_node)
            with guard("Of widget:", widget_class.name), \
                 guard("While validating field:", name), \
                 loader.validating(validate.validate):
                value = loader.construct_object(value_node, deep=True)
            values[validate.attribute] = value
        for validate, field in record_fields:
            attribute = validate.attribute
            if attribute not in values:
                if validate.has_default:
                    values[attribute] = validate.default
                else:
                    error = Error("Missing mandatory field:", validate.name)
                    error.wrap("Of widget:", widget_class.name)
                    error.wrap("While parsing:", location)
                    raise error
        with guard('While parsing:', Location.from_node(node)):
            values['package'] = self.package
            widget = widget_class._configuration(widget_class, values)
            widget.location = location
            return widget

    def match(self, value):
        return (
            isinstance(value, RawWidget) or
            isinstance(value, Widget) or
            isinstance(value, yaml.Node) and
            value.tag.isalnum()
        )

    @property
    def variant(self):
        return self.match, self


def print_deprecation_warning(widget_class, field, node=None):
    warning = Error(
        'Field "%s" of widget %s is deprecated:' % (field.name, widget_class.name),
        field.deprecated)
    if node:
        warning.wrap('Used at:', Location.from_node(node))
    print(str(warning), file=sys.stderr)


_validator = WidgetVal()
Widget._validate.set(_validator)
Widget._validate_values = _validator.validate_values
