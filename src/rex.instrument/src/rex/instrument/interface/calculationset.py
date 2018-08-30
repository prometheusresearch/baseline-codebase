#
# Copyright (c) 2015, Prometheus Research, LLC
#

from copy import deepcopy
from datetime import datetime, time
from decimal import Decimal
from rios.core import validate_calculationset, \
    ValidationError as RiosValidationError

from rex.core import Extension, AnyVal, Error, guard

from .instrumentversion import InstrumentVersion
from .calculationscope import CalculationScopeAddon
from .calculationmethod import CalculationMethod
from ..errors import ValidationError, InstrumentError
from ..mixins import *
from ..output import dump_calculationset_yaml, dump_calculationset_json
from ..util import memoized_property, get_implementation, to_unicode


__all__ = (
    'CalculationSet',
)


def coerce_instrument_type(result, instrument_type):
    if result is None:
        return result

    result_type = type(result).__name__

    if instrument_type == 'text':
        return str(result)

    elif instrument_type == 'integer':
        if result_type in ('float', 'int', 'Decimal'):
            return int(result)

        if result_type in ('str', 'unicode') and result.isdigit():
            return int(result)

    elif instrument_type == 'float':
        if result_type in ('float', 'int', 'Decimal'):
            return float(result)

        if result_type in ('str', 'unicode') and result.isdigit():
            return float(result)

    elif instrument_type == 'boolean':
        if result_type == 'bool':
            return result

        if result_type in ('int', 'float'):
            return False if result == 0 else True

    elif instrument_type == 'date':
        if result_type in ('date', 'datetime'):
            return result.strftime('%Y-%m-%d')

        if result_type in ('str', 'unicode'):
            try:
                datetime.strptime(result, '%Y-%m-%d')
            except ValueError:
                pass
            else:
                return result

    elif instrument_type == 'time':
        if result_type in ('time', 'datetime'):
            return result.strftime('%H:%M:%S')

        if result_type in ('str', 'unicode'):
            try:
                datetime.strptime(result, '%H:%M:%S')
            except ValueError:
                pass
            else:
                return result

    elif instrument_type == 'dateTime':
        if result_type == 'datetime':
            return result.strftime('%Y-%m-%dT%H:%M:%S')

        if result_type == 'date':
            return datetime.combine(
                result,
                datetime.min.time(),
            ).strftime('%Y-%m-%dT%H:%M:%S')

        if result_type in ('str', 'unicode'):
            try:
                datetime.strptime(result, '%Y-%m-%dT%H:%M:%S')
            except ValueError:
                pass
            else:
                return result

    raise ValidationError(
        'Unexpected calculation result type -- Expected "%s" got "%s"' % (
            instrument_type,
            result_type,
        )
    )


