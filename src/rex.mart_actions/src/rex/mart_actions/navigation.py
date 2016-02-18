#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob import Response

from rex.action.typing import ValueType
from rex.core import get_settings
from rex.mart import MartAccessPermissions
from rex.web import authenticate
from rex.widget import responder, RequestURL

from .base import MartAction


__all__ = (
    'MartPickAction',
    'DefinitionPickAction',
    'MartViewAction',
    'DefinitionViewAction',
)


class MartPickAction(MartAction):
    name = 'mart-pick'
    js_type = 'rex-mart-actions/lib/MartPick'

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
            marts.append(mart.as_dict(json_safe=True))

        return Response(json=marts)


class DefinitionPickAction(MartAction):
    name = 'mart-pick-definition'
    js_type = 'rex-mart-actions/lib/DefinitionPick'

    def context(self):
        return (
            self.domain.record(),
            self.domain.record(
                mart_definition=ValueType('text'),
            ),
        )

    @responder(url_type=RequestURL)
    def definitions(self, request):  # pylint: disable=no-self-use
        user = authenticate(request)
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

        return Response(json=definitions)


class MartViewAction(MartAction):
    name = 'mart-view'
    js_type = 'rex-mart-actions/lib/MartView'

    def context(self):
        return (
            self.domain.record(
                mart=ValueType('number'),
            ),
            self.domain.record(),
        )


class DefinitionViewAction(MartAction):
    name = 'mart-view-definition'
    js_type = 'rex-mart-actions/lib/DefinitionView'

    def context(self):
        return (
            self.domain.record(
                mart_definition=ValueType('text'),
            ),
            self.domain.record(),
        )

