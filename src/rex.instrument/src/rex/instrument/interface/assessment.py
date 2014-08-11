#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import re

from copy import deepcopy
from datetime import datetime, date

import jsonschema

from rex.core import Extension, get_settings

from .instrumentversion import InstrumentVersion
from .subject import Subject
from ..errors import ValidationError, InstrumentError
from ..meta import get_assessment_meta, set_assessment_meta, \
    set_assessment_application
from ..mixins import Comparable, Displayable, Dictable
from ..schema import ASSESSMENT_SCHEMA
from ..util import to_unicode, memoized_property


__all__ = (
    'Assessment',
)


SIMPLE_TYPE_CHECKS = {
    'float': (int, long, float),
    'text': basestring,
    'enumeration': basestring,
    'enumerationSet': list,
    'boolean': bool,
}


REGEX_TYPE_CHECKS = {
    'date':  re.compile(
        r'^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:[0-2][0-9]|3[0-1])$'
    ),
    'time': re.compile(
        r'^(?:[0-1][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])$'
    ),
    'dateTime': re.compile(
        r'^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:[0-2][0-9]|3[0-1])'
        'T(?:[0-1][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])$'
    ),
}


class Assessment(Extension, Comparable, Displayable, Dictable):
    """
    Represents a response to an Instrument by a Subject.
    """

    #: The Assessment is not yet complete.
    STATUS_IN_PROGRESS = u'in-progress'

    #: The Assessment is complete.
    STATUS_COMPLETE = u'completed'

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

        # Make sure we're working with a dict.
        if isinstance(data, basestring):
            data = json.loads(data)
        if not isinstance(data, dict):
            raise ValidationError(
                'Assessment Documents must be mapped objects.'
            )

        # Make sure it validates against the base schema.
        try:
            jsonschema.validate(
                data,
                ASSESSMENT_SCHEMA,
                format_checker=jsonschema.FormatChecker(),
            )
        except jsonschema.ValidationError as ex:
            raise ValidationError(ex.message)

        if not instrument_definition:
            return
        else:
            if isinstance(instrument_definition, basestring):
                instrument_definition = json.loads(instrument_definition)
            if not isinstance(instrument_definition, dict):
                raise ValidationError(
                    'Instrument Definitions must be mapped objects.'
                )

        # Make sure the instrument ID lines up
        if data['instrument']['id'] != instrument_definition['id'] or \
                data['instrument']['version'] != \
                instrument_definition['version']:
            raise ValidationError(
                'This Assessment is not associated with the specified'
                ' Instrument Definition'
            )

        Assessment._check_assessment_record(
            data['values'],
            instrument_definition['record'],
            known_types=InstrumentVersion.get_definition_type_catalog(
                instrument_definition
            ),
        )

    @staticmethod
    def _check_assessment_record(assessment, instrument_version, known_types):
        afields = set(assessment.keys())
        ifields = set([field['id'] for field in instrument_version])

        # Make sure we have all the fields.
        missing = ifields - afields
        if missing:
            raise ValidationError(
                'Assessment is missing values for: %s' % (
                    ', '.join(missing),
                )
            )

        # Make sure we don't have any extra fields.
        extra = afields - ifields
        if extra:
            raise ValidationError(
                'Assessment contains unexpected values: %s' % (
                    ', '.join(extra),
                )
            )

        for field in instrument_version:
            Assessment._check_assessment_field(
                assessment[field['id']],
                field,
                known_types,
            )

    @staticmethod
    def _check_assessment_field(assessment, field, known_types):
        value = assessment.get('value', None)
        explanation = assessment.get('explanation', None)
        annotation = assessment.get('annotation', None)

        # Make sure we have a value if required.
        if field.get('required', False) and not value:
            raise ValidationError(
                'A value for field "%s" is required' % (
                    field['id'],
                )
            )

        # Make sure we have an explanation when desired.
        opt = field.get('explanation', 'none')
        if opt == 'none' and explanation is not None:
            raise ValidationError(
                'An explanation for field "%s" is not allowed' % (
                    field['id'],
                )
            )
        elif opt == 'required' and not explanation:
            raise ValidationError(
                'An explanation is required for field "%s"' % (
                    field['id'],
                )
            )

        # Make sure we have an annotation when desired.
        opt = field.get('annotation', 'none')
        if opt == 'none' and annotation is not None:
            raise ValidationError(
                'An annotation for field "%s" is not allowed' % (
                    field['id'],
                )
            )
        elif opt == 'required' and not value and not annotation:
            raise ValidationError(
                'An annotation is required for field "%s"' % (
                    field['id'],
                )
            )
        elif opt == 'optional' and value and annotation:
            raise ValidationError(
                'An annotation for field "%s" is not required because it'
                ' has a value' % (
                    field['id'],
                )
            )

        # Make sure the value data type is correct.
        Assessment._check_field_type(
            assessment,
            field,
            known_types,
        )

    @staticmethod
    def _check_field_type(assessment, field, known_types):
        value = assessment.get('value', None)

        if value is None:
            return

        if isinstance(field['type'], basestring):
            field_type = field['type']
        else:
            field_type = known_types[field['type']['base']]

        # TODO: check type constraints

        if field_type in SIMPLE_TYPE_CHECKS:
            if isinstance(value, SIMPLE_TYPE_CHECKS[field_type]):
                return

        elif field_type in REGEX_TYPE_CHECKS:
            if REGEX_TYPE_CHECKS[field_type].match(value):
                return

        elif field_type == 'integer':
            if isinstance(value, (int, long)) \
                    or (isinstance(value, float) and value.is_integer()):
                return

        elif field_type == 'recordList':
            if isinstance(value, list):
                for val in value:
                    Assessment._check_assessment_record(
                        val,
                        field['type']['record'],
                        known_types,
                    )
                return

        elif field_type == 'matrix':
            if isinstance(value, dict):
                # TODO: check missing/extra rows
                for columns in value.values():
                    Assessment._check_assessment_record(
                        columns,
                        field['type']['columns'],
                        known_types,
                    )
                return

        raise ValidationError(
            'The value for "%s" is not the correct type (%s)' % (
                field['id'],
                field_type,
            )
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

        definition = instrument_version.definition

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
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        """
        Returns Asessments that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * instrument_version (UID or instance; exact matches)
        * subject (UID or instance; exact matches)
        * status (exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Assessments to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Assessments to return (useful for pagination
            purposes)
        :type limit: int
        :param user: the User who should have access to the desired Assessments
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Assessments
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            subject,
            instrument_version,
            data=None,
            evaluation_date=None):
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
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Assessment
        """

        raise NotImplementedError()

    def __init__(
            self,
            uid,
            subject,
            instrument_version,
            data,
            evaluation_date=None,
            status=None):
        self._uid = to_unicode(uid)

        if not isinstance(subject, (Subject, basestring)):
            raise ValueError(
                'subject must be an instance of Subject or a UID of one'
            )
        self._subject = subject

        if not isinstance(instrument_version, (InstrumentVersion, basestring)):
            raise ValueError(
                'instrument_version must be an instance of InstrumentVersion'
                ' or a UID of one'
            )
        else:
            self._instrument_version = instrument_version

        if isinstance(data, basestring):
            self._data = json.loads(data)
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

        if isinstance(self._instrument_version, basestring):
            iv_impl = \
                get_settings().instrument_implementation.instrumentversion
            return iv_impl.get_by_uid(self._instrument_version)
        else:
            return self._instrument_version

    @memoized_property
    def subject(self):
        """
        The Subject that this Assessment is about. Read only.

        :rtype: Subject
        """

        if isinstance(self._subject, basestring):
            subject_impl = get_settings().instrument_implementation.subject
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
        # pylint: disable=W0201
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
        # pylint: disable=W0201
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
            return json.dumps(self._data, ensure_ascii=False)
        return None

    @data_json.setter
    def data_json(self, value):
        self.data = json.loads(value)

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

    # pylint: disable=W0613
    def complete(self, user):
        """
        Marks the Assessment as complete and performs a validation of the
        Assessment Document.

        :param user: the User who is completing the Assessment
        :type user: User
        :raises:
            ValidationError if the document failed its validation
        """

        if self.status != Assessment.STATUS_COMPLETE:
            self.status = Assessment.STATUS_COMPLETE
            self.set_meta('dateCompleted', datetime.now().isoformat()[:19])
            self.set_application_token('rex.instrument')
            self.validate()
        else:
            raise InstrumentError(
                'Cannot complete an Assessment that is already in a terminal'
                ' state.',
            )

    def save(self):
        """
        Persists the Assessment into the datastore.

        Must be implemented by concrete classes.

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

