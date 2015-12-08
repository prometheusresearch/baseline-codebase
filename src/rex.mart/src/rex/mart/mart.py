#
# Copyright (c) 2015, Prometheus Research, LLC
#


from .config import get_all_definitions
from .connections import get_management_db
from .purging import purge_mart


__all__ = (
    'Mart',
)


class Mart(object):
    """
    Encapsulates the details of a completed Mart instance, and provides some
    actions that can be invoked on that instance.
    """

    @classmethod
    def from_record(cls, record):
        """
        Creates a new Mart instance based on a record retrieved from the
        ``rexmart_inventory`` table.

        :param record: the record to build the Mart instance from
        :type record: htsql.core.domain.Record
        :rtype: Mart
        """

        return cls(
            record.code,
            record.definition,
            record.owner,
            record.name,
            record.date_creation_started,
            record.date_creation_completed,
            record.pinned,
        )

    def __init__(
            self,
            code,
            definition_id,
            owner,
            name,
            date_creation_started,
            date_creation_completed,
            pinned):
        self._code = code
        self._definition_id = definition_id
        self._owner = owner
        self._name = name
        self._date_creation_started = date_creation_started
        self._date_creation_completed = date_creation_completed
        self._pinned = pinned

    @property
    def code(self):
        """
        The unique ID of the Mart in the system. Read only.

        :rtype: int
        """

        return self._code

    @property
    def definition_id(self):
        """
        The ID of the Definition that was used to create the Mart. Read only.

        :rtype: str
        """

        return self._definition_id

    @property
    def definition(self):
        """
        The Definition that was used to create the Mart. Read only.

        :rtype: dict
        """

        for defn in get_all_definitions():
            if defn['id'] == self.definition_id:
                return defn

    @property
    def owner(self):
        """
        The owner of the Mart. Read only.

        :rtype: str
        """

        return self._owner

    @property
    def name(self):
        """
        The name of the database that contains the Mart. Read only.

        :rtype: str
        """

        return self._name

    @property
    def date_creation_started(self):
        """
        The date/time when the creation process for the Mart started. Read
        only.

        :rtype: datetime.datetime
        """

        return self._date_creation_started

    @property
    def date_creation_completed(self):
        """
        The date/time when the creation process for the Mart completed. Read
        only.

        :rtype: datetime.datetime
        """

        return self._date_creation_completed

    @property
    def pinned(self):
        """
        Indicates whether or not this Mart is "pinned", meaning that automated
        purging processes will ignore this Mart.

        :rtype: bool
        """

        return self._pinned

    @pinned.setter
    def pinned(self, value):
        if not isinstance(value, bool):
            raise ValueError('The value of pinned must be boolean')
        if value != self.pinned:
            get_management_db().produce(
                '/rexmart_inventory[$code]{id(), $pinned :as pinned}/:update',
                code=self.code,
                pinned=value,
            )
        self._pinned = value

    def purge(self):
        """
        Deletes the Mart and its associated inventory record from the system.
        """

        purge_mart(self.code)

    def as_dict(self):
        """
        Creates a dictionary representation of the data in this object.

        :rtype: dict
        """

        return {
            'code': self.code,
            'definition': self.definition_id,
            'owner': self.owner,
            'name': self.name,
            'date_creation_started': self.date_creation_started,
            'date_creation_completed': self.date_creation_completed,
            'pinned': self.pinned,
        }

    def __repr__(self):
        return 'Mart(code=%r, definition=%r, owner=%r)' % (
            self.code,
            self.definition_id,
            self.owner,
        )

