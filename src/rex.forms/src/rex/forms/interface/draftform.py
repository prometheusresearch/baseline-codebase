#
# Copyright (c) 2014, Prometheus Research, LLC
#


from copy import deepcopy

from rex.core import Extension, AnyVal
from rex.instrument.interface import DraftInstrumentVersion, Channel
from rex.instrument.mixins import Comparable, Displayable, Dictable, \
    ImplementationContextable
from rex.instrument.util import to_unicode, memoized_property, \
    get_implementation

from .presentation_adaptor import PresentationAdaptor
from ..output import dump_form_yaml, dump_form_json


__all__ = (
    'DraftForm',
)


class DraftForm(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents a Form Configuration that has not yet been published for use in
    the system.
    """

    dict_properties = (
        'draft_instrument_version',
        'channel',
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
        :type instrument_definition: string or dict
        :raises:
            ValidationError if the specified configuration fails any of the
            requirements
        """

        form_impl = get_implementation('form', package_name='forms')
        form_impl.validate_configuration(
            configuration,
            instrument_definition=instrument_definition,
        )

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves a DraftForm from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the DraftForm to retrieve
        :type uid: string
        :param user: the User who should have access to the desired DraftForm
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified DraftForm; None if the specified UID does not exist
        :rtype: DraftForm
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns DraftForms that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * channel (UID or instance; exact matches)
        * draft_instrument_version (UID or instance; exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of DraftForms to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of DraftForms to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means no
            limit
        :type limit: int
        :param user: the User who should have access to the desired DraftForms
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of DraftForms
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            channel,
            draft_instrument_version,
            configuration=None,
            implementation_context=None):
        """
        Creates a DraftForm in the datastore and returns a corresponding
        DraftForm instance.

        Must be implemented by concrete classes.

        :param channel:
            the Channel the DraftForm will belong to
        :type channel: Channel
        :param draft_instrument_version:
            the DraftInstrumentVersion the DraftForm is an implementation of
        :type draft_instrument_version: DraftInstrumentVersion
        :param configuration: the Web Form Configuration for the Form
        :type configuration: dict or JSON/YAML string
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the DraftForm in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: DraftForm
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('draftform', package_name='forms')

    def __init__(self, uid, channel, draft_instrument_version, configuration):
        self._uid = to_unicode(uid)

        if not isinstance(channel, (Channel, str)):
            raise ValueError(
                'channel must be an instance of Channel or a UID of one'
            )
        self._channel = channel

        if not isinstance(
                draft_instrument_version,
                (DraftInstrumentVersion, str)):
            raise ValueError(
                'draft_instrument_version must be an instance of'
                ' DraftInstrumentVersion or a UID of one'
            )
        self._draft_instrument_version = draft_instrument_version

        if isinstance(configuration, str):
            self._configuration = AnyVal().parse(configuration)
        else:
            self._configuration = deepcopy(configuration)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this DraftForm in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def channel(self):
        """
        The Channel that this DraftForm belongs to. Read only.

        :rtype: Channel
        """

        if isinstance(self._channel, str):
            channel_impl = get_implementation('channel')
            return channel_impl.get_by_uid(self._channel)
        return self._channel

    @memoized_property
    def draft_instrument_version(self):
        """
        The DraftInstrumentVersion that this DraftForm is an implementation of.
        Read only.

        :rtype: DraftInstrumentVersion
        """

        if isinstance(self._draft_instrument_version, str):
            div_impl = get_implementation('draftinstrumentversion')
            return div_impl.get_by_uid(self._draft_instrument_version)
        return self._draft_instrument_version

    @property
    def configuration(self):
        """
        The Web Form Configuration of this DraftForm.

        :rtype: dict
        """

        return self._configuration

    @configuration.setter
    def configuration(self, value):
        self._configuration = deepcopy(value)

    @property
    def configuration_json(self):
        """
        The Web Form Configuration of this DraftForm.

        :rtype: JSON-encoded string
        """

        if self._configuration:
            return dump_form_json(self._configuration)
        return None

    @configuration_json.setter
    def configuration_json(self, value):
        self.configuration = AnyVal().parse(value)

    @property
    def configuration_yaml(self):
        """
        The Web Form Configuration of this DraftForm.

        :rtype: YAML-encoded string
        """

        if self._configuration:
            return dump_form_yaml(self._configuration)
        return None

    @configuration_yaml.setter
    def configuration_yaml(self, value):
        self.configuration = AnyVal().parse(value)

    @property
    def adapted_configuration(self):
        """
        The Web Form Configuration of this DraftForm, as modified by the
        PresentationAdaptors configured for the Channel associated with this
        DraftForm. Read only.

        :rtype: dict
        """

        if self.configuration:
            return PresentationAdaptor.adapt_form(
                self.channel,
                self.draft_instrument_version.definition,
                self.configuration,
            )
        return None

    @property
    def adapted_configuration_json(self):
        """
        The Web Form Configuration of this DraftForm, as modified by the
        PresentationAdaptors configured for the Channel associated with this
        DraftForm. Read only.

        :rtype: JSON-encoded string
        """

        return dump_form_json(self.adapted_configuration)

    @property
    def adapted_configuration_yaml(self):
        """
        The Web Form Configuration of this DraftForm, as modified by the
        PresentationAdaptors configured for the Channel associated with this
        DraftForm. Read only.

        :rtype: YAML-encoded string
        """

        return dump_form_yaml(self.adapted_configuration)

    def validate(self, instrument_definition=None):
        """
        Validates that this DraftForm is a legal Web Form Configuration.

        :param instrument_definition:
            the Common Instrument Definition that the Form should be validated
            against; if not specified, the definition found on the
            DraftInstrumentVersion associated with this DraftFrom will be used
        :type instrument_definition: string or dict
        :raises:
            ValidationError if the Form fails any of the requirements
        """

        if (not instrument_definition) and self.draft_instrument_version:
            instrument_definition = self.draft_instrument_version.definition

        return self.__class__.validate_configuration(
            self.configuration,
            instrument_definition=instrument_definition,
        )

    def save(self, implementation_context=None):
        """
        Persists the DraftForm into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the DraftForm in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def delete(self):
        """
        Removes this DraftForm from the datastore.

        Note: Once executed, this instance of DraftForm becomes invalid, and
        any attempts to ``save()``, ``delete()``, or ``publish()`` will fail
        horribly.

        Must be implemented by concreted classes

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def publish(self, instrument_version, form_implementation_context=None):
        """
        Publishes this draft as the Form for the specified instrument_version.

        :param instrument_version:
            the InstrumentVersion to associate the Form with
        :type instrument_version: InstrumentVersion
        :param form_implementation_context:
            the extra, implementation-specific variables necessary to create
            the published Form in the data store; if not specified, defaults to
            None
        :type form_implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :returns: the Form that results from the publishing
        """

        self.configuration['instrument']['id'] = \
            instrument_version.definition['id']
        self.configuration['instrument']['version'] = \
            instrument_version.definition['version']

        form_impl = get_implementation('form', package_name='forms')
        form = form_impl.create(
            self.channel,
            instrument_version,
            self.configuration,
            implementation_context=form_implementation_context,
        )

        return form

    def get_display_name(self, locale=None):  # noqa: arguments-differ
        """
        Returns a unicode string that represents this DraftForm, suitable for
        use in human-visible places.

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
            return str(self.draft_instrument_version)

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.channel,
            self.draft_instrument_version,
        )

