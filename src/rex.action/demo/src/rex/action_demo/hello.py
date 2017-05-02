
from rex.action import Action

class Hello(Action):

    name = 'hello'
    js_type = 'rex-action-demo', 'Hello'

    def context(self):
        return (self.domain.record(), self.domain.record())
