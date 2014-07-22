#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import re

from copy import deepcopy
from datetime import datetime, date

import jsonschema

from rex.core import Extension, get_settings

from .errors import ValidationError, InstrumentError
from .mixins import Comparable, Displayable, Dictable
from .schema import INSTRUMENT_SCHEMA, INSTRUMENT_BASE_TYPES, \
    INSTRUMENT_FIELD_CONSTRAINTS, INSTRUMENT_REQUIRED_CONSTRAINTS, \
    ASSESSMENT_SCHEMA, INSTRUMENT_COMPLEX_TYPES
from .meta import *
from .util import to_unicode, memoized_property


__all__ = (
    'User',
    'Subject',
    'Instrument',
    'InstrumentVersion',
    'Assessment',
)


class User(Extension, Comparable, Displayable, Dictable):
    """
    Represents the person who is engaging with the application in order to
    provide responses for Instruments. The User may or may not be the Subject
    of an Instrument.
    """

    dict_properties = (
        'login',
    )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a User from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the User to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified User; None if the specified UID does not exist
        :rtype: User
        """

        raise NotImplementedError()

    @classmethod
    def get_by_login(cls, login):
        """
        Retrieves a User from the datastore using its login username.

        Must be implemented by concrete classes.

        :param login: the login username of the User to retrieve
        :type login: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified User; None if the specified login does not exist
        :rtype: User
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Users that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Users to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Users to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Users
        """

        raise NotImplementedError()

    def __init__(self, uid, login):
        self._uid = to_unicode(uid)
        self._login = to_unicode(login)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this User in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @property
    def login(self):
        """
        The (unique) login username that is assigned to this user. Read only.

        :rtype: unicode
        """

        return self._login

    def find_subjects(self, offset=0, limit=100, **search_criteria):
        """
        Returns Subjects that match the specified criteria that this User
        has access to.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Subjects to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Subjects to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Subjects
        """

        raise NotImplementedError()

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return self.login

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.login,
        )


class Subject(Extension, Comparable, Displayable, Dictable):
    """
    Represents the Subject of an Instrument; the person, place, or thing that
    an Instrument is gathering data points about.
    """

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a Subject from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Subject to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Subject; None if the specified UID does not exist
        :rtype: Subject
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Subjects that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Subjects to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Subjects to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Subjects
        """

        raise NotImplementedError()

    def __init__(self, uid):
        self._uid = to_unicode(uid)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Subject in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid


class Instrument(Extension, Comparable, Displayable, Dictable):
    """
    Represents a general, unversioned Instrument.
    """

    #: The Instrument can be used for data collection.
    STATUS_ACTIVE = u'active'
    #: The Instrument is not allowed to be used for data collection.
    STATUS_DISABLED = u'disabled'
    ALL_STATUSES = (
        STATUS_ACTIVE,
        STATUS_DISABLED,
    )

    dict_properties = (
        'title',
        'status',
    )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves an Instrument from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Instrument to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Instrument; None if the specified UID does not exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Instruments that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Instrument to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Instruments to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Instruments
        """

        raise NotImplementedError()

    @classmethod
    def create(cls, uid, title, status=None):
        """
        Creates an Instrument in the datastore and returns a corresponding
        Instrument instance.

        Must be implemented by concrete classes.

        :param uid:
            the unique identifier that will represent the new Instrument
        :type uid: string
        :param title: the title to use for the new Instrument
        :type title: string
        :param status:
            the status to assign the new Instrument. if not specified,
            ``STATUS_ACTIVE`` is used
        :type status: string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Instrument
        """

        raise NotImplementedError()

    def __init__(self, uid, title, status=None):
        self._uid = to_unicode(uid)
        self.title = title
        self.status = status or self.__class__.STATUS_ACTIVE

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Instrument in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @property
    def title(self):
        """
        The human-readable title of the Instrument.

        :rtype: unicode
        """

        return self._title

    @title.setter
    def title(self, value):
        # pylint: disable=W0201
        self._title = to_unicode(value)

    @property
    def status(self):
        """
        The status of this Instrument.

        :rtype: unicode
        """

        return self._status

    @status.setter
    def status(self, value):
        if value not in self.__class__.ALL_STATUSES:
            raise ValueError(
                '"%s" is not a valid Instrument status' % (
                    value,
                )
            )
        # pylint: disable=W0201
        self._status = value

    def get_version(self, version):
        """
        Returns the InstrumentVersion for this Instrument of the specified
        version.

        Must be implemented by concrete classes.

        :returns:
            an InstrumentVersion for the specified version; None if the
            specified version does not exist
        """

        raise NotImplementedError()

    @property
    def latest_version(self):
        """
        The most recent InstrumentVersion for this Instrument. Read only.

        Must be implemented by concrete classes.
        """

        raise NotImplementedError()

    def save(self):
        """
        Persists the Instrument into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return self.title

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.title,
        )


