#
# Copyright (c) 2014, Prometheus Research, LLC
#


from copy import deepcopy

from rios.core import validate_form, \
    ValidationError as RiosValidationError
from rex.core import Extension, AnyVal
from rex.instrument import InstrumentVersion, Channel, Task
from rex.instrument.mixins import Comparable, Displayable, Dictable, \
    ImplementationContextable
from rex.instrument.util import to_unicode, memoized_property, \
    get_implementation

from .presentation_adaptor import PresentationAdaptor
from ..errors import ValidationError
from ..output import dump_form_yaml, dump_form_json


__all__ = (
    'Form',
)


class Form(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents a Form Configuration for a Channel of an InstrumentVersion.
    """

    dict_properties = (
        'channel',
        'instrument_version',
    )

    @classmethod
    def validate_configuration(cls, configuration, instrument_definition=None):
        """
        Validates that the specified configuration is a legal Web Form
        Configuration.

        :param configuration: the Form configuration to validate
        :type configuration: string or dict
        :param instrument_definition:
            the Common Instrument Definition that the Form should be validated
            against
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the specified configuration fails any of the
            requirements
        """

        if isinstance(configuration, basestring):
            try:
                configuration = AnyVal().parse(configuration)
            except ValueError as exc:
                raise ValidationError(
                    'Invalid JSON provided: %s' % unicode(exc)
                )
        if not isinstance(configuration, dict):
            raise ValidationError(
                'Form Configurations must be mapped objects.'
            )

        if instrument_definition:
            if isinstance(instrument_definition, basestring):
                try:
                    instrument_definition = AnyVal().parse(
                        instrument_definition
                    )
                except ValueError as exc:
                    raise ValidationError(
                        'Invalid Instrument JSON provided: %s' % unicode(exc)
                    )
            if not isinstance(instrument_definition, dict):
                raise ValidationError(
                    'Instrument Definitions must be mapped objects.'
                )

        try:
            validate_form(configuration, instrument=instrument_definition)
        except RiosValidationError as exc:
            msg = [
                'The following problems were encountered when validating this'
                ' Form:',
            ]
            for key, details in exc.asdict().items():
                msg.append('%s: %s' % (
                    key or '<root>',
                    details,
                ))
            raise ValidationError('\n'.join(msg))

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves a Form from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Form to retrieve
        :type uid: string
        :param user: the User who should have access to the desired Form
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Form; None if the specified UID does not exist
        :rtype: Form
        """

        raise NotImplementedError()

    @classmethod
    def get_for_task(cls, task, channel, user=None):
        """
        Returns the Form to use for the specified combination of Task and
        Channel.

        :param task:
            the Task or UID of a Task that the Form needs to operate on
        :type task: Task/str
        :param channel:
            the Channel or UID of a Channel that the Form must be configured
            for
        :type channel: Channel/str
        :param user: the User who should have access to the desired Form
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: Form
        """

        if not isinstance(task, Task):
            task = Task.get_implementation().get_by_uid(task)
            if not task:
                 return None

        forms = cls.find(
            channel=channel,
            instrument_version=task.instrument_version,
            user=user,
            limit=1,
        )
        if forms:
            return forms[0]

        return None

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns Forms that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * channel (UID or instance; exact matches)
        * instrument_version (UID or instance; exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Forms to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of Forms to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means no
            limit
        :type limit: int
        :param user: the User who should have access to the desired Form
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Forms
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            channel,
            instrument_version,
            configuration,
            implementation_context=None):
        """
        Creates a Form in the datastore and returns a corresponding
        Form instance.

        Must be implemented by concrete classes.

        :param channel: the Channel the Form will belong to
        :type channel: Channel
        :param instrument_version:
            the InstrumentVersion the Form is an implementation of
        :type instrument_version: InstrumentVersion
        :param configuration: the JSON Web Form Configuration for the Form
        :type configuration: dict or JSON string
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the Form in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Form
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('form', package_name='forms')

    def __init__(self, uid, channel, instrument_version, configuration):
        self._uid = to_unicode(uid)

        if not isinstance(channel, (Channel, basestring)):
            raise ValueError(
                'channel must be an instance of Channel or a UID of one'
            )
        self._channel = channel

        if not isinstance(instrument_version, (InstrumentVersion, basestring)):
            raise ValueError(
                'instrument_version must be an instance of InstrumentVersion'
                ' or a UID of one'
            )
        self._instrument_version = instrument_version

        if isinstance(configuration, basestring):
            self._configuration = AnyVal().parse(configuration)
        else:
            self._configuration = deepcopy(configuration)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Form in the datastore. Read
        only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def channel(self):
        """
        The Channel that this Form belongs to. Read only.

        :rtype: Channel
        """

        if isinstance(self._channel, basestring):
            channel_impl = get_implementation('channel')
            return channel_impl.get_by_uid(self._channel)
        else:
            return self._channel

    @memoized_property
    def instrument_version(self):
        """
        The InstrumentVersion that this Form is an implementation of. Read
        only.

        :rtype: InstrumentVersion
        """

        if isinstance(self._instrument_version, basestring):
            iv_impl = get_implementation('instrumentversion')
            return iv_impl.get_by_uid(self._instrument_version)
        else:
            return self._instrument_version

    @property
    def configuration(self):
        """
        The Web Form Configuration of this Form.

        :rtype: dict
        """

        return self._configuration

    @configuration.setter
    def configuration(self, value):
        self._configuration = deepcopy(value)

    @property
    def configuration_json(self):
        """
        The Web Form Configuration of this Form.

        :rtype: JSON-encoded string
        """

        return dump_form_json(self._configuration)

    @configuration_json.setter
    def configuration_json(self, value):
        self.configuration = AnyVal().parse(value)

    @property
    def configuration_yaml(self):
        """
        The Web Form Configuration of this Form.

        :rtype: YAML-encoded string
        """

        return dump_form_yaml(self._configuration)

    @configuration_yaml.setter
    def configuration_yaml(self, value):
        self.configuration = AnyVal().parse(value)

    @property
    def adapted_configuration(self):
        """
        The Web Form Configuration of this Form, as modified by the
        PresentationAdaptors configured for the Channel associated with this
        Form. Read only.

        :rtype: dict
        """

        return PresentationAdaptor.adapt_form(
            self.channel,
            self.instrument_version.definition,
            self.configuration,
        )

    @property
    def adapted_configuration_json(self):
        """
        The Web Form Configuration of this Form, as modified by the
        PresentationAdaptors configured for the Channel associated with this
        Form. Read only.

        :rtype: JSON-encoded string
        """

        return dump_form_json(self.adapted_configuration)

    @property
    def adapted_configuration_yaml(self):
        """
        The Web Form Configuration of this Form, as modified by the
        PresentationAdaptors configured for the Channel associated with this
        Form. Read only.

        :rtype: YAML-encoded string
        """

        return dump_form_yaml(self.adapted_configuration)

    def validate(self, instrument_definition=None):
        """
        Validates that this Form is a legal Web Form Configuration.

        :param instrument_definition:
            the Common Instrument Definition that the Form should be validated
            against; if not specified, the definition found on the
            InstrumentVersion associated with this Form will be used
        :type instrument_definition: dict or JSON string
        :raises:
            ValidationError if the Form fails any of the requirements
        """

        if (not instrument_definition) and self.instrument_version:
            instrument_definition = self.instrument_version.definition

        return self.__class__.validate_configuration(
            self.configuration,
            instrument_definition=instrument_definition,
        )

    def save(self, implementation_context=None):
        """
        Persists the Form into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the Form in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def get_display_name(self, locale=None):
        """
        Returns a unicode string that represents this Form, suitable for use
        in human-visible places.

        :param locale:
            the locale of title to retrieve; if not specified, or if the
            specified locale is not defined in the configuration, then the
            ``defaultLocalization`` in the configuration will be used
        :type locale: string
        :rtype: unicode
        """

        if self.configuration and 'title' in self.configuration:
            locale = str(locale)
            if locale not in self.configuration['title']:
                locale = self.configuration['defaultLocalization']
            return to_unicode(self.configuration['title'][locale])
        else:
            return unicode(self.instrument_version)

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.channel,
            self.instrument_version,
        )

