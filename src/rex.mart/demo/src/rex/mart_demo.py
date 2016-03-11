#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import StrVal

from rex.mart import MartAccessPermissions, Mart, MartQuota, Processor


class DemoMartAccessPermissions(MartAccessPermissions):
    @classmethod
    def user_can_access_definition(cls, user, definition_or_id):
        if user == 'test':
            return True
        allowed = ('some_data', 'some_more_data', 'empty', 'broken_sql', 'some_parameters')
        if isinstance(definition_or_id, basestring):
            return definition_or_id in allowed
        else:
            return definition_or_id['id'] in allowed

    @classmethod
    def user_can_manage_mart(cls, user, mart_or_id):
        if not isinstance(mart_or_id, Mart):
            mart_or_id = cls.get_mart(mart_or_id, user)
            if not mart_or_id:
                return False
        return mart_or_id.definition_id == 'some_data'


class DemoMartQuota(MartQuota):
    @classmethod
    def can_create_mart(cls, owner, definition):
        if owner == 'cmdtest' and definition['id'] == 'some_more_data':
            return False
        return MartQuota.can_create_mart(owner, definition)

    @classmethod
    def reap_marts(cls, owner, definition):
        if owner == 'test':
            return []
        return MartQuota.reap_marts(owner, definition)


class MyProcessor(Processor):
    name = 'myproc'

    def execute(self, options, interface):
        pass


class OtherProcessor(Processor):
    name = 'otherproc'

    options = (
        ('foo', StrVal()),
        ('bar', StrVal(), None),
    )

    def execute(self, options, interface):
        pass

