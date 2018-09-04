#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error, DocEntry, get_rex, get_packages, get_sentry
import sys
import os
import functools
import inspect
from cogs.core import (
        env, task, default_task, setting, argument, option, Failure,
        Environment, TaskSpec, SettingSpec, TopicSpec, ArgSpec, OptSpec,
        _to_name, _describe)
from cogs.fs import cp, mv, rm, rmtree, mktree, exe, sh, pipe
from cogs.log import (
        COLORS, colorize, log as cogs_log, debug, warn, fail, prompt)
from cogs.run import run, main


# Register `rex` script.
env.shell.set(
        name="Rex",
        description="""Command-line administration utility"""
                    """ for the RexDB platform""",
        local_package='rex.local',
        entry_point='rex.ctl',
        config_name='rex.yaml',
        config_dirs=[
            '/etc',
            os.path.join(sys.prefix, '/etc'),
            os.path.expanduser('~/.rex'),
            os.path.abspath('.')])


def _translate_value_error(fn):
    # Translates `rex.core.Error` to `ValueError` for Cogs validators.
    if fn is None:
        return None
    def wrapper(*args, **kwds):
        try:
            return fn(*args, **kwds)
        except Error as error:
            if not env.debug:
                raise ValueError('\n'+str(error))
            raise
    return wrapper


def main():
    """Loads configuration, parses parameters and executes a task."""
    with env():
        # Enable debugging early if we are certain it's turned on.
        debug_var = '%s_DEBUG' % env.shell.name.upper().replace('-', '_')
        if (os.environ.get(debug_var) in ['true', '1'] or
                (len(sys.argv) > 1 and sys.argv[1] == '--debug')):
            env.set(debug=True)
        # When `--debug` is on, show the full traceback.
        try:
            try:
                try:
                    run(sys.argv)
                except Exception:
                    # Submit the exception to Sentry.
                    exc_info = sys.exc_info()
                    try:
                        sentry = get_sentry(sync=True)
                        sentry.captureException(exc_info)
                    except:
                        pass
                    raise exc_info[0](exc_info[1]).with_traceback(exc_info[2])
            except (Error, IOError) as exc:
                if env.debug:
                    raise
                raise fail(str(exc))
        except (Failure, KeyboardInterrupt) as exc:
            if env.debug:
                raise
            return exc


class TaskMeta(type):
    # Registers the task with Cogs.

    def __new__(mcls, name, bases, members):
        cls = type.__new__(mcls, name, bases, members)
        if cls.name is not None:
            # Process arguments and options.
            args = []
            opts = []
            attrs = {}
            for C in reversed(cls.__mro__):
                attrs.update(C.__dict__)
                for container in ['arguments', 'options']:
                    if container in C.__dict__:
                        attrs.update(C.__dict__[container].__dict__)
            arg_attrs = []
            opt_attrs = []
            for attr in sorted(attrs):
                value = attrs[attr]
                if isinstance(value, argument):
                    arg_attrs.append((value.order, attr, value))
                if isinstance(value, option):
                    opt_attrs.append((value.order, attr, value))
            arg_attrs.sort()
            opt_attrs.sort()
            names = set()
            keys = set()
            for order, attr, dsc in arg_attrs:
                name = _to_name(attr)
                assert name not in names, \
                        "duplicate argument name: <%s>" % name
                names.add(name)
                check = _translate_value_error(dsc.check)
                default = dsc.default
                is_plural = dsc.plural
                is_optional = True
                if default is dsc.REQ:
                    is_optional = False
                    default = None
                spec = ArgSpec(
                        attr, name, check, default=default,
                        is_optional=is_optional, is_plural=is_plural)
                args.append(spec)
            for order, attr, dsc in opt_attrs:
                name = _to_name(attr)
                assert name not in names, \
                        "duplicate option name: --%s" % name
                names.add(name)
                key = dsc.key
                if key is not None:
                    assert key not in keys, \
                            "duplicate option name: -%s" % key
                    keys.add(key)
                check = _translate_value_error(dsc.check)
                default = dsc.default
                is_plural = dsc.plural
                has_value = True
                value_name = (dsc.value_name or name).upper()
                if default is dsc.NOVAL:
                    has_value = False
                    value_name = None
                    default = False
                hint = dsc.hint
                spec = OptSpec(
                        attr, name, key, check, default,
                        is_plural=is_plural, has_value=has_value,
                        value_name=value_name, hint=hint)
                opts.append(spec)

            # Extract the description.
            hint, help = _describe(cls)

            # Register the task.
            spec = TaskSpec(
                    cls.name, cls, args, opts, hint=hint, help=help)
            env.task_map[cls.name] = spec

        return cls


