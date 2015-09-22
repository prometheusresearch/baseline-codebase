"""

    rex.action.actions.entity_action
    ================================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import OrderedDict

from cached_property import cached_property
from webob.exc import HTTPBadRequest

from rex.core import MaybeVal, StrVal, MapVal, AnyVal
from rex.port import Port
from rex.widget import Field, FormFieldsetVal, responder, PortURL
from rex.widget import formfield, dataspec
from rex.widget.validate import DeferredVal
from rex.widget.port_support import PortSupport

from ..action import Action
from ..typing import RowTypeVal, annotate_port
from ..validate import RexDBVal

__all__ = ('EntityAction',)


class EntityAction(Action):
    """ Base class for actions which operate on an entity."""

    dataspec_factory = NotImplemented

    entity = Field(
        RowTypeVal(),
        doc="""
        Name of a table in database.
        """)

    db = Field(
        RexDBVal(), default=None,
        transitionable=False,
        doc="""
        Database to use.
        """)

    fields = Field(
        DeferredVal(FormFieldsetVal()), default=None,
        doc="""
        A list of fields to show.

        If not specified then it will be generated automatically based on the
        data schema.
        """)

    def __init__(self, **values):
        super(EntityAction, self).__init__(**values)
        with PortSupport.parameters({k: None
                                     for k in self.context_types[0].rows.keys()}):
            self.fields = self.fields.resolve() if self.fields else self.fields
            self.fields = self.reflect_fields(self.fields)

    @cached_property
    def port(self):
        return self.create_port()

    @responder(
        wrap=lambda self, url: self.dataspec_factory(url, self.bind_port()),
        url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def reflect_fields(self, fields=None):
        """ Reflect fields from database."""
        return formfield.enrich(
            fields,
            self.entity.type.name,
            db=self.db)

    def bind_port(self):
        return {}

    def create_port(self, fields=None, filters=None):
        """ Create a port for action.

        The result of this method is cached as ``self.port`` property.

        This method is usually used by subclasses to override how port is
        created.

        :keyword fields: A fieldset which is used to create a port.
                         If not provided then ``self.fields`` will be used.
        :type fields: [:class:`rex.widget.formfield.Fieldset`]

        :returns: A newly created port
        :rtype: :class:`rex.port.Port`
        """
        fields = fields or self.fields
        port = formfield.to_port(
            self.entity.type.name, fields,
            filters=filters,
            db=self.db)
        return annotate_port(self.domain, port)

