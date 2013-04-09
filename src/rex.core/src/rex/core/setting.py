#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .extension import Extension
from .context import active_app
from .cache import cached
import textwrap


class Setting(Extension):

    name = None

    default = None

    @classmethod
    def help(cls):
        if cls.__doc__ is None:
            return None
        doc = cls.__doc__.rstrip()
        if not doc:
            return None
        return textwrap.dedent(doc)

    @classmethod
    def enabled(cls):
        return (self.name is not None)

    @classmethod
    @cached
    def all_map(cls):
        return dict((setting.name, setting) for setting in cls.all())

    def validate(self, data):
        return data

    def __call__(self, value=None):
        if value is None:
            if callable(self.default):
                return self.default()
            else:
                return self.default
        try:
            return self.validate(value)
        except Error, error:
            error.wrap("While validating setting:", self.name)
            raise


class SettingCollection(object):

    __slots__ = ()

    @classmethod
    def build(cls, local_parameters):
        setting_map = Setting.all_map()
        parameters = {}

        for package in reversed(active_app.packages):
            if package.exists('settings.yaml'):
                stream = package.open('settings.yaml')
                package_parameters = yaml.safe_load(stream)
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

        for name in sorted(local_parameters):
            if name not in setting_map:
                raise Error("Got unknown setting:", name)
        parameters.update(local_parameters)

        for name in sorted(setting_map):
            setting = setting_map[name]()
            if name in parameters:
                parameters[name] = setting(parameters[name])
            else:
                parameters[name] = setting()

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