class CalculationSet(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents a calculation set object.
    """

    dict_properties = (
        'instrument_version',
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
            validated
            against
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the specified definition fails any of the
            requirements
        """

        if isinstance(definition, str):
            try:
                definition = AnyVal().parse(definition)
            except Error as exc:
                raise ValidationError(
                    'Invalid JSON/YAML provided: %s' % str(exc)
                )
        if not isinstance(definition, dict):
            raise ValidationError(
                'CalculationSet Definition must be mapped objects.'
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
            validate_calculationset(
                definition,
                instrument=instrument_definition,
            )
        except RiosValidationError as exc:
            msg = [
                'The following problems were encountered when validating this'
                ' CalculationSet:',
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
        Retrieves an CalculationSet from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the CalculationSet to retrieve
        :type uid: string
        :param user:
            the User who should have access to the desired CalculationSet
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified CalculationSet; None if the specified ID does not
            exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns CalculationSet that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * instrument_version (UID or instance; exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of CalculationSet to start the return set
            from (useful for pagination purposes); if not specified, defaults
            to 0
        :type offset: int
        :param limit:
            the maximum number of CalculationSet to return (useful for
            pagination purposes); if not specified, defaults to ``None``, which
            means no limit
        :type limit: int
        :param user: the User who should have access to the desired Form
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of CalculationSet
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            instrument_version,
            definition,
            implementation_context=None):
        """
        Creates a CalculationSet in the datastore and returns a corresponding
        CalculationSet instance.

        Must be implemented by concrete classes.

        :param instrument_version:
            the InstrumentVersion the CalculationSet is an implementation of
        :type instrument_version: InstrumentVersion
        :param definition: the Common Instrument Definition for the version
        :type definition: dict or JSON/YAML-encoded string
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the CalculationSet in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: CalculationSet
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('calculationset')

    def __init__(
            self,
            uid,
            instrument_version,
            definition):
        self._uid = to_unicode(uid)
        if not isinstance(instrument_version, (InstrumentVersion, str)):
            raise ValueError(
                'instrument_version must be an instance of InstrumentVersion'
                ' or a UID of one'
            )
        self._instrument_version = instrument_version
        if isinstance(definition, str):
            self._definition = AnyVal().parse(definition)
        else:
            self._definition = deepcopy(definition)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this CalculationSet in the
        datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def instrument_version(self):
        """
        The InstrumentVersion that this CalculationSet is in response to. Read
        only.

        :rtype: InstrumentVersion
        """

        if isinstance(self._instrument_version, str):
            iv_impl = get_implementation('instrumentversion')
            return iv_impl.get_by_uid(self._instrument_version)
        else:
            return self._instrument_version

    @property
    def definition(self):
        """
        The Common CalculationSet Definition of this CalculationSet.

        :rtype: dict
        """

        return self._definition

    @definition.setter
    def definition(self, value):
        self._definition = deepcopy(value)

    @property
    def definition_json(self):
        """
        The Common CalculationSet Definition of this CalculationSet.

        :rtype: JSON-encoded string
        """

        return dump_calculationset_json(self._definition)

    @definition_json.setter
    def definition_json(self, value):
        self.definition = AnyVal().parse(value)

    @property
    def definition_yaml(self):
        """
        The Common Instrument Definition of this Instrument.

        :rtype: YAML-encoded string
        """

        return dump_calculationset_yaml(self._definition)

    @definition_yaml.setter
    def definition_yaml(self, value):
        self.definition = AnyVal().parse(value)

    def validate(self, instrument_definition=None):
        """
        Validates that this CalculationSet is a legal CalculationSet
        Definition.

        :param instrument_definition:
            the Common Instrument Definition that the CalculationSet should
            be validated for; if not specified, the definition found on the
            InstrumentVersion associated with this CalculationSet will be used
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the Form fails any of the requirements
        """

        if (not instrument_definition) and self.instrument_version:
            instrument_definition = self.instrument_version.definition

        return self.__class__.validate_definition(
            self.definition,
            instrument_definition=instrument_definition,
        )

    def save(self, implementation_context=None):
        """
        Persists the CalculationSet into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the CalculatioNSet in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def execute(self, assessment):
        """
        Performs the calculations described in the definition upon the
        specified Assessment and returns the resulting values.

        :param assessment:
            the completed Assessment to perform the calculations on
        :type assessment: Assessment
        :rtype: dict
        """

        if not assessment.is_done:
            raise InstrumentError(
                'Assessments must be complete in order to execute calculations'
            )

        results = {}
        for calculation in self.definition['calculations']:
            with guard('While executing calculation:', calculation['id']):
                method = CalculationMethod.mapped()[calculation['method']]()
                scope_additions = CalculationScopeAddon.get_addon_scope(
                    method=method.name,
                    assessment=assessment,
                )
                result = method(
                    calculation['options'],
                    assessment,
                    results,
                    scope_additions,
                )
                result = coerce_instrument_type(result, calculation['type'])
                results[calculation['id']] = result
        return results

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return to_unicode(self.uid)

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.instrument_version,
        )

