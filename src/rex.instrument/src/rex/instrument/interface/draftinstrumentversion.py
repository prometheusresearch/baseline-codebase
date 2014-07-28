#
# Copyright (c) 2014, Prometheus Research, LLC
#

import json

from copy import deepcopy
from datetime import datetime

from rex.core import Extension, get_settings

from .instrument import Instrument
from .instrumentversion import InstrumentVersion
from ..mixins import Comparable, Displayable, Dictable
from ..util import to_unicode, memoized_property


__all__ = (
    'DraftInstrumentVersion',
)


# pylint: disable=R0902
class DraftInstrumentVersion(Extension, Comparable, Displayable, Dictable):
    """
    Represents a single version of an Instrument that has not yet been
    published for use in the system.
    """

    dict_properties = (
        'instrument',
        'parent_instrument_version',
        'created_by',
        'date_created',
        'modified_by',
        'date_modified',
    )

    @classmethod
    def validate_definition(cls, definition):
        """
        Validates that the specified definition is a legal Common Instrument
        Definition.

        :param definition: the Instrument definition to validate
        :type definition: dict or JSON string
        :raises:
            ValidationError if the specified definition fails any of the
            requirements
        """

        iv_impl = get_settings().instrument_implementation.instrumentversion
        iv_impl.validate_definition(definition)

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a DraftInstrumentVersion from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the DraftInstrumentVersion to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified DraftInstrumentVersion; None if the specified ID does
            not exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns DraftInstrumentVersions that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of DraftInstrumentVersions to start the
            return set from (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of DraftInstrumentVersions to return (useful for
            pagination purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of DraftInstrumentVersions
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            instrument,
            created_by,
            definition=None,
            parent_instrument_version=None,
            date_created=None):
        """
        Creates a DraftInstrumentVersion in the datastore and returns the
        corresponding DraftInstrumentVersion instance.

        Must be implemented by concrete classes.

        :param instrument:
            the Instrument the DraftInstrumentVersion is associated with
        :type instrument: Instrument
        :param created_by:
            the user/application that is creating this DraftInstrumentVersion
        :type created_by: string
        :param definition:
            the Common Instrument Definition for this draft version
        :type definition: dict or JSON-encoded string
        :param parent_instrument_version:
            the InstrumentVersion that this draft was forked from
        :type parent_instrument_version: InstrumentVersion
        :param date_created:
            the date this DraftInstrumentVersion was created; if not specified,
            defaults to datetime.utcnow()
        :type date_created: datetime
        """

        raise NotImplementedError()

    def __init__(
            self,
            uid,
            instrument,
            created_by,
            date_created,
            definition=None,
            parent_instrument_version=None,
            modified_by=None,
            date_modified=None):
        self._uid = to_unicode(uid)

        if not isinstance(instrument, (Instrument, basestring)):
            raise ValueError(
                'instrument must be an instance of Instrument or a UID of one'
            )
        self._instrument = instrument

        if parent_instrument_version:
            if not isinstance(
                    parent_instrument_version,
                    (InstrumentVersion, basestring)):
                raise ValueError(
                    'parent_instrument_version must be an instance of'
                    ' InstrumentVersion or a UID of one'
                )
        self._parent_instrument_version = parent_instrument_version

        if isinstance(definition, basestring):
            self._definition = json.loads(definition)
        else:
            self._definition = deepcopy(definition)

        self._created_by = to_unicode(created_by)
        self._date_created = date_created
        self.modified_by = modified_by or self.created_by
        self.date_modified = date_modified or self.date_created

    @property
    def uid(self):
        """
        The Unique Identifier that represents this DraftInstrumentVersion in
        the datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def instrument(self):
        """
        The Instrument this instance is a draft version of. Read only.

        :rtype: Instrument
        """

        if isinstance(self._instrument, basestring):
            instrument_impl = \
                get_settings().instrument_implementation.instrument
            return instrument_impl.get_by_uid(self._instrument)
        else:
            return self._instrument

    @memoized_property
    def parent_instrument_version(self):
        """
        The InstrumentVersion that this draft was a fork of. Read only.

        :rtype: InstrumentVersion
        """

        if isinstance(self._parent_instrument_version, basestring):
            iv_impl = \
                get_settings().instrument_implementation.instrumentversion
            return iv_impl.get_by_uid(self._parent_instrument_version)
        else:
            return self._parent_instrument_version

    @property
    def definition(self):
        """
        The Common Instrument Definition of this Instrument.

        :rtype: dict
        """

        return self._definition

    @definition.setter
    def definition(self, value):
        self._definition = deepcopy(value)

    @property
    def definition_json(self):
        """
        The Common Instrument Definition of this Instrument.

        :rtype: JSON-encoded string
        """

        if self._definition:
            return json.dumps(self._definition, ensure_ascii=False)
        return None

    @definition_json.setter
    def definition_json(self, value):
        self.definition = json.loads(value)

    @property
    def created_by(self):
        """
        The username or application that created this DraftInstrumentVersion.
        Read only.

        :rtype: unicode
        """

        return self._created_by

    @property
    def date_created(self):
        """
        The date this DraftInstrumentVersion was created. Read only.

        :rtype: datetime
        """

        return self._date_created

    @property
    def modified_by(self):
        """
        The username or application that last modified this
        DraftInstrumentVersion.

        :rtype: unicode
        """

        return self._modified_by

    @modified_by.setter
    def modified_by(self, value):
        # pylint: disable=W0201
        self._modified_by = to_unicode(value)

    @property
    def date_modified(self):
        """
        The date the DraftInstrumentVersion was last modified.

        :rtype: datetime
        """

        return self._date_modified

    @date_modified.setter
    def date_modified(self, value):
        if not isinstance(value, datetime):
            raise ValueError(
                '"%s" is not a valid datetime' % (
                    value,
                )
            )

        # pylint: disable=W0201
        self._date_modified = value

    def modify(self, user):
        """
        Updates the DraftInstrumentVersions's modified_by and date_modified
        fields.

        :param user: the User who is modifying the DraftInstrumentVersion
        :type user: User
        """

        self.modified_by = user.login
        self.date_modified = datetime.utcnow()

    def validate(self):
        """
        Validates that this definition is a legal Common Instrument
        Definition.

        :raises:
            ValidationError if the definition fails any of the requirements
        """

        return self.__class__.validate_definition(self.definition)

    def save(self):
        """
        Persists the DraftInstrumentVersion into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def delete(self):
        """
        Removes this DraftInstrumentVersion from the datastore.

        Note: Once executed, this instance of DraftInstrumentVersion becomes
        invalid, and any attempts to ``save()``, ``delete()``, or ``publish()``
        will fail horribly.

        Must be implemented by concreted classes

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def publish(self, user):
        """
        Publishes this draft as the newest InstrumentVersion for the associated
        Instrument.

        :param user: the user publishing the draft
        :type user: User
        :raises:
            DataStoreError if there was an error writing to the datastore
        :returns: the InstrumentVersion that results from the publishing
        """

        iv_impl = get_settings().instrument_implementation.instrumentversion

        instrument_version = iv_impl.create(
            self.instrument,
            self.definition,
            user.login,
        )

        return instrument_version

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        if self.definition:
            return to_unicode(self.definition['title'])
        else:
            return self.uid

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.instrument,
        )

