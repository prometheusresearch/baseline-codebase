#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .extension import Extension
from .context import get_rex
from .cache import cached
from .package import get_packages
from .validate import BoolVal
from .error import Error
import textwrap
import yaml


class Setting(Extension):
    """
    Interface for configuration parameters.

    To add a new configuration parameter, create a subclass of :class:`Setting` and
    set the :attr:`name` attribute.
    """

    #: The name of the setting.
    name = None

    def validate(self, value):
        """
        Validates and normalizes the setting value.

        Implementations are expected either to override this method or to assign
        an instance of :class:`Validate` to attribute :attr:`validate`.
        """
        return value

    def default(self):
        """
        Returns the default value of the function.

        Unless overridden by the implementation, this method raises an error.
        For optional settings, implementations must either override this method
        or assign the default value to attribute :attr:`default`.
        """
        raise Error("Missing mandatory setting:", self.name)

    @classmethod
    def sanitize(cls):
        # All settings must have a description.
        if cls.name is not None:
            assert cls.__doc__ is not None and cls.__doc__.strip() != "", \
                    "undocumented setting: %s" % cls.name

    @classmethod
    def help(cls):
        """
        Describes the setting.

        The description is taken from the docstring of the setting class.
        """
        return textwrap.dedent(cls.__doc__).strip()

    @classmethod
    def enabled(cls):
        # If `name` is not set, must be the interface or a mixin class.
        return (cls.name is not None)

    @classmethod
    @cached
    def map_all(cls):
        """
        Returns a dictionary that maps setting names to setting types.
        """
        return dict((setting.name, setting) for setting in cls.all())

    UNSET = object()
    def __call__(self, value=UNSET):
        # No explicit setting value was provided.
        if value is self.UNSET:
            if callable(self.default):
                return self.default()
            else:
                return self.default

        # A setting value was provided.  Process it.
        try:
            return self.validate(value)
        except Error, error:
            error.wrap("While validating setting:", self.name)
            raise


class DebugSetting(Setting):
    """
    Turn on debug mode.
    """

    name = 'debug'
    default = False
    validate = BoolVal()


class SettingCollection(object):
    """
    Application configuration.

    Each setting is represented as an attribute in the
    :class:`SettingCollection` instance.
    """

    __slots__ = ()

    @classmethod
    def build(cls):
        # Mapping from the setting name to the setting type.
        setting_map = Setting.map_all()

        # Setting values.
        parameters = {}

        # Load values from `settings.yaml` files.  Respect package dependencies.
        for package in reversed(get_packages()):
            if package.exists('settings.yaml'):
                stream = package.open('settings.yaml')
                try:
                    package_parameters = yaml.safe_load(stream)
                except yaml.YAMLError, error:
                    raise Error("Failed to parse settings file:", str(error))
                stream.close()
                if package_parameters is None:
                    continue
                if not isinstance(package_parameters, dict):
                    raise Error("Got ill-formed settings file:",
                                package.abspath('settings.yaml'))
                for name in sorted(package_parameters):
                    if name not in setting_map:
                        error = Error("Got unknown setting:", name)
                        error.wrap("In", package.abspath('settings.yaml'))
                        raise error
                parameters.update(package_parameters)

        # Load values passed to the application constructor.
        local_parameters = get_rex().parameters
        for name in sorted(local_parameters):
            if name not in setting_map:
                raise Error("Got unknown setting:", name)
        parameters.update(local_parameters)

        # Process raw values.
        for name in sorted(setting_map):
            setting = setting_map[name]()
            if name in parameters:
                parameters[name] = setting(parameters[name])
            else:
                parameters[name] = setting()

        # Generate the collection object.
        name = cls.__name__
        bases = (cls,)
        members = {
                '__slots__': tuple(sorted(parameters)),
        }
        collection_type = type(name, bases, members)
        return collection_type(**parameters)

    def __init__(self, **parameters):
        for name in parameters:
            setattr(self, name, parameters[name])

    def __repr__(self):
        args = ["%s=%r" % (slot, getattr(self, slot))
                for slot in self.__slots__]
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


@cached
def get_settings():
    """
    Returns configuration of the active application.
    """
    return SettingCollection.build()


