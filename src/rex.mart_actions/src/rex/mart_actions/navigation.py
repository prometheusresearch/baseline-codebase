#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob import Response

from rex.action.typing import ValueType
from rex.core import get_settings
from rex.mart import MartAccessPermissions
from rex.web import authenticate
from rex.widget import responder, RequestURL, FormFieldsetVal, Field

from .base import MartAction


__all__ = (
    'MartPickAction',
    'MartViewAction',
    'DefinitionPickAction',
    'DefinitionViewAction',
)


class MartPickAction(MartAction):
    """
    Displays the list of Marts that are available to the current user.
    """

    name = 'mart-pick'
    js_type = 'rex-mart-actions/lib/MartPick'

    fields = Field(
        FormFieldsetVal(),
        default=None,
        doc='The fields of the Mart object to display'
    )

    def __init__(self, **values):
        super(MartPickAction, self).__init__(**values)
        if not self.fields:
            self.fields = FormFieldsetVal().parse("""
            - value_key: date_creation_completed
              label: Date Created
            - value_key: owner
              label: Owner
            - value_key: pinned
              label: Is Pinned
            - value_key: size
              label: Size
            """)

    def context(self):
        return (
            self.domain.record(),
            self.domain.record(
                mart=ValueType('number'),
            ),
        )

    @responder(url_type=RequestURL)
    def marts(self, request):  # pylint: disable=no-self-use
        user = authenticate(request)
        permissions = MartAccessPermissions.top()

        definition_id = request.GET.get('definition') or None

        marts = []
        for mart in permissions.get_marts_for_user(
                user,
                definition_id=definition_id):
            mart_dict = mart.as_dict(json_safe=True)
            mart_dict['can_manage'] = permissions.user_can_manage_mart(
                user,
                mart,
            )
            marts.append(mart_dict)

        return Response(json={'marts': marts})


class MartViewAction(MartAction):
    """
    Displays the details about a specific Mart database.
    """

    name = 'mart-view'
    js_type = 'rex-mart-actions/lib/MartView'

    fields = Field(
        FormFieldsetVal(),
        default=None,
        doc='The fields of the Mart object to display'
    )

    def __init__(self, **values):
        super(MartViewAction, self).__init__(**values)
        if not self.fields:
            self.fields = FormFieldsetVal().parse("""
            - value_key: code
              label: ID
            - value_key: definition
              label: Definition
            - value_key: owner
              label: Owner
            - value_key: name
              label: Name
            - value_key: date_creation_completed
              label: Date Created
            - value_key: can_manage
              label: Can Manage?
            - value_key: pinned
              label: Is Pinned
            - value_key: size
              label: Size
            """)

    def context(self):
        return (
            self.domain.record(
                mart=ValueType('number'),
            ),
            self.domain.record(),
        )

    @responder(url_type=RequestURL)
    def data(self, request):  # pylint: disable=no-self-use
        user = authenticate(request)
        permissions = MartAccessPermissions.top()

        mart = self.get_mart(request)
        if mart:
            mart_dict = mart.as_dict(json_safe=True)
            mart_dict['can_manage'] = permissions.user_can_manage_mart(
                user,
                mart,
            )
        else:
            mart_dict = {}

        return Response(json=mart_dict)


def get_accessible_definitions(user):
    permissions = MartAccessPermissions.top()

    definitions = dict([
        (
            defn['id'],
            {
                'id': defn['id'],
                'label': defn['label'],
                'description': defn['description'],
                'can_generate': get_settings().mart_allow_runtime_creation,
                'num_marts': 0,
            },
        )
        for defn in permissions.get_definitions_for_user(user)
    ])

    for mart in permissions.get_marts_for_user(user):
        if mart.definition_id not in definitions:
            definitions[mart.definition['id']] = {
                'id': mart.definition['id'],
                'label': mart.definition['label'],
                'description': mart.definition['description'],
                'can_generate': False,
                'num_marts': 0,
            }
        definitions[mart.definition['id']]['num_marts'] += 1

    definitions = sorted(
        definitions.values(),
        cmp=lambda x, y: cmp(x['label'].lower(), y['label'].lower()),
    )

    return definitions


class DefinitionPickAction(MartAction):
    """
    Displays the list of Definitions available to a user.
    """

    name = 'mart-pick-definition'
    js_type = 'rex-mart-actions/lib/DefinitionPick'

    fields = Field(
        FormFieldsetVal(),
        default=None,
        doc='The fields of the Definition object to display'
    )

    def __init__(self, **values):
        super(DefinitionPickAction, self).__init__(**values)
        if not self.fields:
            self.fields = FormFieldsetVal().parse("""
            - value_key: label
              label: Name
            - value_key: description
              label: Description
            - value_key: num_marts
              label: '# Marts'
            """)

    def context(self):
        return (
            self.domain.record(),
            self.domain.record(
                mart_definition=ValueType('text'),
            ),
        )

    def get_definitions(self, user):  # pylint: disable=no-self-use
        return get_accessible_definitions(user)

    @responder(url_type=RequestURL)
    def definitions(self, request):  # pylint: disable=no-self-use
        user = authenticate(request)

        definitions = self.get_definitions(user)

        return Response(json={'definitions': definitions})


class DefinitionViewAction(MartAction):
    """
    Displays details about a specific Definition.
    """

    name = 'mart-view-definition'
    js_type = 'rex-mart-actions/lib/DefinitionView'

    fields = Field(
        FormFieldsetVal(),
        default=None,
        doc='The fields of the Definition object to display'
    )

    def __init__(self, **values):
        super(DefinitionViewAction, self).__init__(**values)
        if not self.fields:
            self.fields = FormFieldsetVal().parse("""
            - value_key: id
              label: ID
            - value_key: label
              label: Name
            - value_key: description
              label: Description
            - value_key: num_marts
              label: Number of Marts Available
            """)

    def context(self):
        return (
            self.domain.record(
                mart_definition=ValueType('text'),
            ),
            self.domain.record(),
        )

    @responder(url_type=RequestURL)
    def data(self, request):  # pylint: disable=no-self-use
        user = authenticate(request)

        definition = {}
        for defn in get_accessible_definitions(user):
            if defn['id'] == request.GET['definition']:
                definition = defn

        return Response(json=definition)