class InstrumentVersion(Extension, Comparable, Displayable, Dictable):
    """
    Represents a single version of an Instrument.
    """

    dict_properties = (
        'instrument',
        'version',
    )

    @classmethod
    def _validate_unique_ids(cls, root, seen=None, key='record'):
        # This method makes sure all unique IDs in the definition are actually
        # unique.

        seen = seen or set()

        for field in root[key]:
            if field['id'] in seen:
                raise ValidationError(
                    'ID "%(id)s" is defined multiple times.' % {
                        'id': field['id'],
                    }
                )
            else:
                seen.add(field['id'])

            if 'type' in field and isinstance(field['type'], dict):
                if 'record' in field['type']:
                    cls._validate_unique_ids(field['type'], seen=seen)

                if 'columns' in field['type']:
                    cls._validate_unique_ids(
                        field['type'],
                        key='columns',
                        seen=seen,
                    )
                if 'rows' in field['type']:
                    cls._validate_unique_ids(
                        field['type'],
                        key='rows',
                        seen=seen,
                    )

                if 'columns' in field['type'] and 'rows' in field['type']:
                    combined = [
                        '%s_%s' % (row['id'], col['id'])
                        for row in field['type']['rows']
                        for col in field['type']['columns']
                    ]
                    clashed = seen & set(combined)
                    if clashed:
                        raise ValidationError(
                            'There are generated matrix IDs that already exist'
                            ' as individal identifiers: %s' % (
                                ', '.join(clashed),
                            )
                        )

    @classmethod
    def _validate_type(cls, type_def, known_types=None, embedded=False):
        # This method will validate the structure of a type definition object.

        known_types = known_types or {}

        if isinstance(type_def, basestring):
            if type_def not in known_types.keys():
                raise ValidationError(
                    '"%s" is not a known field type.' % (
                        type_def,
                    )
                )
            return

        try:
            base_type = known_types[type_def['base']]
        except KeyError:
            raise ValidationError(
                '"%(base)s" does not exist as a type to inherit from.' % {
                    'base': type_def['base'],
                }
            )

        if embedded and base_type in INSTRUMENT_COMPLEX_TYPES:
            raise ValidationError(
                'Complex type "%(type)s" cannot be used within another'
                ' complex type.' % {
                    'type': base_type,
                }
            )

        constraints = set(type_def.keys())
        constraints.discard('base')
        extra = constraints - \
            INSTRUMENT_FIELD_CONSTRAINTS.get(base_type, set())
        if extra:
            raise ValidationError(
                '"%(type)s" Fields cannot have constraints:'
                ' %(options)s' % {
                    'type': base_type,
                    'options': ', '.join(extra),
                }
            )
        missing = INSTRUMENT_REQUIRED_CONSTRAINTS.get(base_type, set()) \
            - constraints
        if missing:
            raise ValidationError(
                '"%(type)s" Field missing required options:'
                ' %(options)s' % {
                    'type': base_type,
                    'options': ', '.join(missing),
                }
            )

        # Make sure any types defined in the depths of a recordList or matrix
        # are also valid.
        for field_def in type_def.get('record', []):
            cls._validate_type(field_def['type'], known_types, embedded=True)
        for col_def in type_def.get('columns', []):
            cls._validate_type(col_def['type'], known_types, embedded=True)

    @classmethod
    def _validate_field(cls, field_def, known_types):
        if field_def.get('required', False) \
                and field_def.get('annotation', 'none') != 'none':
            raise ValidationError(
                'A field cannot both be required and allow annotations.'
            )

        # Make sure the types defined inline on fields are well-defined.
        cls._validate_type(field_def['type'], known_types)

    @classmethod
    def get_definition_type_catalog(cls, definition):
        """
        This method creates and returns a dictionary that maps all defined
        types in the definition to their most basic type.

        :param definition:
            the Instrument definition to create the catalog from
        :type defintition: dict
        :rtype: dict
        """

        base_types = sorted(INSTRUMENT_BASE_TYPES)
        known_types = dict(zip(base_types, base_types))

        known_types.update(dict([
            (tid, type_def['base'])
            for tid, type_def in definition.get('types', {}).items()
        ]))

        while set(known_types.values()) - INSTRUMENT_BASE_TYPES:
            for tid, base in known_types.items():
                if base not in INSTRUMENT_BASE_TYPES:
                    try:
                        known_types[tid] = known_types[base]
                    except KeyError:
                        raise ValidationError(
                            '"%(base)s" does not exist as a type to inherit'
                            ' from.' % {
                                'base': base,
                            }
                        )

        return known_types

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

        # Make sure we're working with a dict.
        if isinstance(definition, basestring):
            definition = json.loads(definition)
        if not isinstance(definition, dict):
            raise ValidationError(
                'Instrument Definitions must be mapped objects.'
            )

        # Make sure it validates against the schema.
        try:
            jsonschema.validate(
                definition,
                INSTRUMENT_SCHEMA,
                format_checker=jsonschema.FormatChecker(),
            )
        except jsonschema.ValidationError as ex:
            raise ValidationError(ex.message)

        # Make sure all IDs are unique.
        cls._validate_unique_ids(definition)

        # Build a catalog of types available for use in this definition.
        known_types = cls.get_definition_type_catalog(definition)

        # Make sure the types are well-defined.
        for type_name, type_def in definition.get('types', {}).items():
            if known_types.get(type_name) in INSTRUMENT_COMPLEX_TYPES:
                raise ValidationError(
                    'The "%(custom)s" custom type cannot be based on complex'
                    ' type "%(base)s".' % {
                        'custom': type_name,
                        'base': known_types[type_name],
                    }
                )
            else:
                cls._validate_type(type_def, known_types)

        # Make sure the fields are well-defined.
        for field_def in definition['record']:
            cls._validate_field(field_def, known_types)

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves an InstrumentVersion from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the InstrumentVersion to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified InstrumentVersion; None if the specified ID does not
            exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Instruments that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of InstrumentVersions to start the return
            set from (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of InstrumentVersions to return (useful for
            pagination purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of InstrumentVersions
        """

        raise NotImplementedError()

    @classmethod
    def create(cls, instrument, definition, version=None):
        """
        Creates an InstrumentVersion in the datastore and returns a
        corresponding InstrumentVersion instance.

        Must be implemented by concrete classes.

        :param instrument: the Instrument the instance will be a version of
        :type instrument: Instrument
        :param definition: the JSON Instrument Definition for the version
        :type definition: dict or JSON string
        :param version:
            the identifier of the version to create; if None, one will be
            calculated
        :type version: int
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: InstrumentVersion
        """

        raise NotImplementedError()

    def __init__(self, uid, instrument, definition, version):
        self._uid = to_unicode(uid)

        if not isinstance(instrument, (Instrument, basestring)):
            raise ValueError(
                'instrument must be an instance of Instrument or a UID of one'
            )
        self._instrument = instrument

        self._version = version

        if isinstance(definition, basestring):
            self._definition = json.loads(definition)
        else:
            self._definition = deepcopy(definition)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this InstrumentVersion in the
        datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def instrument(self):
        """
        The Instrument this instance is a version of. Read only.

        :rtype: Instrument
        """

        if isinstance(self._instrument, basestring):
            instrument_impl = \
                get_settings().instrument_implementation.instrument
            return instrument_impl.get_by_uid(self._instrument)
        else:
            return self._instrument

    @property
    def version(self):
        """
        The version of the Instrument this instance represents. Read only.
        """

        return self._version

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

        return json.dumps(self._definition, ensure_ascii=False)

    @definition_json.setter
    def definition_json(self, value):
        self.definition = json.loads(value)

    def validate(self):
        """
        Validates that this Instrument is a legal Common Instrument
        Definition.

        :raises:
            ValidationError if the Instrument fails any of the requirements
        """

        return self.__class__.validate_definition(self.definition)

    def save(self):
        """
        Persists the Instrument into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return to_unicode(self.definition['title'])

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.instrument,
            self.version,
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

    STATUS_IN_PROGRESS = u'in-progress'  #: The Assessment is not yet complete.
    STATUS_COMPLETE = u'completed'       #: The Assessment is complete.
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
    def validate_data(data, instrument_version=None):
        """
        Validates that the specified data is a legal Assessment Document.

        :param data: the Assessment data to validate
        :type data: dict or JSON string
        :param instrument_version:
            the InstrumentVersion containing the Instrument Definition to
            validate the data against; if not specified, only the adherance to
            the base Assessment Document definition is checked
        :type instrument_version: InstrumentVersion
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

        if not instrument_version:
            return

        # Make sure the instrument ID lines up
        if data['instrument']['id'] != instrument_version.definition['id'] or \
                data['instrument']['version'] != \
                instrument_version.definition['version']:
            raise ValidationError(
                'This Assessment is not associated with the specified'
                ' InstrumentVersion'
            )

        Assessment._check_assessment_record(
            data['values'],
            instrument_version.definition['record'],
            known_types=InstrumentVersion.get_definition_type_catalog(
                instrument_version.definition
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
    def get_by_uid(cls, uid):
        """
        Retrieves an Assessment from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Assessment to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Assessment; None if the specified UID does not exist
        :rtype: Assessment
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Asessments that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Assessments to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Assessments to return (useful for pagination
            purposes)
        :type limit: int
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

    def validate(self):
        """
        Validates that this Asessment is a legal Assessment Document.

        :raises:
            ValidationError if the Assessment fails any of the requirements
        """

        return self.__class__.validate_data(self.data, self.instrument_version)

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

