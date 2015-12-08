from rex.mart import MartAccessPermissions, Mart


class DemoMartAccessPermissions(MartAccessPermissions):
    @classmethod
    def user_can_access_definition(cls, user, definition_or_id):
        allowed = ('some_data', 'some_more_data', 'empty')
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

