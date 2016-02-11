
from rex.action import Action, typing
from rex.widget import Field
from rex.core import SeqVal, RecordVal, StrVal, UIntVal

class PickCity(Action):

    name = 'pick-city'
    js_type = 'rex-action-demo/lib/PickCity'

    cities = Field(SeqVal(RecordVal(
        ('id', StrVal()),
        ('name', StrVal()),
        ('population', UIntVal)
    )))

    def context(self):
        return (self.domain.record(),
                self.domain.record(city=typing.ValueType('text')))


class ViewCity(Action):

    name = 'view-city'
    js_type = 'rex-action-demo/lib/ViewCity'

    def context(self):
        return (self.domain.record(city=typing.ValueType('text')),
                self.domain.record())
