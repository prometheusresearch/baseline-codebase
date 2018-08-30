#
# Copyright (c) 2015, Prometheus Research, LLC
#


from copy import deepcopy

from rex.core import Extension, AnyVal

from .draftinstrumentversion import DraftInstrumentVersion
from ..mixins import Comparable, Displayable, Dictable, \
    ImplementationContextable
from ..output import dump_calculationset_yaml, dump_calculationset_json
from ..util import to_unicode, memoized_property, get_implementation


__all__ = (
    'DraftCalculationSet',
)


class DraftCalculationSet(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents a Calculation Set definition that has not yet been published for
    use in the system.
    """

    dict_properties = (
        'draft_instrument_version',
    )

    @classmethod
    def validate_definition(cls, definition, instrument_definition=None):
        """
        Validates that the specified definition is a legal Common
        CalculationSet Definition.

        :param definition: the CalculationSet definition to validate
        :type definition: dict or JSON/YAML string
        :param instrument_definition:
            the Common Instrument Definition that the definition should be
            validated against
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the specified definition fails any of the
            requirements
        """

        calc_impl = get_implementation('calculationset')
        calc_impl.validate_definition(
            definition,
            instrument_definition=instrument_definition,
        )

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves a DraftCalculationSet from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the DraftCalculationSet to retrieve
        :type uid: string
        :param user:
            the User who should have access to the desired DraftCalculationSet
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified DraftCalculationSet; None if the specified UID does
            not exist
        :rtype: DraftCalculationSet
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns DraftCalculationSets that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * draft_instrument_version (UID or instance; exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of DraftCalculationSets to start the return
            set from (useful for pagination purposes); if not specified,
            defaults to 0
        :type offset: int
        :param limit:
            the maximum number of DraftCalculationSets to return (useful for
            pagination purposes); if not specified, defaults to ``None``, which
            means no limit
        :type limit: int
        :param user:
            the User who should have access to the desired DraftCalculationSets
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of DraftCalculationSets
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            draft_instrument_version,
            definition=None,
            implementation_context=None):
        """
        Creates a DraftCalculationSet in the datastore and returns a
        corresponding DraftCalculationSet instance.

        Must be implemented by concrete classes.

        :param draft_instrument_version:
            the DraftInstrumentVersion the DraftCalculationSet is associated
            with
        :type draft_instrument_version: DraftInstrumentVersion
        :param definition: the Calculation Set definition
        :type definition: dict or JSON/YAML string
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the DraftCalculationSet in the data store; if not specified,
            defaults to None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: DraftCalculationSet
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('draftcalculationset')

    def __init__(self, uid, draft_instrument_version, definition):
        self._uid = to_unicode(uid)

        if not isinstance(
                draft_instrument_version,
                (DraftInstrumentVersion, str)):
            raise ValueError(
                'draft_instrument_version must be an instance of'
                ' DraftInstrumentVersion or a UID of one'
            )
        self._draft_instrument_version = draft_instrument_version

        if isinstance(definition, str):
            self._definition = AnyVal().parse(definition)
        else:
            self._definition = deepcopy(definition)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this DraftCalculationSet in the
        datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def draft_instrument_version(self):
        """
        The DraftInstrumentVersion that this DraftCalculationSet is associated
        with. Read only.

        :rtype: DraftInstrumentVersion
        """

        if isinstance(self._draft_instrument_version, str):
            div_impl = get_implementation('draftinstrumentversion')
            return div_impl.get_by_uid(self._draft_instrument_version)
        else:
            return self._draft_instrument_version

    @property
    def definition(self):
        """
        The Calculation Set Definition of this DraftCalculationSet.

        :rtype: dict
        """

        return self._definition

    @definition.setter
    def definition(self, value):
        self._definition = deepcopy(value)

    @property
    def definition_json(self):
        """
        The Calculation Set Definition of this DraftCalculationSet.

        :rtype: JSON-encoded string
        """

        if self._definition:
            return dump_calculationset_json(self._definition)
        return None

    @definition_json.setter
    def definition_json(self, value):
        self.definition = AnyVal().parse(value)

    @property
    def definition_yaml(self):
        """
        The Calculation Set Definition of this DraftCalculationSet.

        :rtype: YAML-encoded string
        """

        if self._definition:
            return dump_calculationset_yaml(self._definition)
        return None

    @definition_yaml.setter
    def definition_yaml(self, value):
        self.definition = AnyVal().parse(value)

    def validate(self, instrument_definition=None):
        """
        Validates that this DraftCalculationSet is a legal Calculation Set
        Definition.

        :param instrument_definition:
            the Common Instrument Definition that the Calculation Set should be
            validated against; if not specified, the definition found on the
            DraftInstrumentVersion associated with this DraftCalculationSet
            will be used
        :type instrument_definition: string or dict
        :raises:
            ValidationError if the CalculationSet fails any of the requirements
        """

        if (not instrument_definition) and self.draft_instrument_version:
            instrument_definition = self.draft_instrument_version.definition

        return self.__class__.validate_definition(
            self.definition,
            instrument_definition=instrument_definition,
        )

    def save(self, implementation_context=None):
        """
        Persists the DraftCalculationSet into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the DraftCalculationSet in the data store; if not specified,
            defaults to None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def delete(self):
        """
        Removes this DraftCalculationSet from the datastore.

        Note: Once executed, this instance of DraftCalculationSet becomes
        invalid, and any attempts to ``save()``, ``delete()``, or ``publish()``
        will fail horribly.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def publish(
            self,
            instrument_version,
            calculationset_implementation_context=None):
        """
        Publishes this draft as the CalculationSet for the specified
        instrument_version.

        :param instrument_version:
            the InstrumentVersion to associate the CalculationSet with
        :type instrument_version: InstrumentVersion
        :param calculationset_implementation_context:
            the extra, implementation-specific variables necessary to create
            the published CalculationSet in the data store; if not specified,
            defaults to None
        :type calculationset_implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :returns: the CalculationSet that results from the publishing
        """

        self.definition['instrument']['id'] = \
            instrument_version.definition['id']
        self.definition['instrument']['version'] = \
            instrument_version.definition['version']

        calc_impl = get_implementation('calculationset')
        calc = calc_impl.create(
            instrument_version,
            self.definition,
            implementation_context=calculationset_implementation_context,
        )

        return calc

    def get_display_name(self):
        """
        Returns a unicode string that represents this DraftCalculationSet,
        suitable for use in human-visible places.

        :rtype: unicode
        """

        return to_unicode(self.uid)

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.draft_instrument_version,
        )

