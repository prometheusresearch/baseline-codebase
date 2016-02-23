#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.action import Action
from rex.mart import get_mart_db, MartAccessPermissions
from rex.web import url_for, authenticate
from rex.widget import computed_field


__all__ = (
    'MartAction',
)


class MartAction(Action):
    # pylint: disable=no-self-use

    def get_mart(self, request, mart_id=None):
        access = MartAccessPermissions.top()
        user = authenticate(request)
        if mart_id is None:
            mart_id = request.GET.pop('mart', None)
        if mart_id is None:
            return None
        return access.get_mart(mart_id, user)

    def get_mart_db(self, mart):
        return get_mart_db(str(mart.name), extensions={'tweak.etl': {}})

