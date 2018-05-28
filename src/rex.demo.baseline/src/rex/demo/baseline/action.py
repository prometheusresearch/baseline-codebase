from rex.action.actions.entity_action import EntityAction

class SayHello(EntityAction):

    name = 'say-hello'
    js_type = 'rex-demo-baseline', 'SayHello'

    def context(self):
        return (self.domain.record(self.entity), self.domain.record())
