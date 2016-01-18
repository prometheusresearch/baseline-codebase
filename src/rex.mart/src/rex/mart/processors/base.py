#
# Copyright (c) 2015, Prometheus Research, LLC
#


from copy import deepcopy

from rex.core import Extension, Error, guard


__all__ = (
    'Processor',
)


class RequiredType(object):
    pass

REQUIRED = RequiredType()


class Processor(Extension):
    """
    An extension that allows developers to write code that can be executed
    upon a Mart during the last phase of its creation.
    """

    #: The identifier of this Processor that configurations will use to invoke
    #: it.
    name = None

    #: The options that this Processor accepts. This is a list of tuples that
    #: take the form of ``('option_name', Validator())``
    #: or, if the option is not required
    #: ``('option_name', Validator(), 'default value')``
    options = ()

    @classmethod
    def sanitize(cls):
        for option in cls.options:
            if len(option) not in (2, 3):
                raise Error('Invalid Processor Option', option)
            if not isinstance(option[0], basestring):
                raise Error('Option name must be a string', option[0])
            if not callable(option[1]):
                raise Error('Option validator must be callable', option[1])

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def validate_options(cls, options):
        validated = {}
        options = deepcopy(options)

        for option in cls.options:
            if len(option) == 3:
                name, validator, default = option
            else:
                name, validator = option
                default = REQUIRED

            if name in options:
                with guard('While validating field:', name):
                    value = validator(options.pop(name))
            elif default is not REQUIRED:
                value = deepcopy(default)
            else:
                raise Error('Missing Processor Option', name)

            validated[name] = value

        if options.keys():
            raise Error(
                'Unknown Processor Options',
                ', '.join(options.keys()),
            )

        return validated

    def __call__(self, options, interface):
        self.execute(options, interface)

    def execute(self, options, interface):
        """
        Executes the functionality provided by this Processor.

        :param options: the options as defined in the Mart Definition
        :type options: dict
        :param interface:
            a proxy object that provides a basic API to interact with the Mart
            that is being created
        :type interface: ProcessorInterface
        """

        raise NotImplementedError()

