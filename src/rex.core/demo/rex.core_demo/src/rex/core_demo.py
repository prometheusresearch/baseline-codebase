
from rex.core import Setting, StrVal
from rex.core import Extension, cached

class DemoFolderSetting(Setting):
    """Directory with demo data."""

    name = 'demo_folder'
    default = None
    validate = StrVal()

class Command(Extension):
    """Interface for named commands."""

    name = None

    @classmethod
    def sanitize(cls):
        assert cls.name is None or isinstance(cls.name, str)

    @classmethod
    def enabled(cls):
        return (cls.name is not None)

    @classmethod
    @cached
    def by_name(cls, name):
        command_types = [command_type for command_type in cls.all()
                                      if command_type.name == name]
        assert len(command_types) >= 1, \
                "command not found: %s" % name
        assert len(command_types) <= 1, \
                "duplicate command: %s" % name
        return command_types[0]

    def __init__(self):
        pass

    def __call__(self):
        raise NotImplementedError("%s.__call__()"
                                  % self.__class__.__name__)

class HelloCommand(Command):
    """Greets the World!"""

    name = 'hello'

    def __call__(self):
        return "Hello, World!"

