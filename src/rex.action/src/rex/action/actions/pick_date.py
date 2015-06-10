"""

    rex.action.actions.pick_date
    ============================

    :copyright: 2015, Prometheus Research, LLC

"""

from ..action import Action

__all__ = ('PickDate',)


class PickDate(Action):

    name = 'pick-date'
    js_type = 'rex-action/lib/Actions/PickDate'

    def context(self):
        input = {}
        output = {'date': 'date'}
        return input, output
