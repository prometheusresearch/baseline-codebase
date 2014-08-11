#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from copy import deepcopy
from datetime import datetime

from rex.core import Extension, get_settings
from rex.instrument.interface import Assessment
from rex.instrument.meta import get_assessment_meta, set_assessment_meta, \
    set_assessment_application
from rex.instrument.mixins import Comparable, Displayable, Dictable
from rex.instrument.util import to_unicode, memoized_property

from ..errors import FormError


__all__ = (
    'Entry',
)


# pylint: disable=R0902,R0904
class Entry(Extension, Comparable, Displayable, Dictable):
    """
    Represents an initial data capture entry for an Assessment.
    """

    #: The Entry is not yet complete.
    STATUS_IN_PROGRESS = u'in-progress'

    #: The Entry is complete.
    STATUS_COMPLETE = u'complete'

    #: All valid values that the status property can be assigned.
    ALL_STATUSES = (
        STATUS_IN_PROGRESS,
        STATUS_COMPLETE,
    )

    #: Represents a draft Entry.
    TYPE_PRELIMINARY = u'preliminary'

    #: Represents the Reconciliation of one or more Preliminary Entries.
    TYPE_RECONCILED = u'reconciled'

    #: Represents an edit to a previously Reconciled Entry.
    TYPE_REVISION = u'revision'

    #: All valid values that the type property can be assigned.
    ALL_TYPES = (
        TYPE_PRELIMINARY,
        TYPE_RECONCILED,
        TYPE_REVISION,
    )

    dict_properties = (
        'status',
        'type',
        'created_by',
        'date_created',
        'modified_by',
        'date_modified',
    )

    @staticmethod
    def validate_data(data, instrument_definition=None):
        """
        Validates that the specified data is a legal Assessment Document.

        :param data: the Assessment data to validate
        :type data: dict or JSON string
        :param instrument_definition:
            the Common Instrument Definition to validate the data against; if
            not specified, only the adherance to the base Assessment Document
            definition is checked
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the specified structure fails any of the
            requirements
        """

        return Assessment.validate_data(
            data,
            instrument_definition=instrument_definition,
        )

    @staticmethod
    def generate_empty_data(instrument_version):
        """
        Generates an Assessment data structure that addresses the Fields and
        structure of the specified InstrumentVersion, but contains no
        responses.

        :param instrument_version: the InstrumentVersion to model the data on
        :type instrument_version: InstrumentVersion
        :returns:
        :rtype: dict
        """

        return Assessment.generate_empty_data(instrument_version)

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves an Entry from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Entry to retrieve
        :type uid: string
        :param user: the User who should have access to the desired Entry
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Entry; None if the specified UID does not exist
        :rtype: Entry
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        """
        Returns Entries that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * assessment (UID or instance; exact matches)
        * type (exact matches)
        * status (exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Entries to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Entries to return (useful for pagination
            purposes)
        :type limit: int
        :param user: the User who should have access to the desired Entries
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Entries
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            assessment,
            entry_type,
            created_by,
            date_created=None,
            data=None,
            status=None,
            memo=None):
        """
        Creates an Entry in the datastore and returns the corresponding Entry
        instance.

        Must be implemented by concrete classes.

        :param assessment: the Assessment the Entry is associated with
        :type assessment: Assessment
        :param entry_type:
            the type of Entry to create; must be one of the types listed in
            ``ALL_TYPES``
        :type entry_type: string
        :param created_by: the user/application that is creating this Entry
        :type created_by: string
        :param date_created:
            the date this Entry was created; if not specified, defaults to
            datetime.utcnow()
        :type date_created: datetime
        :param data:
            the Assessment data; if not specified, an empty structure will be
            generated
        :type data: dict or JSON string
        :param status:
            the status of the Entry; must be one of the statuses listed in
            ``ALL_STATUSES``; if not specified, defaults to ``in-progress``
        :type status: string
        :param memo: human-readable notes about this Entry
        :type memo: string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Entry
        """

        raise NotImplementedError()

    # pylint: disable=R0913
    def __init__(
            self,
            uid,
            assessment,
            entry_type,
            data,
            created_by,
            date_created,
            modified_by=None,
            date_modified=None,
            status=None,
            memo=None):
        self._uid = to_unicode(uid)

        if not isinstance(assessment, (Assessment, basestring)):
            raise ValueError(
                'assessment must be an instance of Assessment or a UID of one'
            )
        self._assessment = assessment

        if isinstance(data, basestring):
            self._data = json.loads(data)
        else:
            self._data = deepcopy(data)

        self._type = entry_type
        self._created_by = to_unicode(created_by)
        self._date_created = date_created
        self.modified_by = modified_by or self.created_by
        self.date_modified = date_modified or self.date_created
        self.status = status or Entry.STATUS_IN_PROGRESS
        self.memo = memo

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Entry in the
        datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def assessment(self):
        """
        The Assessment this Entry is associated with. Read only.

        :rtype: Assessment
        """

        if isinstance(self._assessment, basestring):
            assessment_impl = \
                get_settings().instrument_implementation.assessment
            return assessment_impl.get_by_uid(self._assessment)
        else:
            return self._assessment

    @property
    def created_by(self):
        """
        The username or application that created this Entry. Read only.

        :rtype: unicode
        """

        return self._created_by

    @property
    def date_created(self):
        """
        The date this Entry was created. Read only.

        :rtype: datetime
        """

        return self._date_created

    @property
    def modified_by(self):
        """
        The username or application that last modified this Entry.

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
        The date the Entry was last modified.

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

    @property
    def status(self):
        """
        The status of this Entry.

        :rtype: unicode
        """

        return self._status

    @status.setter
    def status(self, value):
        if value not in self.__class__.ALL_STATUSES:
            raise ValueError(
                '"%s" is not a valid Entry status' % (
                    value,
                )
            )

        # pylint: disable=W0201
        self._status = value

    @property
    def is_done(self):
        """
        Indicates whether or not this Entry is in a terminal status. Read only.

        :rtype: bool
        """

        return self.status in (
            self.__class__.STATUS_COMPLETE,
        )

    @property
    def type(self):
        """
        The type that this Entry represents. Read Only

        :rtype: unicode
        """

        return self._type

    @property
    def data(self):
        """
        The Common Assessment Document that contains the data of this
        Entry.

        :rtype: dict
        """

        return self._data

    @data.setter
    def data(self, value):
        self._data = deepcopy(value)

    @property
    def data_json(self):
        """
        The Common Assessment Document that contains the data of this
        Assessment.

        :rtype: JSON-encoded string
        """

        return json.dumps(self._data, ensure_ascii=False)

    @data_json.setter
    def data_json(self, value):
        self.data = json.loads(value)

    @property
    def memo(self):
        """
        Notes about this Entry.

        :rtype: unicode or None
        """

        return self._memo

    @memo.setter
    def memo(self, value):
        # pylint: disable=W0201
        self._memo = to_unicode(value)

    def validate(self, instrument_definition=None):
        """
        Validates that this Entry contains a legal Assessment Document.

        :param instrument_definition:
            the Common Instrument Definition to validate the data against; if
            not specified, the definition found on the InstrumentVersion
            associated with the Assessment will be used
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the data fails any of the requirements
        """

        if (not instrument_definition) and self.assessment:
            instrument_definition = \
                self.assessment.instrument_version.definition

        return self.__class__.validate_data(
            self.data,
            instrument_definition=instrument_definition,
        )

    def get_meta(self, name, default=None):
        """
        A convenience method for retrieving an Assessment-level metadata
        property from the data.

        :param name: the name of the metadata property to retrieve
        :type name: string
        :param default: the value to return if the property does not exist
        :type default: string
        :returns:
            the value of the metadata property, or `default` if the property
            does not exist
        """

        return get_assessment_meta(self.data, name, default)

    def set_meta(self, name, value):
        """
        A convenience method for setting Assessment-level metadata property on
        the data.

        :param name: the name of the metadata property to set
        :type name: string
        :param value: the value of the metadata property
        :type value: string
        """

        set_assessment_meta(self.data, name, value)

    def set_application_token(self, name, version=None):
        """
        Adds (or updates) an application token to the `application` metadata
        property on the Assessment Document.

        :param name: the name of the application (typically the package name)
        :type name: string
        :param version:
            the version of the application; if not specified this method will
            attempt to find the version of the package `name`, otherwise it
            will use '?'
        :type version: string
        :returns: the full, updated application metadata property value
        """

        return set_assessment_application(
            self.data,
            name,
            version=version,
        )

    def complete(self, user):
        """
        Marks the Entry as complete and performs a validation of the
        Assessment Document.

        :param user: the User who is completing the Entry
        :type user: User
        :raises:
            ValidationError if the document failed its validation
        """

        if self.status != Entry.STATUS_COMPLETE:
            self.status = Entry.STATUS_COMPLETE
            self.set_meta('dateCompleted', datetime.utcnow().isoformat()[:19])
            self.set_application_token('rex.forms')
            self.modify(user)
            self.validate()
        else:
            raise FormError(
                'Cannot complete an Entry that is already in a terminal'
                ' state.',
            )

    def modify(self, user):
        """
        Updates the Entry's modified_by and date_modified fields.

        :param user: the User who is modifying the Entry
        :type user: User
        """

        self.modified_by = user.login
        self.date_modified = datetime.utcnow()

    def save(self):
        """
        Persists the Entry into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.assessment,
            self.type,
        )

