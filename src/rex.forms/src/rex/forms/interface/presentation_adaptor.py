#
# Copyright (c) 2015, Prometheus Research, LLC
#


from copy import deepcopy

from rex.core import Extension, get_settings, AnyVal


__all__ = (
    'PresentationAdaptor',
)


class PresentationAdaptor(Extension):
    """
    Provides an interface to implement logic that can modify a Web Form
    Configuration during runtime.
    """

    name = None

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'PresentationAdaptor':
            assert cls.adapt != PresentationAdaptor.adapt,\
                'abstract method %s.adapt()' % cls

    @classmethod
    def adapt_form(cls, channel, instrument, configuration):
        """
        Executes the configured PresentationAdaptors for the specified channel
        against the provided Web Form Configuration. The adaptors used are
        defined by the ``forms_presentation_adaptors`` setting.

        :param channel: the Channel to adapt the Form for
        :type channel: Channel or string
        :param instrument: the Instrument Definition associated with the Form
        :type instrument: dict or JSON/YAML-encoded string
        :param configuration: the Web Form Configuration to adapt
        :type configuration: dict or JSON/YAML-encoded string
        :rtype: dict
        """

        if not isinstance(channel, str):
            channel = channel.uid

        if not isinstance(instrument, dict):
            instrument = AnyVal().parse(instrument)

        if not isinstance(configuration, dict):
            configuration = AnyVal().parse(configuration)
        configuration = deepcopy(configuration)

        channel_adaptors = get_settings().forms_presentation_adaptors.get(
            channel,
            [],
        )

        for name in channel_adaptors:
            adaptor = cls.mapped()[name]
            configuration = adaptor.adapt(instrument, configuration)

        return configuration

    @classmethod
    def adapt(cls, instrument, configuration):
        """
        Modifies the given Web Form Configuration and returns that updated
        configuration.

        Must be implemented by concrete classes.

        :param instrument: the Instrument Definition associated with the Form
        :type instrument: dict
        :param configuration: the Web Form Configuration to adapt
        :type configuration: dict
        :rtype: dict
        """

        raise NotImplementedError()

