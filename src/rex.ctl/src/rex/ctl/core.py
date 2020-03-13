#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import (
        Error, DocEntry, MapVal, StrVal, get_rex, get_packages, get_sentry)
import sys
import os
import os.path
import functools
import inspect
import re
import types
import itertools
import types
import importlib._bootstrap
import pkg_resources
import yaml


class Failure(Exception):
    """Stops execution of a task."""


class Environment(object):
    """Container for settings and other global parameters."""

    __slots__ = ('_states', '__dict__')

    class _context(object):

        def __init__(self, owner, **updates):
            self.owner = owner
            self.updates = updates

        def __enter__(self):
            self.owner.push(**self.updates)

        def __exit__(self, exc_type, exc_value, exc_tb):
            self.owner.pop()

    def __init__(self, **updates):
        self._states = []
        self.add(**updates)

    def clear(self):
        self.__dict__.clear()

    def add(self, **updates):
        for key in sorted(updates):
            assert not key.startswith('_'), \
                    "parameter should not start with '_': %r" % key
            assert key not in self.__dict__, \
                    "duplicate parameter %r" % key
            self.__dict__[key] = updates[key]

    def set(self, **updates):
        for key in sorted(updates):
            assert key in self.__dict__, \
                    "unknown parameter %r" % key
            self.__dict__[key] = updates[key]

    def push(self, **updates):
        self._states.append(self.__dict__)
        self.__dict__ = self.__dict__.copy()
        self.set(**updates)

    def pop(self):
        assert self._states, "unbalanced pop()"
        self.__dict__ = self._states.pop()

    def __call__(self, **updates):
        return self._context(self, **updates)


class ArgSpec(object):
    """Task argument specification."""

    def __init__(self, attr, name, check, default,
                 is_optional=False, is_plural=False):
        self.attr = attr
        self.name = name
        self.check = check
        self.default = default
        self.is_optional = is_optional
        self.is_plural = is_plural


class argument(object):
    """Describes a task argument."""

    CTR = itertools.count(1)
    REQ = object()

    def __init__(self, check=None, default=REQ, plural=False):
        assert isinstance(plural, bool)
        self.check = check
        self.default = default
        self.plural = plural
        self.order = next(self.CTR)


class OptSpec(object):
    """Task option specification."""

    def __init__(self, attr, name, key, check, default,
                 is_plural=False, has_value=False, value_name=None, hint=None):
        self.attr = attr
        self.name = name
        self.key = key
        self.check = check
        self.default = default
        self.is_plural = is_plural
        self.has_value = has_value
        self.value_name = value_name
        self.hint = hint


class option(object):
    """Describes a task option."""

    CTR = itertools.count(1)
    NOVAL = object()

    def __init__(self, key=None, check=None, default=NOVAL, plural=False,
                 value_name=None, hint=None):
        assert key is None or (isinstance(key, str) and
                               re.match(r'^[a-zA-Z]$', key)), \
                "key must be a letter, got %r" % key
        assert isinstance(plural, bool)
        assert value_name is None or isinstance(value_name, str)
        assert hint is None or isinstance(hint, str)
        self.key = key
        self.check = check
        self.default = default
        self.plural = plural
        self.value_name = value_name
        self.hint = hint
        self.order = next(self.CTR)


class TaskSpec(object):
    """Task specification."""

    def __init__(self, name, code, args, opts,
                 hint=None, help=None):
        self.name = name
        self.code = code
        self.args = args
        self.opts = opts
        self.hint = hint
        self.help = help
        self.opt_by_name = {}
        self.opt_by_key = {}
        for opt in self.opts:
            self.opt_by_name[opt.name] = opt
            if opt.key is not None:
                self.opt_by_key[opt.key] = opt


class TaskMeta(type):
    # Registers the task.

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


class GlobalSpec(object):
    """Global option specification."""

    def __init__(self, name, code, has_value=False, value_name=None,
                 hint=None, help=None):
        self.name = name
        self.code = code
        self.has_value = has_value
        self.value_name = value_name
        self.hint = hint
        self.help = help


