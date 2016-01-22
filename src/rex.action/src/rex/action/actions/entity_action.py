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
from rex.widget.validate import DeferredVal, Deferred
from rex.widget.port_support import PortSupport

from ..action import Action
from ..typing import RecordTypeVal, RecordType, RowTypeVal, annotate_port
from ..validate import RexDBVal

__all__ = ('EntityAction',)


class Configuration(Action.Configuration):

    def _reflect_fields(self, db, entity, input, fields):
        parameters = {k: None for k in input.rows.keys()}
        parameters[entity.name] = None
        with PortSupport.parameters(parameters):
            if fields and isinstance(fields, Deferred):
                fields = fields.resolve()
            if fields:
                port = formfield.to_port(
                    entity.type.name,
                    fields,
                    parameters=parameters,
                    db=db)
            else:
                port = Port(entity.type.name, db=db)
            fields = formfield.enrich(fields, port, db=db)
        return fields

    def override(self, action, values):
        if 'fields' in values:
            entity = values.get('entity') or action.entity
            db = values.get('db') or action.db
            fields = values['fields']
            input = values.get('input') or action.input
            values['fields'] = self._reflect_fields(db, entity, input, fields)
        return action.__validated_clone__(**values)

    def __call__(self, action_class, values):
        entity = values['entity']
        db = values['db']
        fields = values['fields']
        input = values['input']
        values['fields'] = self._reflect_fields(db, entity, input, fields)
        return action_class.validated(**values)


class EntityAction(Action):
    """ Base class for actions which operate on an entity."""

    Configuration = Configuration

    entity = Field(
        RowTypeVal(),
        doc="""
        Name of a table in database.
        """)

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

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

    @cached_property
    def port(self):
        return self.create_port()

    @responder(url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def create_port(self, fields=None, filters=None, mask=None, entity=None):
        """ Create a port for the action.

        The result of this method is cached as ``self.port`` property.

        This method is usually used by subclasses to override how port is
        created.

        :keyword fields: A fieldset which is used to create a port.
                         If not provided then ``self.fields`` will be used.
        :type fields: [:class:`rex.widget.formfield.Fieldset`]

        :returns: A newly created port
        :rtype: :class:`rex.port.Port`
        """
        entity = entity or self.entity.type.name
        fields = self.fields if fields is None else fields
        parameters = {k: None for k in self.context_types.input.rows}
        port = formfield.to_port(
            entity, fields,
            filters=filters,
            mask=mask,
            parameters=parameters,
            db=self.db)
        port = annotate_port(self.domain, port)
        return port
