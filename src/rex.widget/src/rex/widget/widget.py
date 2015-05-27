"""

    rex.widget.widget
    =================

    :copyright: 2015, Prometheus Research, LLC

"""

from webob.exc import HTTPBadRequest
from collections import Mapping, OrderedDict

from rex.core import ProxyVal, SeqVal
from rex.core import Extension

from .transitionable import as_transitionable
from .field import FieldBase, Field
from .util import PropsContainer

__all__ = ('Widget', 'GroupWidget', 'NullWidget',)


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
        return cls


_prevent_validation = False


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

    @classmethod
    def parse(cls, value):
        validate = cls._validate.validate.__class__(widget_class=cls)
        if isinstance(value, basestring) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            return validate(value)

    @classmethod
    def validated(cls, **values):
        global _prevent_validation # pylint: disable=global-statement
        _prevent_validation = True
        try:
            return cls(**values)
        finally:
            _prevent_validation = False

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    def __init__(self, **values):
        global _prevent_validation
        if not _prevent_validation:
            values = self._validate_values(self.__class__, values)
        else:
            _prevent_validation = False
        self.values = values

    def __clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        return self.__class__(**next_values)

    def __repr__(self):
        args = ['%s=%r' % (name, getattr(self, name))
                for name, field in self._fields.items()
                if isinstance(field, Field)]
        return "%s(%s)" % (self.__class__.__name__, ', '.join(args))


@as_transitionable(Widget, tag='widget')
def _format_Widget(widget, req, path):
    values = OrderedDict()
    values.update(widget.values)
    for name, field in widget._fields.items():
        value = field(widget)
        values[name] = field(widget)
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
def _format_Widget(widget, req, path):
    return widget.underlying


class GroupWidget(Widget):

    children = Field(SeqVal(Widget._validate))


@as_transitionable(GroupWidget, tag='array')
def _format_GroupWidget(widget, req, path):
    return widget.children


class NullWidget(Widget):

    _singleton = None

    def __new__(cls):
        if cls._singleton is None:
            cls._singleton = Widget.__new__(cls)
        return cls._singleton


@as_transitionable(NullWidget, tag='_')
def _format_NullWidget(widget, req, path):
    return None
