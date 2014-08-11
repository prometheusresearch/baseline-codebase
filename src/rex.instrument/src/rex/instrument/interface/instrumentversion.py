#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from copy import deepcopy
from datetime import datetime

import jsonschema

from rex.core import Extension, get_settings

from .instrument import Instrument
from ..errors import ValidationError
from ..mixins import Comparable, Displayable, Dictable
from ..schema import INSTRUMENT_SCHEMA, INSTRUMENT_BASE_TYPES, \
    INSTRUMENT_FIELD_CONSTRAINTS, INSTRUMENT_REQUIRED_CONSTRAINTS, \
    INSTRUMENT_COMPLEX_TYPES
from ..util import to_unicode, memoized_property


__all__ = (
    'InstrumentVersion',
)


class InstrumentVersion(Extension, Comparable, Displayable, Dictable):
    """
    Represents a single version of an Instrument.
    """

    dict_properties = (
        'instrument',
        'version',
        'published_by',
        'date_published',
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
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves an InstrumentVersion from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the InstrumentVersion to retrieve
        :type uid: string
        :param user:
            the User who should have access to the desired InstrumentVersion
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified InstrumentVersion; None if the specified ID does not
            exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        """
        Returns InstrumentVersions that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * instrument (UID or instance; exact matches)
        * version (exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of InstrumentVersions to start the return
            set from (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of InstrumentVersions to return (useful for
            pagination purposes)
        :type limit: int
        :param user:
            the User who should have access to the desired InstrumentVersions
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of InstrumentVersions
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            instrument,
            definition,
            published_by,
            version=None,
            date_published=None):
        """
        Creates an InstrumentVersion in the datastore and returns a
        corresponding InstrumentVersion instance.

        Must be implemented by concrete classes.

        :param instrument: the Instrument the instance will be a version of
        :type instrument: Instrument
        :param definition: the Common Instrument Definition for the version
        :type definition: dict or JSON-encoded string
        :param published_by: the user/application that published the version
        :type published_by: string
        :param version:
            the identifier of the version to create; if None, one will be
            calculated
        :type version: int
        :param date_published:
            the date the version was published for use; if not specified,
            defaults to datetime.utcnow()
        :type date_published: datetime
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: InstrumentVersion
        """

        raise NotImplementedError()

    def __init__(
            self,
            uid,
            instrument,
            definition,
            version,
            published_by,
            date_published):
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

        self.published_by = published_by
        self.date_published = date_published

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

    @property
    def published_by(self):
        """
        The username or application that published this
        InstrumentVersion.

        :rtype: unicode
        """

        return self._published_by

    @published_by.setter
    def published_by(self, value):
        # pylint: disable=W0201
        self._published_by = to_unicode(value)

    @property
    def date_published(self):
        """
        The date the InstrumentVersion was published.

        :rtype: datetime
        """

        return self._date_published

    @date_published.setter
    def date_published(self, value):
        if not isinstance(value, datetime):
            raise ValueError(
                '"%s" is not a valid datetime' % (
                    value,
                )
            )

        # pylint: disable=W0201
        self._date_published = value

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
        Persists the InstrumentVersion into the datastore.

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