class Task(metaclass=TaskMeta):
    """
    Represents a ``rex`` task.

    To add a new ``rex`` task, create a subclass of :class:`rex.ctl.Task` and:

    - set the task name as the ``name`` class attribute;
    - add task arguments to the ``arguments`` container;
    - add task options to the ``options`` container;
    - implement this task as the :meth:`__call__()` method;
    - write task description as the class docstring.
    """

    #: Task name.
    name = None

    class arguments:
        """Container for task arguments."""

    class options:
        """Container for task options."""

    def __init__(self, **parameters):
        self.__dict__.update(parameters)

    def __call__(self):
        """
        Implements the task.

        Subclasses must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    @classmethod
    def document_all(cls, package=None):
        modules = None
        if get_rex:
            packages = get_packages()
            if package is None:
                modules = packages.modules
                modules['cogs.std'] = __import__('cogs.std')
            else:
                modules = packages[package].modules
        specs = []
        for name in sorted(env.task_map):
            if not name:
                continue
            spec = env.task_map[name]
            if modules is not None and spec.code.__module__ not in modules:
                continue
            specs.append(spec)
        specs.sort(key=(lambda s: s.name))
        return [cls.document_one(spec) for spec in specs]

    @classmethod
    def document(cls):
        return cls.document_one(env.task_map[cls.name])

    @classmethod
    def document_one(cls, spec):
        header = spec.name
        if spec.hint:
            header = "%s \u2014 %s" % (header, spec.hint)
        lines = []
        usage = spec.name
        optionals = 0
        for arg in spec.args:
            if arg.is_optional:
                usage = "%s [<%s>" % (usage, arg.name)
                optionals += 1
            elif optionals > 0:
                usage += "]"*optionals
                optionals = 0
                usage = "%s <%s>" % (usage, arg.name)
            else:
                usage = "%s <%s>" % (usage, arg.name)
            if arg.is_plural:
                usage += "..."
        if optionals:
            usage += "]"*optionals
        lines.append(
                ".. code-block:: console\n\n   $ rex %s\n" % "".join(usage))
        if spec.help:
            lines.append(spec.help+"\n")
        if spec.opts:
            lines.append("**Options**\n\n.. program:: rex %s\n" % spec.name)
        for opt in spec.opts:
            usage = ""
            if opt.key is not None:
                usage += "-%s" % opt.key
                if opt.has_value:
                    usage += " <%s>" % opt.value_name
                usage += ", "
            usage += "--%s" % opt.name
            if opt.has_value:
                usage += "=<%s>" % opt.value_name
            lines.append(".. option:: %s\n   :noindex:\n" % usage)
            if opt.hint:
                lines.append("   %s\n" % opt.hint)
        content = "\n".join(lines)+"\n"
        index = spec.name
        filename = inspect.getsourcefile(spec.code)
        try:
            lines = inspect.getsourcelines(spec.code)
        except IOError:
            lines = ([], 0)
        line = lines[1]
        return DocEntry(header, content, index, filename=filename, line=line)


class GlobalMeta(type):
    # Registers the global setting with Cogs.

    def __new__(mcls, name, bases, members):
        cls = type.__new__(mcls, name, bases, members)
        if cls.name is not None:
            hint, help = _describe(cls)
            DEFAULT = object()
            def code(value=DEFAULT):
                if value is DEFAULT:
                    value = cls.default
                elif cls.validate is not None:
                    value = _translate_value_error(cls.validate)(value)
                setattr(env, cls.name.replace('-', '_'), value)
            functools.update_wrapper(code, cls)
            spec = SettingSpec(
                    cls.name, code,
                    has_value=(cls.default is not False),
                    value_name=cls.value_name or cls.name.upper(),
                    hint=hint, help=help)
            env.setting_map[cls.name] = spec
        return cls


class Global(metaclass=GlobalMeta):
    """
    Represents a global option.

    To add a new global option, create a subclass of :class:`rex.ctl.Global`
    and:

    - set the option name as the ``name`` class attribute;
    - set the default value and the validator as ``default`` and ``validate``
      attributes; if the option is a toggle; set ``default`` to ``False``;
    - write option description as the class docstring.
    """

    #: The option name.
    name = None
    #: The name of the option value (for ``rex help``).
    value_name = None
    #: The default value of the option.  If set to ``False``,
    #: the option becomes a toggle.
    default = None
    #: Function that validates the value.
    validate = None


class TopicMeta(type):
    # Registers the help topic with Cogs.

    def __new__(mcls, name, bases, members):
        cls = type.__new__(mcls, name, bases, members)
        if cls.name is not None:
            hint, help = _describe(cls)
            def code():
                pass
            functools.update_wrapper(code, cls)
            spec = TopicSpec(cls.name, code, hint=hint, help=help)
            env.topic_map[cls.name] = spec
        return cls


class Topic(metaclass=TopicMeta):
    """
    Represents a help topic.

    To add a new help topic, create a subclass of :class:`rex.ctl.Topic` and:

    - set the topic name as the ``name`` class attribute;
    - write the topic documentation as the class docstring.
    """

    #: The topic name.
    name = None


def log(msg="", *args, **kwds):
    """Display a message."""
    if not env.quiet:
        cogs_log(msg, *args, **kwds)


