"""

    rex.widget.widget
    =================

    :copyright: 2015, Prometheus Research, LLC

"""

from contextlib import contextmanager
from collections import OrderedDict

from rex.core import ProxyVal, SeqVal, RecordField
from rex.core import Extension, Error

from .transitionable import as_transitionable
from .field import FieldBase, Field
from .util import PropsContainer

__all__ = ('Widget', 'GroupWidget', 'NullWidget', 'RawWidget')


class WidgetMeta(Extension.__metaclass__): # pylint: disable=no-init

    def __new__(mcs, name, bases, members): # pylint: disable=bad-classmethod-argument
        fields = [(n, field.__clone__(name=n) if field.name is None else field)
                  for n, field in members.items()
                  if isinstance(field, FieldBase)]
        fields.sort(key=lambda (_, field): -field.order)
        members.update(fields)
        cls = Extension.__metaclass__.__new__(mcs, name, bases, members)
        cls._fields = OrderedDict()
        if not (name == 'Widget' and members['__module__'] == __name__):
            cls._fields.update([f for base in bases
                                if issubclass(base, Widget)
                                for f in base._fields.items()])
        cls._fields.update(fields)
        cls._configuration = cls.Configuration({
            field.name: field
            for field in cls._fields.values()
            if isinstance(field, Field)})
        return cls


_suppress_validation = False


class Widget(Extension):
    """ Widget class is used to define configuration interface for React
    components.

    For each React component which is to be exposed through URL mapping there
    should be a :class:`Widget` subclass defined which describes the
    configuration interface::

        class MyWidget(Widget):

            name = 'MyWidget'
            js_type = 'my-package/my-widget'

            title = Field(
                StrVal()
                doc='Title')

            hint = Field(
                StrVal(), default='No hint',
                doc='Hint')

    The snippet above defines a new widget ``MyWidget``.

    Class attribute ``name`` is used to refer to widget type from URL Mapping
    configuration. Class attribute ``js_type`` points to a CommonJS module which
    exports a React component corresponding to a widget.

    Widget defines two fields, one of them, ``title`` is required because it
    doesn't have default value while ``hint`` is optional.

    Widgets can be instantiated through YAML::

        w = Widget.parse('''
        !<MyWidget>
        title: Title
        ''')

    or directly via its constructor::

        w = Widget(title='Title')

    """

    __metaclass__ = WidgetMeta

    name = None
    js_type = None

    _validate = ProxyVal()
    _validate_values = ProxyVal()
    _fields = OrderedDict()

    class Configuration(object):

        def __init__(self, fields):
            self.fields = fields

        def __call__(self, widget_class, values):
            return widget_class.validated(**values)

    @classmethod
    def parse(cls, value):
        validate = cls._validate.validate.__class__(widget_class=cls)
        if isinstance(value, basestring) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            raise Error('Cannot parse a widget from:', repr(value))

    @classmethod
    def validated(cls, **values):
        global _suppress_validation # pylint: disable=global-statement
        _suppress_validation = True
        try:
            return cls(**values)
        finally:
            _suppress_validation = False

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    def __init__(self, package=None, **values):
        super(Widget, self).__init__()
        global _suppress_validation # pylint: disable=global-statement
        if not _suppress_validation:
            values = self._validate_values(self.__class__, values)
        else:
            _suppress_validation = False
        self.package = package
        self.values = values

    def __clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        next_values['package'] = self.package
        return self.__class__(**next_values)

    def __validated_clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        return self.__class__.validated(**next_values)

    def __repr__(self):
        fields = self._fields.items()
        fields = sorted(fields, key=lambda (k, v): k)
        args = ['%s=%r' % (name, getattr(self, name))
                for name, field in fields
                if isinstance(field, Field)]
        return "%s(%s)" % (self.__class__.__name__, ', '.join(args))


@as_transitionable(Widget, tag='widget')
def _format_Widget(widget, req, path): # pylint: disable=invalid-name
    values = OrderedDict()
    values.update(widget.values)
    for name, field in widget._fields.items():
        if field.transitionable:
            values[name] = field(widget)
        elif name in values:
            del values[name]
    return widget.js_type, PropsContainer(values)


class WidgetComposition(Widget):

    def __init__(self, underlying=None, **values):
        super(WidgetComposition, self).__init__(**values)
        if underlying is None:
            underlying = self.render()
        self.underlying = underlying

    def render(self):
        raise NotImplementedError('%s.render() is not implemented' % \
                                  self.__class__.__name__)

@as_transitionable(WidgetComposition)
def _format_WidgetComposition(widget, req, path): # pylint: disable=invalid-name
    return widget.underlying


class GroupWidget(Widget):

    children = Field(SeqVal(Widget._validate))


@as_transitionable(GroupWidget, tag='array')
def _format_GroupWidget(widget, req, path): # pylint: disable=invalid-name
    return widget.children


class NullWidget(Widget):

    _singleton = None

    def __new__(cls, package=None):
        if cls._singleton is None:
            cls._singleton = Widget.__new__(cls)
        return cls._singleton


@as_transitionable(NullWidget, tag='_')
def _format_NullWidget(widget, req, path): # pylint: disable=invalid-name
    return None


class RawWidget(object):

    __slots__ = ('js_type', 'values')

    def __init__(self, js_type, values):
        self.js_type = js_type
        self.values = values

@as_transitionable(RawWidget, tag='widget')
def _format_RawWidget(widget, req, path): # pylint: disable=invalid-name
    return widget.js_type, PropsContainer(widget.values)


def raw_widget(*args, **kwargs):
    if len(args) < 1:
        raise TypeError(
            "At least one position arg should be used to define "
            "'js_type'")
    elif len(args) == 1:
        js_type = args[0]
        values = {}
    elif len(args) == 2:
        js_type = args[0]
        values = dict(args[1])
    else:
        raise TypeError("Too many positional arguments provided")
    values.update(kwargs)
    return RawWidget(js_type, values)
