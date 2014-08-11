#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from copy import deepcopy

from rex.core import Extension, get_settings
from rex.instrument.interface import DraftInstrumentVersion
from rex.instrument.mixins import Comparable, Displayable, Dictable
from rex.instrument.util import to_unicode, memoized_property

from .channel import Channel


__all__ = (
    'DraftForm',
)


class DraftForm(Extension, Comparable, Displayable, Dictable):
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

        form_impl = get_settings().forms_implementation.form
        form_impl.validate_configuration(
            configuration,
            instrument_definition=instrument_definition,
        )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a DraftForm from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the DraftForm to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified DraftForm; None if the specified UID does not exist
        :rtype: DraftForm
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns DraftForms that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * channel (UID or instance; exact matches)
        * draft_instrument_version (UID or instance; exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of DraftForms to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of DraftForms to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of DraftForms
        """

        raise NotImplementedError()

    @classmethod
    def create(cls, channel, draft_instrument_version, configuration):
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
        :param configuration: the JSON Web Form Configuration for the Form
        :type configuration: dict or JSON string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: DraftForm
        """

        raise NotImplementedError()

    def __init__(self, uid, channel, draft_instrument_version, configuration):
        self._uid = to_unicode(uid)

        if not isinstance(channel, (Channel, basestring)):
            raise ValueError(
                'channel must be an instance of Channel or a UID of one'
            )
        self._channel = channel

        if not isinstance(
                draft_instrument_version,
                (DraftInstrumentVersion, basestring)):
            raise ValueError(
                'draft_instrument_version must be an instance of'
                ' DraftInstrumentVersion or a UID of one'
            )
        self._draft_instrument_version = draft_instrument_version

        if isinstance(configuration, basestring):
            self._configuration = json.loads(configuration)
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

        if isinstance(self._channel, basestring):
            channel_impl = get_settings().forms_implementation.channel
            return channel_impl.get_by_uid(self._channel)
        else:
            return self._channel

    @memoized_property
    def draft_instrument_version(self):
        """
        The DraftInstrumentVersion that this DraftForm is an implementation of.
        Read only.

        :rtype: DraftInstrumentVersion
        """

        if isinstance(self._draft_instrument_version, basestring):
            div_impl = \
                get_settings().instrument_implementation.draftinstrumentversion
            return div_impl.get_by_uid(self._draft_instrument_version)
        else:
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
            return json.dumps(self._configuration, ensure_ascii=False)
        return None

    @configuration_json.setter
    def configuration_json(self, value):
        self.configuration = json.loads(value)

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

    def save(self):
        """
        Persists the DraftForm into the datastore.

        Must be implemented by concrete classes.

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

    def publish(self, instrument_version):
        """
        Publishes this draft as the Form for the specified instrument_version.

        :param instrument_version:
            the InstrumentVersion to associate the Form with
        :type instrument_version: InstrumentVersion
        :raises:
            DataStoreError if there was an error writing to the datastore
        :returns: the Form that results from the publishing
        """

        form_impl = get_settings().forms_implementation.form

        form = form_impl.create(
            self.channel,
            instrument_version,
            self.configuration,
        )

        return form

    # pylint: disable=W0221
    def get_display_name(self, locale=None):
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
            return unicode(self.draft_instrument_version)

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.channel,
            self.draft_instrument_version,
        )

