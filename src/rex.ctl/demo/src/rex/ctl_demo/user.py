
from rex.core import Error
from rex.db import get_db
from rex.port import Port
from htsql.core.domain import TextDomain, IdentityDomain

class Users(object):
    """Represents a collection of users in the database."""

    user_domain = IdentityDomain([TextDomain()])

    def __init__(self):
        self.port = Port('user')

    def __iter__(self):
        """Iterates over the collection."""
        with get_db():
            return iter(self.port.produce().data.user)

    def add(self, code, name, enabled=True):
        """Adds a new user."""
        user_id = self.user_domain.dump((str(code),))
        db = get_db()
        with db, db.transaction():
            data = self.port.produce(('user', 'eq', user_id)).data
            if data.user:
                raise Error("User already exists:", code)
            data = self.port.insert(
                    {'user': {'code': code, 'name': name, 'enabled': enabled}}).data
            return data.user[0]

    def enable(self, code, enabled=True):
        """Enables or disables a user."""
        user_id = self.user_domain.dump((str(code),))
        db = get_db()
        with db, db.transaction():
            data = self.port.produce(('user', 'eq', user_id)).data
            if not data.user:
                raise Error("User does not exist:", code)
            if data.user[0].enabled == enabled:
                return False
            self.port.update(
                    {'user': {'id': user_id, 'enabled': enabled}})
            return True

