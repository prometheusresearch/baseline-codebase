#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from collections import Counter
from copy import deepcopy

import jsonschema

from rex.core import Extension
from rex.instrument.interface import InstrumentVersion
from rex.instrument.mixins import Comparable, Displayable, Dictable
from rex.instrument.util import to_unicode, memoized_property, \
    get_implementation

from .channel import Channel
from ..errors import ValidationError
from ..schema import FORM_SCHEMA, FORM_ELEMENT_OPTIONS, FORM_ELEMENT_REQUIRED


__all__ = (
    'Form',
)


class Form(Extension, Comparable, Displayable, Dictable):
    """
    Represents a Form Configuration for a Channel of an InstrumentVersion.
    """

    dict_properties = (
        'channel',
        'instrument_version',
    )

    @classmethod
    def _validate_instrument_specifics(cls, configuration, instrument):
        all_fields = set([field['id'] for field in instrument['record']])
        unprompted = set(configuration.get('unprompted', {}).keys())
        on_pages = set()
        for page in configuration['pages']:
            for element in page['elements']:
                if element['type'] == 'question':
                    fid = element['options']['fieldId']
                    if fid in on_pages:
                        raise ValidationError(
                            'Field "%s" is used by multiple questions' % (
                                fid,
                            )
                        )
                    else:
                        on_pages.add(fid)
        on_pages = set(on_pages)

        missing = all_fields - (unprompted | on_pages)
        if missing:
            raise ValidationError(
                'There are fields which have not be used: %s' % (
                    ', '.join(missing),
                )
            )

        extra = (unprompted | on_pages) - all_fields
        if extra:
            raise ValidationError(
                'There are fields that are not in the Instrument: %s' % (
                    ', '.join(extra),
                )
            )

        # TODO ensure enumerationIDs are legit
        # TODO ensure records and matrices have all subfields addressed

    @classmethod
    def _validate_pages(cls, configuration):
        all_page_ids = [page['id'] for page in configuration['pages']]
        repeated_page_ids = [
            pid
            for pid, cnt in Counter(all_page_ids).items()
            if cnt > 1
        ]
        if repeated_page_ids:
            raise ValidationError(
                'Page identifiers are used multiple times: %s' % (
                    ', '.join(repeated_page_ids),
                )
            )

    @classmethod
    def _validate_localizations(cls, configuration):
        def ensure_localization(obj, key, label):
            if key not in obj:
                return

            if configuration['defaultLocalization'] not in obj[key]:
                raise ValidationError(
                    '%(label)s %(key)s missing localization for %(lang)s' % {
                        'label': label,
                        'key': key,
                        'lang': configuration['defaultLocalization'],
                    }
                )

        ensure_localization(configuration, 'title', 'Form')

        for page in configuration['pages']:
            for element in page['elements']:
                options = element.get('options', {})
                ensure_localization(options, 'text', 'Element')
                ensure_localization(options, 'help', 'Element')
                ensure_localization(options, 'error', 'Element')

                for enumeration in options.get('enumerations', []):
                    ensure_localization(enumeration, 'text', 'Enumeration')
                    ensure_localization(enumeration, 'help', 'Enumeration')

    @classmethod
    def _validate_element_options(cls, configuration):
        for page in configuration['pages']:
            for element in page['elements']:
                options = set(element.get('options', {}).keys())
                extra = options - FORM_ELEMENT_OPTIONS[element['type']]
                if extra:
                    raise ValidationError(
                        '"%(type)s" Element cannot have options:'
                        ' %(options)s' % {
                            'type': element['type'],
                            'options': ', '.join(extra),
                        }
                    )
                missing = FORM_ELEMENT_REQUIRED[element['type']] - options
                if missing:
                    raise ValidationError(
                        '"%(type)s" Element missing required options:'
                        ' %(options)s' % {
                            'type': element['type'],
                            'options': ', '.join(missing),
                        }
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
                configuration = json.loads(configuration)
            except ValueError as exc:
                raise ValidationError(
                    'Invalid JSON provided: %s' % unicode(exc)
                )
        if not isinstance(configuration, dict):
            raise ValidationError(
                'Form Configurations must be mapped objects.'
            )

        # Make sure it validates against the schema.
        try:
            jsonschema.validate(configuration, FORM_SCHEMA)
        except jsonschema.ValidationError as ex:
            raise ValidationError(ex.message)

        # Make sure page IDs are unique.
        cls._validate_pages(configuration)

        # Make sure everything has the defaultLocalization.
        cls._validate_localizations(configuration)

        # Make sure elements have appropriate options.
        cls._validate_element_options(configuration)

        # If we have an Instrument definition to validate against, do so.
        if instrument_definition:
            if isinstance(instrument_definition, basestring):
                try:
                    instrument_definition = json.loads(instrument_definition)
                except ValueError as exc:
                    raise ValidationError(
                        'Invalid Instrument JSON provided: %s' % unicode(exc)
                    )
            if not isinstance(instrument_definition, dict):
                raise ValidationError(
                    'Instrument Definitions must be mapped objects.'
                )
            cls._validate_instrument_specifics(
                configuration,
                instrument_definition,
            )

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
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        """
        Returns Forms that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * channel (UID or instance; exact matches)
        * instrument_version (UID or instance; exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Forms to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Forms to return (useful for pagination
            purposes)
        :type limit: int
        :param user: the User who should have access to the desired Form
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Forms
        """

        raise NotImplementedError()

    @classmethod
    def create(cls, channel, instrument_version, configuration):
        """
        Creates a Form in the datastore and returns a corresponding
        Form instance.

        Must be implemented by concrete classes.

        :param channel:
            the Channel the Form will belong to
        :type channel: Channel
        :param instrument_version:
            the InstrumentVersion the Form is an implementation of
        :type instrument_version: InstrumentVersion
        :param configuration: the JSON Web Form Configuration for the Form
        :type configuration: dict or JSON string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Form
        """

        raise NotImplementedError()

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
            self._configuration = json.loads(configuration)
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
            channel_impl = get_implementation('channel', package_name='forms')
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

        return json.dumps(self._configuration, ensure_ascii=False)

    @configuration_json.setter
    def configuration_json(self, value):
        self.configuration = json.loads(value)

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

    def save(self):
        """
        Persists the Form into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    # pylint: disable=W0221
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

