#
# Copyright (c) 2014, Prometheus Research, LLC
#


from copy import deepcopy
from datetime import datetime

from rios.core import validate_instrument, \
    ValidationError as RiosValidationError
from rios.core.validation.instrument import TYPES_ALL, \
    get_full_type_definition
from rex.core import Extension, AnyVal, Error

from .instrument import Instrument
from ..errors import ValidationError
from ..mixins import *
from ..output import dump_instrument_yaml, dump_instrument_json
from ..util import to_unicode, memoized_property, get_implementation


__all__ = (
    'InstrumentVersion',
)


class InstrumentVersion(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
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
    def get_definition_type_catalog(cls, definition):
        """
        This method creates and returns a dictionary that maps all defined
        types in the definition to their most basic type.

        :param definition:
            the Instrument definition to create the catalog from
        :type definition: dict or JSON/YAML string
        :rtype: dict
        """
        # Make sure we're working with a dict.
        if isinstance(definition, str):
            try:
                definition = AnyVal().parse(definition)
            except Error as exc:
                raise ValueError(
                    'Invalid JSON/YAML provided: %s' % str(exc)
                )
        if not isinstance(definition, dict):
            raise TypeError(
                'Instrument Definitions must be mapped objects.'
            )

        base_types = sorted(TYPES_ALL)
        known_types = dict(list(zip(base_types, base_types)))

        known_types.update(dict([
            (tid, type_def['base'])
            for tid, type_def in list(definition.get('types', {}).items())
        ]))

        while set(known_types.values()) - set(TYPES_ALL):
            for tid, base in list(known_types.items()):
                if base not in TYPES_ALL:
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
    def get_full_type_definition(cls, definition, type_def):
        """
        Returns a fully-defined type definition given a name or partial type
        definition. It will trace the entire inheritance path and return all
        aspects of the definition, including an addition key named ``base``
        which indiciates the base Instrument Definition type of the entire
        chain.

        :param definition:
            the Instrument definition to retrieve the type definition from
        :type definition: dict or JSON/YAML string
        :param type_def:
        :type type_def: str or dict
        :rtype: dict
        :raises:
            * ValueError if the specified type_def is not defined, or the
              definition is invalid
            * TypeError if the specified type_def is not a string or dict, or
                the definition is invalid
        """

        # Make sure we're working with a dict.
        if isinstance(definition, str):
            try:
                definition = AnyVal().parse(definition)
            except Error as exc:
                raise ValueError(
                    'Invalid JSON/YAML provided: %s' % str(exc)
                )
        if not isinstance(definition, dict):
            raise TypeError(
                'Instrument Definitions must be mapped objects.'
            )

        return get_full_type_definition(definition, type_def)

    @classmethod
    def validate_definition(cls, definition):
        """
        Validates that the specified definition is a legal Common Instrument
        Definition.

        :param definition: the Instrument definition to validate
        :type definition: dict or JSON/YAML string
        :raises:
            ValidationError if the specified definition fails any of the
            requirements
        """

        # Make sure we're working with a dict.
        if isinstance(definition, str):
            try:
                definition = AnyVal().parse(definition)
            except Error as exc:
                raise ValidationError(
                    'Invalid JSON/YAML provided: %s' % str(exc)
                )
        if not isinstance(definition, dict):
            raise ValidationError(
                'Instrument Definitions must be mapped objects.'
            )

        try:
            validate_instrument(definition)
        except RiosValidationError as exc:
            msg = [
                'The following problems were encountered when validating this'
                ' Instrument:',
            ]
            for key, details in list(exc.asdict().items()):
                msg.append('%s: %s' % (
                    key or '<root>',
                    details,
                ))
            raise ValidationError('\n'.join(msg))

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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns InstrumentVersions that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * instrument (UID or instance; exact matches)
        * version (exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of InstrumentVersions to start the return
            set from (useful for pagination purposes); if not specified,
            defaults to 0
        :type offset: int
        :param limit:
            the maximum number of InstrumentVersions to return (useful for
            pagination purposes); if not specified, defaults to ``None``, which
            means no limit
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
            date_published=None,
            implementation_context=None):
        """
        Creates an InstrumentVersion in the datastore and returns a
        corresponding InstrumentVersion instance.

        Must be implemented by concrete classes.

        :param instrument: the Instrument the instance will be a version of
        :type instrument: Instrument
        :param definition: the Common Instrument Definition for the version
        :type definition: dict or JSON/YAML-encoded string
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
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the InstrumentVersion in the data store; if not specified, defaults
            to None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: InstrumentVersion
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('instrumentversion')

    def __init__(
            self,
            uid,
            instrument,
            definition,
            version,
            published_by,
            date_published):
        self._uid = to_unicode(uid)

        if not isinstance(instrument, (Instrument, str)):
            raise ValueError(
                'instrument must be an instance of Instrument or a UID of one'
            )
        self._instrument = instrument

        self._version = version

        if isinstance(definition, str):
            self._definition = AnyVal().parse(definition)
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

        if isinstance(self._instrument, str):
            instrument_impl = get_implementation('instrument')
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

        return dump_instrument_json(self._definition)

    @definition_json.setter
    def definition_json(self, value):
        self.definition = AnyVal().parse(value)

    @property
    def definition_yaml(self):
        """
        The Common Instrument Definition of this Instrument.

        :rtype: YAML-encoded string
        """

        return dump_instrument_yaml(self._definition)

    @definition_yaml.setter
    def definition_yaml(self, value):
        self.definition = AnyVal().parse(value)

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
        # pylint: disable=attribute-defined-outside-init
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

        # pylint: disable=attribute-defined-outside-init
        self._date_published = value

    @memoized_property
    def calculation_set(self):
        """
        The CalculationSet associated with this InstrumentVersion. Read only.

        :rtype: CalculationSet
        """

        from .calculationset import CalculationSet
        calcs = CalculationSet.get_implementation().find(
            instrument_version=self.uid,
            limit=1,
        )
        if calcs:
            return calcs[0]
        return None

    def validate(self):
        """
        Validates that this definition is a legal Common Instrument
        Definition.

        :raises:
            ValidationError if the definition fails any of the requirements
        """

        return self.__class__.validate_definition(self.definition)

    def save(self, implementation_context=None):
        """
        Persists the InstrumentVersion into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the InstrumentVersion in the data store; if not specified, defaults
            to None
        :type implementation_context: dict
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

