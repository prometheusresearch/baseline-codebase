"""

    rex.widget.field
    ================

    :copyright: 2015, Prometheus Research, LLC

"""

import inspect
from functools import partial

from rex.core import AnyVal, Error, MaybeVal

from .util import MaybeUndefinedVal, undefined
from .url import URL
from .pointer import Pointer
from .transitionable import Transitionable

__all__ = ('FieldBase', 'Field', 'computed_field', 'responder')


class FieldBase(object):

    _order = 0

    transitionable = True
    as_transitionable = None

    def __init__(self, name=None, doc=None):
        self.name = name
        self.doc = doc

        self.__class__._order += 1
        self.order = self.__class__._order

        if doc:
            self.__doc__ = doc

    def __clone__(self, **params):
        next_params = {
            'doc': self.doc,
            'name': self.name,
        }
        next_params.update(params)
        return self.__class__(**next_params)

    def __get__(self, widget, widget_class):
        if widget is None:
            return self
        else:
            return self(widget)

    def __set__(self, widget, value):
        widget.values[self.name] = value

    def __call__(self, widget):
        raise NotImplementedError('%s.__call__(widget) is not implemented' % \
                                  self.__class__.__name__)

    def __repr__(self):
        return '<%s %s>' % (self.__class__.__name__, self.name)


class Field(FieldBase):
    """ Field describes a value widget can accept.

    It is used to define widget configuration interface. All field values are
    transfered to JavaScript runtime.

    :param validate: Validator for field value
    :type validate: :class:`rex.core.Validate`

    :param default: Default field value, if it's not provided then field is
                    treated as required. Default value is subject to validation
                    by the ``validate`` argument.
    :type default: any

    :param doc: Documentation for field.
    :type doc: str

    :param name: Name of the field, its value is set automatically.
    :type name: str
    """

    def __init__(self, validate=AnyVal(), default=NotImplemented, doc=None,
                 name=None, transitionable=True, deprecated=None,
                 as_transitionable=None):
        if default is None and not isinstance(validate, MaybeVal):
            validate = MaybeVal(validate)
        elif default is undefined and not isinstance(validate, MaybeUndefinedVal):
            validate = MaybeUndefinedVal(validate)
        self.validate = validate
        if default is not NotImplemented:
            try:
                default = validate(default)
            except Error as e:
                raise ValueError(e)
        self.default = default
        self.transitionable = transitionable
        self.deprecated = deprecated
        self.as_transitionable = as_transitionable
        super(Field, self).__init__(name=name, doc=doc)

    def __clone__(self, **params):
        next_params = {
            'validate': self.validate,
            'default': self.default,
            'doc': self.doc,
            'transitionable': self.transitionable,
            'as_transitionable': self.as_transitionable,
            'deprecated': self.deprecated,
            'name': self.name,
        }
        next_params.update(params)
        return self.__class__(**next_params)

    def __call__(self, widget):
        value = widget.values.get(self.name, self.default)
        return value


class ComputedField(FieldBase):

    def __init__(self, computator, name=None, doc=None):
        super(ComputedField, self).__init__(
            name=name or computator.__name__,
            doc=doc or computator.__doc__)
        argspec = inspect.getfullargspec(computator)
        self._needs_request = len(argspec.args) > 1
        self.computator = computator

    def __clone__(self, **params):
        next_params = {
            'computator': self.computator,
            'doc': self.doc,
            'name': self.name,
        }
        next_params.update(params)
        return self.__class__(**next_params)

    def __call__(self, widget):
        if self._needs_request:
            return ComputedValue(self.computator, widget)
        else:
            return self.computator(widget)


class ComputedValue(Transitionable):

    def __init__(self, computator, widget):
        self.computator = computator
        self.widget = widget

    def __transit_format__(self, req, path):
        return self.computator(self.widget, req)


def computed_field(computator):
    """ Mark widget method as a field value.

    Example::

        class MyWidget(Widget):

            @computed_field
            def accept_header(self, req):
                return req.accept

    The result of the method will be transfered to JavaScript runtime.
    """
    return ComputedField(computator)


class Responder(Transitionable):

    def __init__(self, pointer, respond):
        self.pointer = pointer
        self.respond = respond

    def __transit_format__(self, req, path):
        return self.pointer


class ResponderField(FieldBase):

    def __init__(self, respond, url_type=URL, wrap=None, name=None, doc=None):
        super(ResponderField, self).__init__(
            name=name,
            doc=doc or respond.__doc__)
        self.respond = respond
        self.url_type = url_type
        self.wrap = wrap

    def __clone__(self, **params):
        next_params = {
            'respond': self.respond,
            'url_type': self.url_type,
            'doc': self.doc,
            'name': self.name,
            'wrap': self.wrap,
        }
        next_params.update(params)
        return self.__class__(**next_params)

    def __call__(self, widget):
        pointer = Pointer(
            widget,
            url_type=self.url_type,
            wrap=self.wrap,
            to_field=True)
        respond = partial(self.respond, widget)
        return Responder(pointer, respond)


def responder(*args, **kwargs):
    url_type = kwargs.pop('url_type', URL)
    wrap = kwargs.pop('wrap', None)
    if len(args) == 0:
        def decorate(respond):
            return ResponderField(respond, url_type=url_type, wrap=wrap)
        return decorate
    elif len(args) == 1:
        return ResponderField(args[0], url_type=url_type, wrap=wrap)
    else:
        TypeError('TypeError: responder() takes exactly 1 arguments (%d given)' % len(args))

