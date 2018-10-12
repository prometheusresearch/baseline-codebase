#
# Copyright (c) 2014, Prometheus Research, LLC
#


from collections import namedtuple
from copy import deepcopy
from datetime import datetime, date

from rios.core import validate_assessment, \
    ValidationError as RiosValidationError
from rex.core import Extension, AnyVal, Error

from .instrumentversion import InstrumentVersion
from .subject import Subject
from ..errors import ValidationError, InstrumentError
from ..meta import get_assessment_meta, set_assessment_meta, \
    set_assessment_application
from ..mixins import *
from ..output import dump_assessment_json
from ..util import to_unicode, memoized_property, get_implementation, \
    get_current_datetime


__all__ = (
    'Assessment',
)


class Assessment(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents a response to an Instrument by a Subject.
    """

    #: The Assessment is not yet complete.
    STATUS_IN_PROGRESS = 'in-progress'

    #: The Assessment is complete.
    STATUS_COMPLETE = 'completed'

    #: All valid values that the status property can be assigned.
    ALL_STATUSES = (
        STATUS_IN_PROGRESS,
        STATUS_COMPLETE,
    )

    dict_properties = (
        'subject',
        'instrument_version',
        'status',
        'evaluation_date',
    )

    @classmethod
    def validate_data(cls, data, instrument_definition=None):
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

        # Make sure we're working with a dict.
        if isinstance(data, str):
            try:
                data = AnyVal().parse(data)
            except Error as exc:
                raise ValidationError(
                    'Invalid JSON/YAML provided: %s' % str(exc)
                )
        if not isinstance(data, dict):
            raise ValidationError(
                'Assessment Documents must be mapped objects.'
            )

        if instrument_definition:
            if isinstance(instrument_definition, str):
                try:
                    instrument_definition = AnyVal().parse(
                        instrument_definition
                    )
                except Error as exc:
                    raise ValidationError(
                        'Invalid Instrument JSON/YAML provided: %s' % (
                            str(exc),
                        )
                    )
            if not isinstance(instrument_definition, dict):
                raise ValidationError(
                    'Instrument Definitions must be mapped objects.'
                )

        try:
            validate_assessment(data, instrument=instrument_definition)
        except RiosValidationError as exc:
            msg = [
                'The following problems were encountered when validating this'
                ' Assessment:',
            ]
            for key, details in list(exc.asdict().items()):
                msg.append('%s: %s' % (
                    key or '<root>',
                    details,
                ))
            raise ValidationError('\n'.join(msg))

    @staticmethod
    def generate_empty_data(instrument_version):
        """
        Generates an Assessment data structure that addresses the Fields and
        structure of the specified InstrumentVersion, but contains no
        responses.

        :param instrument_version:
            the Instrument deffinition to model the data on
        :type instrument_version: InstrumentVersion, dict, or JSON/YAML string
        :returns:
        :rtype: dict
        """

        if isinstance(instrument_version, InstrumentVersion):
            definition = instrument_version.definition
        elif isinstance(instrument_version, dict):
            definition = instrument_version
        else:
            try:
                definition = AnyVal().parse(instrument_version)
            except Error as exc:
                raise ValueError(
                    'Invalid JSON/YAML provided: %s' % str(exc)
                )
        if not isinstance(definition, dict):
            raise TypeError(
                'Instrument Definitions must be mapped objects.'
            )

        data = {
            'instrument': {
                'id': definition['id'],
                'version': definition['version'],
            },
            'values': {},
        }

        for field in definition['record']:
            skeleton = {
                'value': None,
            }

            if isinstance(field['type'], dict) \
                    and field['type']['base'] == 'matrix':
                # Empty matrices are a little more complex.

                skeleton['value'] = {}
                for row in field['type']['rows']:
                    skeleton['value'][row['id']] = {}
                    for column in field['type']['columns']:
                        skeleton['value'][row['id']][column['id']] = {
                            'value': None,
                        }

            data['values'][field['id']] = skeleton

        return data

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves an Assessment from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Assessment to retrieve
        :type uid: string
        :param user: the User who should have access to the desired Assessment
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Assessment; None if the specified UID does not exist
        :rtype: Assessment
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns Asessments that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * instrument (UID or instance; exact matches)
        * instrument_version (UID or instance; exact matches)
        * subject (UID or instance; exact matches)
        * status (exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Assessments to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of Assessments to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means no
            limit
        :type limit: int
        :param user: the User who should have access to the desired Assessments
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Assessments
        """

        raise NotImplementedError()

    class BulkAssessment(object):
        _FIELDS = [
            'uid',
            'data',
            'instrument_version_uid',
            'subject_uid',
            'evaluation_date',
            'context',
        ]

        def __init__(self, **kwargs):
            for field in self._FIELDS:
                setattr(self, field, kwargs.get(field))

        def __repr__(self):
            return '%s(%s)' % (
                self.__class__.__name__,
                ', '.join([
                    '%s=%r' % (field, getattr(self, field))
                    for field in self._FIELDS
                ]),
            )

    @classmethod
    def bulk_retrieve(cls, uids):
        """
        Intended for usage in applications like RexMart, this method will
        retrieve a barebones set of properties for multiple Assessments in one
        execution. This is a much faster and lightweight method for retrieving
        multiple, complete, known, Assessments when you only need very basic
        information and functionality about them.

        This method returns a list of BulkAssessment objects that will have
        the following properties populated (other properties are left None):
        * uid  (str)
        * data  (dict)
        * instrument_version_uid  (str)
        * subject_uid  (str)
        * evaluation_date  (datetime)

        :param uids:
            the UIDs of the Assessments to retrieve from the datastore
        :type uids: list
        :rtype: list of Assessment.BulkAssessment
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            subject,
            instrument_version,
            data=None,
            evaluation_date=None,
            implementation_context=None):
        """
        Creates an Assessment in the datastore and returns a
        corresponding Assessment instance.

        Must be implemented by concrete classes.

        :param subject: the Subject the Assessment is associated with
        :type subject: Subject
        :param instrument_version:
            the InstrumentVersion the Assessment is in response to
        :type instrument_version: InstrumentVersion
        :param data: the Assessment data
        :type data: dict or JSON string
        :param evaluation_date: the date the data was originally collected
        :type evaluation_date: date
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the Assessment in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Assessment
        """

        raise NotImplementedError()

    @classmethod
    def bulk_create(cls, assessments, validate=True):
        """
        Intended for usage in utilities like rex.assessment_import, this method
        will create multiple Assessments in the data store in a single, more
        efficient operation (as opposed to using the ``create()`` method in a
        loop).

        The BulkAssessment objects provided in the ``assessments`` argument
        are expected to have the following keys populated:

        * subject_uid: The UID of the Subject to associate the Assessment with.
          Required.
        * instrument_version_uid: The UID of the Instrument Version that the
          Assessment is in response to. Required.
        * data: A dictionary containing the Assessment Document. Required.
        * evaluation_date: A datetime reflecting the date the data was
          originally captured. Optional.
        * context: A dictionary containing the extra, implementation-specific
          variables necessary to create the Assessment in the datastore.
          Optional.

        :param assessments:
            the collection of Assessments to load into the datastore
        :type assessments: iterable of Assessment.BulkAssessment
        :param validate:
            indicates whether or not the Assessment Documents should be
            validated prior to loading them into the datastore. If not
            specified, defaults to True.
        :type validate: bool
        :returns: the number of Assessments created
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('assessment')

    def __init__(
            self,
            uid,
            subject,
            instrument_version,
            data,
            evaluation_date=None,
            status=None):
        self._uid = to_unicode(uid)

        if not isinstance(subject, (Subject, str)):
            raise ValueError(
                'subject must be an instance of Subject or a UID of one'
            )
        self._subject = subject

        if not isinstance(instrument_version, (InstrumentVersion, str)):
            raise ValueError(
                'instrument_version must be an instance of InstrumentVersion'
                ' or a UID of one'
            )
        else:
            self._instrument_version = instrument_version

        if isinstance(data, str):
            self._data = AnyVal().parse(data)
        else:
            self._data = deepcopy(data)

        self.evaluation_date = evaluation_date
        self.status = status or self.__class__.STATUS_IN_PROGRESS

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Assessment in the
        datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def instrument_version(self):
        """
        The InstrumentVersion that this Assessment is in response to. Read
        only.

        :rtype: InstrumentVersion
        """

        if isinstance(self._instrument_version, str):
            iv_impl = get_implementation('instrumentversion')
            return iv_impl.get_by_uid(self._instrument_version)
        else:
            return self._instrument_version

    @memoized_property
    def subject(self):
        """
        The Subject that this Assessment is about. Read only.

        :rtype: Subject
        """

        if isinstance(self._subject, str):
            subject_impl = get_implementation('subject')
            return subject_impl.get_by_uid(self._subject)
        else:
            return self._subject

    @property
    def evaluation_date(self):
        """
        The date the data was originally collected.

        :rtype: date
        """

        return self._evaluation_date

    @evaluation_date.setter
    def evaluation_date(self, value):
        if isinstance(value, datetime):
            value = value.date()
        if not isinstance(value, date) and value is not None:
            raise ValueError(
                '"%s" is not a valid date' % (
                    value,
                )
            )
        # pylint: disable=attribute-defined-outside-init
        self._evaluation_date = value

    @property
    def status(self):
        """
        The status of this Assessment.

        :rtype: unicode
        """

        return self._status

    @status.setter
    def status(self, value):
        if value not in self.__class__.ALL_STATUSES:
            raise ValueError(
                '"%s" is not a valid Assessment status' % (
                    value,
                )
            )
        # pylint: disable=attribute-defined-outside-init
        self._status = value

    @property
    def is_done(self):
        """
        Indicates whether or not this Assessment is in a terminal status. Read
        only.

        :rtype: bool
        """

        return self.status in (
            self.__class__.STATUS_COMPLETE,
        )

    @property
    def data(self):
        """
        The Common Assessment Document that contains the data of this
        Assessment.

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

        if self._data:
            return dump_assessment_json(self._data)
        return None

    @data_json.setter
    def data_json(self, value):
        self.data = AnyVal().parse(value)

    def validate(self, instrument_definition=None):
        """
        Validates that this Asessment is a legal Assessment Document.

        :param instrument_definition:
            the Common Instrument Definition to validate the data against; if
            not specified, the definition found on the InstrumentVersion
            associated with this Assessment will be used
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the Assessment fails any of the requirements
        """

        if (not instrument_definition) and self.instrument_version:
            instrument_definition = self.instrument_version.definition

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

        return get_assessment_meta(self.data, name, default=default)

    def set_meta(self, name, value):
        """
        A convenience method for setting Assessment-level metadata property on
        the data.

        :param name: the name of the metadata property to set
        :type name: string
        :param value: the value of the metadata property
        :type value: string
        """

        return set_assessment_meta(self.data, name, value)

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
        Marks the Assessment as complete and performs a validation of the
        Assessment Document.

        :param user: the User who is completing the Assessment
        :type user: User
        :raises:
            ValidationError if the document failed its validation
        """

        # pylint: disable=unused-argument

        if self.status != Assessment.STATUS_COMPLETE:
            self.status = Assessment.STATUS_COMPLETE
            self.set_meta('dateCompleted', get_current_datetime().isoformat())
            self.set_application_token('rex.instrument')
            self.validate()
        else:
            raise InstrumentError(
                'Cannot complete an Assessment that is already in a terminal'
                ' state.',
            )

    def save(self, implementation_context=None):
        """
        Persists the Assessment into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the Assessment in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def delete(self):
        """
        Removes this Assessment from the datastore.

        Note: Once executed, this instance of Assessment becomes
        invalid, and any attempts to ``save()``, or ``delete()``
        will fail horribly.

        Must be implemented by concreted classes

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.subject,
            self.instrument_version,
        )

