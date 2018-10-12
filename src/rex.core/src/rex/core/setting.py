#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from .extension import Extension
from .context import get_rex
from .cache import cached
from .package import get_packages
from .validate import BoolVal, StrVal, MapVal
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

    def merge(self, old_value, new_value):
        """
        Merges setting values from different sources.

        This function takes two values from two different sources and returns
        a merged value.

        By default, returns `new_value`.  If the value of a setting is expected
        to be a dictionary or a list, an application may override this method
        to merge the containers.  Note that values passed to this function are
        not yet validated.
        """
        return new_value

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
    def signature(cls):
        # For `mapped()`.
        return cls.name

    @classmethod
    def map_all(cls):
        # Deprecated.
        return cls.mapped()

    def __call__(self, values):
        # No explicit setting values were provided.
        if not values:
            if callable(self.default):
                return self.default()
            else:
                return self.default

        # One of more setting value were provided.  Merge and process them.
        value = values[0]
        for new_value in values[1:]:
            value = self.merge(value, new_value)
        try:
            return self.validate(value)
        except Error as error:
            error.wrap("While validating setting:", self.name)
            raise


class DebugSetting(Setting):
    """
    Turn on the debug mode.
    """

    name = 'debug'
    default = False
    validate = BoolVal()


class SettingCollection:
    """
    Application configuration.

    Each setting is represented as an attribute in the
    :class:`SettingCollection` instance.
    """

    __slots__ = ()

    validate = MapVal(StrVal)

    @classmethod
    def build(cls):
        # Mapping from the setting name to the setting type.
        setting_map = Setting.mapped()

        # Setting values from different sources.
        sources = []

        # Load values from `settings.yaml` files.  Respect package dependencies.
        for package in reversed(get_packages()):
            if package.exists('settings.yaml'):
                stream = package.open('settings.yaml')
                package_parameters = cls.validate.parse(stream)
                stream.close()
                for name in sorted(package_parameters):
                    if name not in setting_map:
                        error = Error("Got unknown setting:", name)
                        error.wrap("In", package.abspath('settings.yaml'))
                        raise error
                sources.append(package_parameters)

        # Load values passed to the application constructor.
        local_parameters = get_rex().parameters
        for name in sorted(local_parameters):
            if name not in setting_map:
                raise Error("Got unknown setting:", name)
        sources.append(local_parameters)

        # Process raw values.
        parameters = {}
        for name in sorted(setting_map):
            setting = setting_map[name]()
            values = [source[name] for source in sources if name in source]
            # Merge and validate values.
            parameters[name] = setting(values)

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


