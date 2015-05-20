"""

    rex.widget.widget
    =================

    :copyright: 2015, Prometheus Research, LLC

"""

from webob.exc import HTTPBadRequest
from collections import Mapping, OrderedDict, namedtuple

from rex.core import ProxyVal, SeqVal
from rex.core import Extension, get_packages
from rex.urlmap import Map
from rex.web import Route, PathMap, get_routes

from .transitionable import TransitionableRecord
from .field import FieldBase, Field
from .util import PropsContainer

__all__ = ('Widget', 'GroupWidget', 'NullWidget', 'select_widget', 'Pointer')


class WidgetSpec(TransitionableRecord):

    __transit_tag__ = 'widget'

    fields = ('js_type', 'values')

    def __transit_format__(self):
        return self.js_type, PropsContainer(self.values)


class WidgetMeta(Extension.__metaclass__):

    def __new__(mcs, name, bases, members):
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

    @classmethod
    def parse(cls, value):
        validate = cls._validate.validate.__class__(widget_class=cls)
        if isinstance(value, basestring) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            return validate(value)

    @classmethod
    def validated(cls, **values):
        global _prevent_validation
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
        if not _prevent_validation:
            values = self._validate_values(self.__class__, values)
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

    def __call__(self, req, path=()):
        values = OrderedDict()
        values.update(self.values)
        for name, field in self._fields.items():
            value = field(self)
            values[name] = field(self)
        for name, value in values.items():
            if callable(value):
                values[name] = value(req, path=path + (name,))
        return WidgetSpec(self.js_type, values)

    def respond(self, req):
        raise HTTPBadRequest('widget cannot respond to a request')


class WidgetComposition(Widget):

    def __init__(self, underlying=None, **values):
        super(WidgetComposition, self).__init__(**values)
        if underlying is None:
            underlying = self.render()
        self.underlying = underlying

    def render(self):
        raise NotImplementedError('%s.render() is not implemented' % \
                                  self.__class__.__name__)

    def __call__(self, req, path=()):
        return self.underlying(req, path=path)


class GroupWidget(Widget):

    children = Field(SeqVal(Widget._validate))

    def __call__(self, req, path=()):
        return [w(req, path=path + (idx,))
                for (idx, w) in enumerate(self.children)]


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    def __init__(self):
        super(NullWidget, self).__init__()

    def __call__(self, req, path=()):
        return None


def select_widget(widget, path):
    """ Select a subwidget from a ``widget`` hierarchy by ``path``."""
    for p in path:
        if isinstance(widget, GroupWidget):
            widget = widget.children[p]
        else:
            if isinstance(widget, Mapping):
                widget = widget[p]
            else:
                widget = getattr(widget, p)
    return widget
