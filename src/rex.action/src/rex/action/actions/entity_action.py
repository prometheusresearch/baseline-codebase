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
from rex.widget import formfield
from rex.widget.validate import DeferredVal, Deferred
from rex.widget.port_support import PortSupport

from ..action import Action
from ..typing import RecordTypeVal, RecordType, RowTypeVal, annotate_port
from ..validate import RexDBVal

__all__ = ('EntityAction',)


class Configuration(Action.Configuration):

    def _reflect_fields(self, db, entity, input, fields):
        parameters = {k: None for k in list(input.rows.keys())}
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

    def reconcile_input(self, entity, input):
        return input

    def override(self, action, values):
        if 'fields' in values:
            entity = values.get('entity') or action.entity
            input = values.get('input') or action.input
            input = self.reconcile_input(entity, input)
            db = values.get('db') or action.db
            fields = values['fields']
            values['fields'] = self._reflect_fields(db, entity, input, fields)
        return action.derive(**values)

    def __call__(self, action_class, values):
        entity = values['entity']
        input = values['input']
        input = self.reconcile_input(entity, input)
        db = values['db']
        fields = values['fields']
        values['fields'] = self._reflect_fields(db, entity, input, fields)
        return action_class.validated(**values)


class EntityAction(Action):
    """ Base class for actions which operate on an entity."""

    Configuration = Configuration

    entity = Field(
        RowTypeVal(),
        doc="""
        Name of an entity action operates on (`String` or `Mapping`)

        In the majority of cases the will be exactly the same as the table name
        in the database::

            ...
            entity: todo
            ...

        Although the form above is just a shortcut for::

            ...
            entity:
              todo: todo
            ...

        I.e. work on **$todo** entity of type **todo**. This permits you to
        have several entities in the wizard with different names but of the
        same type, for example::

            ...
            entity:
              remote_user: user
            ...

        Also you can apply the state modifier when declaring an entity as
        following::

            ...
            entity: todo[measure]
            ...

        Or even more complex use case, the state expression::

            ...
            entity: todo[measure && not-completed]
            ...

        State expressions support 3 logical operators AND (&&), OR (||),  and
        NOT (!). In the simplest case state expression consists of just one
        state. The action is displayed only in case if state expression
        evaluates to true.
        """)

    input = Field(
        RecordTypeVal(), default=RecordType.empty(),
        doc="""
        List of entities (`List`)

        Declare the list of entities (in the format of ``entity``) which are
        required by the action to operate.
        """)

    db = Field(
        RexDBVal(), default=None,
        transitionable=False,
        doc="""
        Gateway to use (`String`)

        One of the gateways previously declared in the ``gateway`` setting.
        """)

    fields = Field(
        DeferredVal(FormFieldsetVal()), default=None,
        doc="""
        A list of fields (`List`)

        This is actual for the form-based actions (``make``, ``edit``,
        ``view``, and ``form``). Depending on the nature of an action this will
        display editable or readonly form. If not specified, table information
        will be used to generate it.

        Each entry in this list may be specified in short or complete form. See
        the following example::

            ...
            entity: study
            fields:
            - code
            - value_key: title
              type: string
              required: true

        In this example the ``code`` field properties will be automatically
        calculated from the database, while the ``title`` field is completely
        specified ny the user.
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