class GlobalMeta(type):
    # Registers the global option.

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
            spec = GlobalSpec(
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


class TopicSpec(object):
    """Help topic specification."""

    def __init__(self, name, code, hint=None, help=None):
        self.name = name
        self.code = code
        self.hint = hint
        self.help = help


class TopicMeta(type):
    # Registers the help topics.

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


def _to_name(keyword):
    # Convert an identifier or a keyword to a task/setting name.
    return keyword.lower().replace(' ', '-').replace('_', '-')


def _describe(fn):
    # Convert a docstring to a hint line and a description.
    hint = ""
    help = ""
    doc = fn.__doc__
    if doc:
        doc = doc.strip()
    if doc:
        lines = doc.splitlines()
        hint = lines.pop(0).strip()
        while lines and not lines[0].strip():
            lines.pop(0)
        while lines and not lines[-1].strip():
            lines.pop(-1)
        indent = None
        for line in lines:
            short_line = line.lstrip()
            if short_line:
                line_indent = len(line)-len(short_line)
                if indent is None or line_indent < indent:
                    indent = line_indent
        if indent:
            lines = [line[indent:] for line in lines]
        help = "\n".join(lines)
    return hint, help


class COLORS:
    # ANSI escape sequences and style decorations.

    S_RESET = 0
    S_BRIGHT = 1
    S_DIM = 2
    S_UNDERSCORE = 4
    S_BLINK = 5
    S_REVERSE = 7
    S_HIDDEN = 8
    FG_BLACK = 30
    FG_RED = 31
    FG_GREEN = 32
    FG_YELLOW = 33
    FG_BLUE = 34
    FG_MAGENTA = 35
    FG_CYAN = 36
    FG_WHITE = 37
    BG_BLACK = 40
    BG_RED = 41
    BG_GREEN = 42
    BG_YELLOW = 43
    BG_BLUE = 44
    BG_MAGENTA = 45
    BG_CYAN = 46
    BG_WHITE = 47

    styles = {
        None: [S_BRIGHT],
        'debug': [S_DIM],
        'warning': [S_BRIGHT, FG_RED],
        'success': [S_BRIGHT, FG_GREEN],
    }


def colorize(msg, file=None):
    # Convert styling decorations to ANSI escape sequences.
    if not msg:
        return msg
    if file is None:
        file = sys.stdout
    has_colors = file.isatty()
    def _replace(match):
        style = match.group('style')
        data = match.group('data')
        assert style in COLORS.styles, "unknown style %r" % style
        if not has_colors:
            return data
        lesc = "\x1b[%sm" % ";".join(str(ctrl)
                                     for ctrl in COLORS.styles[style])
        resc = "\x1b[%sm" % COLORS.S_RESET
        return lesc+data+resc
    return re.sub(r"(?::(?P<style>[a-zA-Z]+):)?`(?P<data>[^`]*)`",
                  _replace, msg)


def _out(msg, file, args, kwds):
    # Print a formatted message to a file.
    msg = colorize(msg, file)
    if args or kwds:
        msg = msg.format(*args, **kwds)
    file.write(msg)
    file.flush()


def log(msg="", *args, **kwds):
    """Display a message."""
    if not env.quiet:
        _out(msg+"\n", sys.stdout, args, kwds)


def debug(msg, *args, **kwds):
    """Display a debug message."""
    if env.debug:
        _out(":debug:`#` "+msg+"\n", sys.stderr, args, kwds)


def warn(msg, *args, **kwds):
    """Display a warning."""
    _out(":warning:`WARNING`: "+msg+"\n", sys.stderr, args, kwds)


def fail(msg, *args, **kwds):
    """Display an error message and return an exception object."""
    _out(":warning:`FATAL ERROR`: "+msg+"\n", sys.stderr, args, kwds)
    return Failure()


def prompt(msg):
    """Prompt the user for input."""
    value = ""
    while not value:
        value = input(msg+" ").strip()
    return value


env = Environment()
env.add(shell=Environment(name="Rex",
                          description="""Command-line administration utility"""
                                      """ for the RexDB platform""",
                          local_package='rex.local',
                          entry_point='rex.ctl',
                          config_dirs=[os.path.abspath('.'), sys.prefix]),
        instance=os.path.basename(sys.argv[0]) if not sys.argv[0].startswith('-') else 'rex',
        debug=False,
        quiet=False,
        config=None,
        task_map={},
        setting_map={},
        topic_map={})


def _translate_value_error(fn):
    # Translates `rex.core.Error` to `ValueError`.
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
        debug_var = '%s_DEBUG' % env.instance.upper().replace('-', '_').replace('.', '_')
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



_DEFAULT = object()
def _init_setting(name, value=_DEFAULT, seen=set()):
    # Initialize the setting once.

    # Terrible abuse of a mutable default value to prevent the setting from
    # being initialized more than once.
    if name in seen:
        return
    seen.add(name)

    spec = env.setting_map[name]
    try:
        if value is not _DEFAULT:
            spec.code(value)
        else:
            spec.code()
    except ValueError as exc:
        raise fail("invalid value for setting --{}: {}", name, exc)


def _load_extensions():
    # Load extensions registered using the entry point.
    if env.shell.entry_point:
        for entry in pkg_resources.iter_entry_points(env.shell.entry_point):
            debug("loading extensions from {}", entry)
            entry.load()

    # Load extensions from the current directory.
    if env.shell.local_package:
        package = env.shell.local_package
        prefix = os.path.join(os.getcwd(), package)
        module = None
        for path, is_package in [(prefix+'.py', False),
                                 (prefix+'/__init__.py', True)]:
            if os.path.exists(path):
                module = path
                break
        if module is not None:
            uid = os.stat(module).st_uid
            if not (uid == os.getuid() or uid == 0):
                warn("cannot load extensions from {}:"
                     " not owned by the user or the root", module)
            else:
                # Create and import a module object.
                debug("loading extensions from {}", module)
                local = types.ModuleType(package)
                sys.modules[package] = local
                if is_package:
                    local.__package__ = package
                    local.__path__ = [prefix]
                loader = importlib.machinery.SourceFileLoader(
                        package, module)
                code = loader.get_code(None)
                exec(code, locals=local.__dict__)


def _parse_argv(argv):
    # Parse command line parameters.

    # Task and values for its arguments and options.
    task = None
    attrs = {}

    # Have we seen `--`?
    no_more_opts = False
    # Parameters to process.
    params = argv[1:]
    # Parameters containing task arguments.
    arg_params = []
    while params:
        param = params.pop(0)

        # Treat the remaining parameters as arguments even
        # if they start with `-`.
        if param == '--' and not no_more_opts:
            no_more_opts = True

        # Must be a setting or an option in the long form.
        elif param.startswith('--') and not no_more_opts:
            if '=' in param:
                key, value = param.split('=', 1)
                no_value = False
            else:
                key = param
                value = None
                no_value = True
            name = _to_name(key[2:])
            if name in env.setting_map:
                # Ok, it is a setting.
                spec = env.setting_map[name]
                if spec.has_value and no_value:
                    if not params:
                        raise fail("missing value for setting {}", key)
                    value = params.pop(0)
                    no_value = False
                if not spec.has_value:
                    if not no_value:
                        raise fail("unexpected value for toggle"
                                   " setting {}", key)
                    value = True
                _init_setting(name, value)
            else:
                # Must be a task option.
                if task is None:
                    task = env.task_map['']
                if name not in task.opt_by_name:
                    raise fail("unknown option or setting {}", key)
                opt = task.opt_by_name[name]
                if opt.has_value and no_value:
                    if not params:
                        raise fail("missing value for option {}", key)
                    value = params.pop(0)
                    no_value = False
                if not opt.has_value:
                    if not no_value:
                        raise fail("unexpected value for a toggle"
                                   " option {}", key)
                    value = True
                if not opt.is_plural:
                    if opt.attr in attrs:
                        raise fail("duplicate option {}", key)
                    attrs[opt.attr] = value
                else:
                    if opt.attr not in attrs:
                        attrs[opt.attr] = ()
                    attrs[opt.attr] += (value,)

        # Option or a collection of options in short form.
        elif param.startswith('-') and param != '-' and not no_more_opts:
            if task is None:
                task = env.task_map['']
            keys = param[1:]
            while keys:
                key = keys[0]
                keys = keys[1:]
                if key not in task.opt_by_key:
                    raise fail("unknown option -{}", key)
                opt = task.opt_by_key[key]
                if opt.has_value:
                    if keys:
                        value = keys
                        keys = ''
                    else:
                        if not params:
                            raise fail("missing value for option -{}", key)
                        value = params.pop(0)
                else:
                    value = True
                if not opt.is_plural:
                    if opt.attr in attrs:
                        raise fail("duplicate option -{}", key)
                    attrs[opt.attr] = value
                else:
                    if opt.attr not in attrs:
                        attrs[opt.attr] = ()
                    attrs[opt.attr] += (value,)

        # First parameter that is not a setting or an option must be
        # the task name.
        elif task is None:
            if param == '-' and not no_more_opts:
                task = env.task_map['']
            else:
                name = _to_name(param)
                if name not in env.task_map:
                    raise fail("unknown task {}", param)
                task = env.task_map[name]

        # A task argument.
        else:
            if param == '-' and not no_more_opts:
                param = None
            arg_params.append(param)

    # It is the default task.
    if task is None:
        task = env.task_map['']

    # Verify the number of arguments.
    min_args = max_args = 0
    for arg in task.args:
        if max_args is not None:
            max_args += 1
        if not arg.is_optional:
            min_args += 1
        if arg.is_plural:
            max_args = None
    if max_args is not None and len(arg_params) > max_args:
        if task.name:
            raise fail("too many arguments for task {}", task.name)
        else:
            raise fail("too many arguments")
    if len(arg_params) < min_args:
        missing = []
        for arg in task.args:
            if not arg.is_optional:
                if arg_params:
                    arg_params.pop(0)
                else:
                    missing.append(arg.name)
        missing = " ".join("<%s>" % name for name in missing)
        if task.name:
            raise fail("too few arguments for task {}: missing {}",
                       task.name, missing)
        else:
            raise fail("too few arguments: missing {}", missing)

    # Extract arguments into attributes.
    for pos, arg in reversed(list(enumerate(task.args))):
        if arg.is_optional and pos >= len(arg_params):
            continue
        if arg.is_plural:
            attrs[arg.attr] = ()
            while pos < len(arg_params):
                attrs[arg.attr] = (arg_params.pop(),)+attrs[arg.attr]
        else:
            attrs[arg.attr] = arg_params.pop()

    # Validate options.
    for opt in task.opts:
        if opt.attr in attrs:
            if opt.check is not None:
                try:
                    if opt.is_plural:
                        attrs[opt.attr] = tuple(opt.check(value)
                                                for value in attrs[opt.attr])
                    else:
                        attrs[opt.attr] = opt.check(attrs[opt.attr])
                except ValueError as exc:
                    raise fail("invalid value for option --{}: {}",
                               opt.name, exc)
        else:
            attrs[opt.attr] = opt.default

    # Validate arguments.
    for arg in task.args:
        if arg.attr in attrs:
            if arg.check is not None:
                try:
                    if arg.is_plural:
                        attrs[arg.attr] = tuple(arg.check(value)
                                                for value in attrs[arg.attr])
                    else:
                        attrs[arg.attr] = arg.check(attrs[arg.attr])
                except ValueError as exc:
                    raise fail("invalid value for argument <{}>: {}",
                               arg.name, exc)
        else:
            attrs[arg.attr] = arg.default

    return task, attrs


def _configure_environ():
    # Load settings from environment variables.
    prefix = "%s_" % env.instance.upper().replace('-', '_').replace('.', '_')
    for key in sorted(os.environ):
        if not key.startswith(prefix):
            continue
        name = _to_name(key[len(prefix):])
        if name not in env.setting_map:
            warn("unknown setting {} in the environment", key)
            continue
        _init_setting(name, os.environ[key])


def _configure_file(config_path):
    debug("loading configuration from {}", config_path)
    val = MapVal(StrVal)
    data = val.parse(open(config_path, 'r'))
    for key in sorted(data):
        name = _to_name(key)
        if name not in env.setting_map:
            warn("unknown setting {} in configuration file {}",
                 key, config_path)
            continue
        _init_setting(name, data[key])


def _configure():
    # Load and initialize settings.

    # Load settings from the process environment.
    _configure_environ()

    # Load settings from configuration files.
    if env.config:
        if not os.path.isfile(env.config):
            raise fail('specified configuration file {} does not exist',
                       env.config)
        _configure_file(env.config)
    else:
        config_name = env.instance + '.yaml'
        for config_dir in reversed(env.shell.config_dirs):
            config_path = os.path.join(config_dir, config_name)
            if os.path.isfile(config_path):
                _configure_file(config_path)
                break

    # Initialize the remaining settings.
    for name in sorted(env.setting_map):
        _init_setting(name)


def run(argv):
    # Load all the extensions.
    _load_extensions()

    # Parse command-line parameters.
    task, attrs = _parse_argv(argv)

    # Load settings from environment variables and configuration files.
    _configure()

    # Execute the task.
    try:
        instance = task.code(**attrs)
    except ValueError as exc:
        raise fail("{}", exc)
    return instance()

