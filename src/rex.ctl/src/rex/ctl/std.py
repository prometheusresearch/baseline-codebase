#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import (
        Rex, LatentRex, Validate, MaybeVal, StrVal, SeqVal, MapVal, BoolVal,
        UnionVal, OnScalar, OnMap, get_packages, ModulePackage, StaticPackage,
        Setting)
from .core import Task, Global, Topic, argument, option, env, log, fail
import sys
import os
import email
import pprint
import code
import textwrap
import pkg_resources
import readline
import rlcompleter
import yaml


class DebugGlobal(Global):
    """print debug information"""

    name = 'debug'
    default = False
    validate = BoolVal()


class ConfigGlobal(Global):
    """config file to retrieve settings from"""

    name = 'config'
    default = None
    validate = StrVal()


class QuietGlobal(Global):
    """suppress non-error console output"""

    name = 'quiet'
    default = False
    validate = BoolVal()


class ProjectGlobal(Global):
    """primary package

    The primary package of the application.
    """

    name = 'project'
    value_name = 'NAME'
    validate = MaybeVal(StrVal)


class RequirementsGlobal(Global):
    """additional application components

    Additional packages to include with the application.
    """

    name = 'requirements'
    value_name='[NAME]'
    validate = SeqVal(StrVal)
    default = []


class ParametersGlobal(Global):
    """application configuration

    A dictionary with application parameters.
    """

    name = 'parameters'
    value_name='{NAME:VALUE}'
    validate = MapVal(StrVal)
    default = {}


class ExportSentryVal(Validate):
    # Exports Sentry configuration into the environment.

    def __init__(self, validate):
        self.validate = validate

    def __call__(self, data):
        data = self.validate(data)
        if isinstance(data, str):
            data = {'dsn': data}
        for key, value in sorted(data.items()):
            if value:
                os.environ['SENTRY_'+key.upper()] = value
        return data


class SentryGlobal(Global):
    """configuration for the Sentry client

    This parameter configures the client for the Sentry error tracker.
    It should contain the key `dsn` with the address of the Sentry server.
    It may contain other keys, which are submitted to Sentry as tags.
    """

    name = 'sentry'
    value_name = 'DSN'
    validate = ExportSentryVal(UnionVal(
            (OnScalar, StrVal),
            (OnMap, MapVal(StrVal, MaybeVal(StrVal)))))


class UsageTask(Task):
    """run when no task is supplied"""

    name = ''

    class options:
        help = option()

    def __call__(self):
        if self.help:
            t = HelpTask(topic=None)
            return t()
        if env.shell.description:
            log("{} - {}", env.shell.name.title(), env.shell.description)
        else:
            log("{}", env.shell.name.title())
        executable = os.path.basename(sys.argv[0])
        log("Usage: `{} [@instance] [<settings>...] <task> [<arguments>...]`", executable)
        log()
        log("Run `{} help` for general usage and a list of tasks and settings.",
            executable)
        log("Run `{} help <topic>` for help on a specific task or setting.",
            executable)


class HelpTask(Task):
    """display help on tasks and settings

    When started without arguments, displays a list of available tasks,
    settings and toggles.

    When `<topic>` is given, describes the usage of the specified task
    or setting.
    """

    name = 'help'

    class arguments:
        topic = argument(default=None)

    def __call__(self):
        if self.topic is None:
            return self.describe_all()
        if self.topic in env.task_map and self.topic != '':
            spec = env.task_map[self.topic]
            return self.describe_task(spec)
        elif self.topic in env.setting_map:
            spec = env.setting_map[self.topic]
            return self.describe_setting(spec)
        elif self.topic in env.topic_map:
            spec = env.topic_map[self.topic]
            return self.describe_topic(spec)
        else:
            raise fail("unknown help topic `{}`", self.topic)

    def describe_all(self):
        if env.shell.description:
            log("{} - {}", env.shell.name.title(), env.shell.description)
        else:
            log("{}", env.shell.name.title())
        executable = os.path.basename(sys.argv[0])
        log("Usage: `{} [@instance] [<settings>...] <task> [<arguments>...]`", executable)
        log()
        log("Run `{} help` for general usage and a list of tasks,", executable)
        log("settings and other help topics.")
        log()
        log("Run `{} help <topic>` for help on a specific topic.", executable)
        log()
        if env.task_map:
            log("Available tasks:")
            for name in sorted(env.task_map):
                if not name:
                    continue
                spec = env.task_map[name]
                usage = spec.name
                for arg in spec.args:
                    if arg.is_optional:
                        continue
                    usage = "%s <%s>" % (usage, arg.name)
                    if arg.is_plural:
                        usage += "..."
                if spec.hint:
                    log("  {:<24} : {}", usage, spec.hint)
                else:
                    log("  {}", usage)
            log()
        if env.setting_map:
            log("Settings:")
            for name in sorted(env.setting_map):
                spec = env.setting_map[name]
                if spec.has_value:
                    usage = "--%s=%s" % (spec.name, spec.value_name.upper())
                else:
                    usage = "--%s" % spec.name
                if spec.hint:
                    log("  {:<24} : {}", usage, spec.hint)
                else:
                    log("  {}", usage)
            log()
        if env.topic_map:
            log("Other topics:")
            for name in sorted(env.topic_map):
                spec = env.topic_map[name]
                if spec.hint:
                    log("  {:<24} : {}", spec.name, spec.hint)
                else:
                    log("  {}", spec.name)
            log()

    def describe_task(self, spec):
        if spec.hint:
            log("{} - {}", spec.name.upper(), spec.hint)
        else:
            log("{}", spec.name.upper())
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
        executable = os.path.basename(sys.argv[0])
        log("Usage: `{} {}`", executable, usage)
        log()
        if spec.help:
            log(spec.help)
            log()
        if spec.opts:
            log("Options:")
            for opt in spec.opts:
                usage = "--%s" % opt.name
                if opt.key is not None:
                    usage = "-%s/%s" % (opt.key, usage)
                if opt.has_value:
                    usage = "%s=%s" % (usage, opt.value_name)
                if spec.hint:
                    log("  {:<24} : {}", usage, opt.hint)
                else:
                    log("  {}", opt.name)
            log()

    def describe_setting(self, spec):
        if spec.hint:
            log("{} - {}", spec.name.upper(), spec.hint)
        else:
            log("{}", spec.name.upper())
        executable = os.path.basename(sys.argv[0])
        usage = "--%s" % spec.name
        usage_conf = "%s" % spec.name
        usage_environ = ("%s_%s" % (env.instance, spec.name)) \
                        .upper().replace('-', '_').replace('.', '_')
        if spec.has_value:
            usage += "=%s" % spec.value_name
            usage_conf += ": %s" % spec.value_name
            usage_environ += "=%s" % spec.value_name
        else:
            usage_conf += ": true"
            usage_environ += "=1"
        log("Usage: `{} {}`", executable, usage)
        log("       `{}` ({})", usage_conf, env.instance + '.yaml')
        log("       `{}` (environment)", usage_environ)
        log()
        if spec.help:
            log(spec.help)
            log()

    def describe_topic(self, spec):
        if spec.hint:
            log("{} - {}", spec.name.upper(), spec.hint)
        else:
            log("{}", spec.name.upper())
        log()
        if spec.help:
            log(spec.help)
            log()
        spec.code()


class RexTask(Task):
    """Implements an application-specific task."""

    class arguments:
        project = argument(StrVal(), default=None)

    class options:
        require = option(
                None, StrVal(),
                default=[], plural=True,
                value_name="PACKAGE",
                hint="include an additional package")
        set = option(
                None, StrVal(r'[0-9A-Za-z_-]+(=.*)?'),
                default=[], plural=True,
                value_name="PARAM=VALUE",
                hint="set a configuration parameter")

    def do(self, task_name, **parameters):
        """
        Executes a subtask `task_name` with the given `parameters`.

        When the task itself and the subtask have an argument or an option
        with the same name, the argument or the option value is added to the
        `parameters`.
        """
        spec = env.task_map[task_name]
        this_spec = env.task_map[self.name]
        for arg in spec.args:
            if arg.attr not in parameters:
                if any(this_arg.attr == arg.attr
                       for this_arg in this_spec.args):
                    parameters[arg.attr] = getattr(self, arg.attr)
                else:
                    assert not arg.is_optional
                    parameters[arg.attr] = arg.default
        for opt in spec.opts:
            if opt.attr not in parameters:
                if any(this_opt.attr == opt.attr
                       for this_opt in this_spec.opts):
                    parameters[opt.attr] = getattr(self, opt.attr)
                else:
                    parameters[opt.attr] = opt.default
        task = spec.code(**parameters)
        return task()

    def make(self, extra_requirements=[], extra_parameters={},
             initialize=True, ensure=None):
        """
        Creates a RexDB application from command-line parameters
        and global settings.

        `extra_requirements`
            A list of additional packages to include with the application.
        `extra_parameters`
            Additional configuration for the application.
        `initialize`
            If not set, do not initialize the application.
        `ensure`
            A package name.  We verify that the application contains
            the specified package.  If unset, assume the package in
            which the task is defined.  To disable the check, set
            `ensure` to ``False``.
        """
        # Form the list of requirements.
        requirements = []
        if self.project is not None:
            requirements.append(self.project)
        elif env.project is not None:
            requirements.append(env.project)
        requirements.extend(self.require)
        requirements.extend(env.requirements)
        requirements.extend(extra_requirements)

        # Gather application parameters.
        parameters = {}
        if env.debug:
            parameters['debug'] = True
        for key, value in list(env.parameters.items()):
            parameters[key.replace('-', '_')] = value
        parameters.update(env.parameters)
        for value in self.set:
            if '=' in value:
                key, value = value.split('=', 1)
            else:
                key, value = value, True
            parameters[key.replace('-', '_')] = value
        parameters.update(extra_parameters)

        # Build the application.
        rex_type = Rex
        if not initialize:
            rex_type = LatentRex
        app = rex_type(*requirements, **parameters)

        # Verify that the task's package is included.
        if ensure is None:
            ensure = sys.modules[self.__class__.__module__].__package__
        if ensure:
            with app:
                packages = get_packages()
            if ensure not in packages:
                if requirements:
                    raise fail("package `{}` must be included"
                               " with the application", ensure)
                else:
                    raise fail("application is not specified")
        return app


class PackagesTask(RexTask):
    """list application components

    The `packages` task lists components of a RexDB application.
    """

    name = 'packages'

    class options:
        verbose = option(
                'v', BoolVal(),
                hint="display more information")

    def __call__(self):
        # Get a list of components.
        with self.make(initialize=False, ensure='rex.core'):
            packages = get_packages()
        # FIXME: we miss components with no extensions and resources.

        for package in packages:
            # Display terse summary.
            if not self.verbose:
                name = package.name
                if not isinstance(package, (ModulePackage, StaticPackage)):
                    dist = pkg_resources.get_distribution(package.name)
                    name = "%s == %s" % (name, dist.version)
                log("{}", name)
                continue

            # Dump all information.
            log("`[{}]`", package.name)

            if isinstance(package, ModulePackage):
                # Package generated from a module name.
                module = __import__(package.name, fromlist=['__file__'])
                log("Location:")
                log("  {}", module.__file__)

            elif isinstance(package, StaticPackage):
                # Package generated from a static directory.
                log("Resources:")
                log("  {}", os.path.realpath(package.static))

            else:
                # Package generated from a Python distribution.
                dist = pkg_resources.get_distribution(package.name)
                dependencies = dist.requires()
                # Read extra metadata from `PKG-INFO` file.
                summary = None
                url = None
                if dist.has_metadata('PKG-INFO'):
                    config = email.message_from_string(
                            dist.get_metadata('PKG-INFO'))
                    summary = config['Summary']
                    if summary == "UNKNOWN":
                        summary = None
                    url = config['Home-Page']
                    if url == "UNKNOWN":
                        url = None
                # Dump package information.
                log("Version:")
                log("  {}", dist.version)
                log("Location:")
                log("  {}", dist.location)
                if package.static is not None:
                    log("Resources:")
                    log("  {}", os.path.realpath(package.static))
                if summary:
                    log("Summary:")
                    log("  {}", summary)
                if url:
                    log("URL:")
                    log("  {}", url)
                if dependencies:
                    log("Dependencies:")
                    for dependency in dependencies:
                        log("  {}", dependency)
            log()


class SettingsTask(RexTask):
    """list configuration parameters

    The `settings` task lists configuration parameters of a RexDB application.
    """

    name = 'settings'

    class options:
        verbose = option(
                'v', BoolVal(),
                hint="display more information")

    def __call__(self):
        # Get mappings from setting names to setting types and
        # packages where they are declared.
        app = self.make(initialize=False, ensure='rex.core')
        with app:
            packages = get_packages()
            setting_map = {}
            setting_package = {}
            for package in packages:
                for setting_type in Setting.by_package(package):
                    setting_map[setting_type.name] = setting_type
                    setting_package[setting_type.name] = package

        # Load setting values from `settings.yaml` files and application
        # parameters.
        # FIXME: no longer works properly now that we permit merging.
        parameters = {}
        sources = {}
        for package in reversed(packages):
            if package.exists('settings.yaml'):
                stream = package.open('settings.yaml')
                try:
                    package_parameters = yaml.safe_load(stream)
                except yaml.YAMLError:
                    pass
                else:
                    if not isinstance(package_parameters, dict):
                        continue
                    for name in package_parameters:
                        parameters[name] = package_parameters[name]
                        sources[name] = package
        for name in app.parameters:
            parameters[name] = app.parameters[name]
            sources[name] = None

        for name in sorted(setting_map):
            # Determine and display setting information.
            setting_type = setting_map[name]
            package = setting_package[name]
            is_set = name in parameters
            is_mandatory = (setting_type.default == Setting.default)
            value = parameters.get(name)
            source = sources.get(name)
            # Display terse summary.
            if not self.verbose:
                if is_mandatory and is_set:
                    template = "{}*:"
                elif is_mandatory:
                    template = "{}:warning:`*`:"
                else:
                    template = "{}:"
                log(template, name)
                if is_set:
                    for line in pprint.pformat(value).splitlines():
                        log("  {}", line)
                continue
            # Dump all information.
            log("`[{}]`", name)
            log("Declared in:")
            log("  {}", package.name)
            if is_mandatory:
                log("Mandatory?")
                # Warn the user if a mandatory setting is not set.
                log("  true" if is_set else "  :warning:`true`")
            if source is not None:
                log("Preset in:")
                log("  {}", source.name)
            if is_set:
                log("Value:")
                for line in pprint.pformat(value).splitlines():
                    log("  {}", line)
            log("Description:")
            for line in setting_type.help().splitlines():
                if line:
                    log("  {}", line)
                else:
                    log()
            log()


class PyShellTask(RexTask):
    """starts Python shell with the application.

    This tasks starts a Python shell and adds the application instance
    to the shell environment.

    If IPython is available, it will be used.
    """

    name = 'pyshell'

    PYTHON_BANNER = textwrap.dedent("""\
    Type 'help' for more information, Ctrl-D to exit.
    >>> {name}
    {app}""")

    IPYTHON_BANNER = textwrap.dedent("""\
    Type 'help' for more information, Ctrl-D to exit.

    {name} -> {app}
    """)

    def __call__(self):
        app = self.make(initialize=False, ensure='rex.core')
        name = app.requirements[0].split('.')[-1].replace('-', '_')
        namespace = {name: app}
        with app:
            try:
                from IPython.terminal.embed import InteractiveShellEmbed
            except ImportError:
                banner = self.PYTHON_BANNER.format(name=name, app=app)
                readline.set_completer(
                    rlcompleter.Completer(namespace).complete
                )
                readline.parse_and_bind('tab: complete')
                code.interact(banner, local=namespace)
            else:
                banner = self.IPYTHON_BANNER.format(name=name, app=app)
                sh = InteractiveShellEmbed(banner1=banner)
                sh(local_ns=namespace)


class ConfigurationTopic(Topic):
    """how to configure a RexDB application

    To configure a RexDB application, create file `rex.yaml` in the current
    directory.  The file may contain the application name, the application
    configuration and other global parameters.

    For example, create `rex.yaml` file with the following content:

        project: rex.ctl_demo
        parameters:
            db: pgsql:ctl_demo
        http-host: localhost
        http-port: 8088

    Now you can use the `rex` command to perform various tasks on the
    `rex.ctl_demo` application.  For example, to deploy the application
    database and start a development HTTP server with the application,
    run:

        $ rex deploy
        $ rex serve

    If you wish to name the configuration file differently, or the file
    is not in the current directory, you can use `--config` setting to
    specify the location of the configuration file:

        $ rex deploy --config=/path/to/rex.yaml
        $ rex serve --config=/path/to/rex.yaml

    Alternatively, configuration parameters could be specified using
    environment variables:

        $ export REX_PROJECT=rex.ctl_demo
        $ export REX_PARAMETERS='{"db": "pgsql:ctl_demo"}'
        $ export REX_HTTP_HOST=localhost
        $ export REX_HTTP_PORT=8088

        $ rex deploy
        $ rex serve

    Another option is to specify the application name and configuration
    using command-line parameters:

        $ rex deploy rex.ctl_demo --set db=pgsql:ctl_demo
        $ rex serve rex.ctl_demo --set db=pgsql:ctl_demo -h localhost -p 8088

    To get a list of all configuration parameters supported by the
    application, use `rex settings`, e.g.:

        $ rex settings rex.ctl_demo
        $ rex settings rex.ctl_demo --verbose

    To describe a task and get a list of task-specific command-line options,
    use `rex help`, e.g.:

        $ rex help deploy
        $ rex help serve
    """

    name = 'configuration'


def load_rex(config_path, secret_path=None, initialize=True):
    """
    Creates an application instance from a configuration file.

    `config_path`
        Path to the configuration file.
    `secret_path`
        Path to the file containing the secret passphrase for generating
        private keys.
    `initialize`
        Whether or not to initialize the application.
    """
    validate = MapVal()
    with open(config_path) as config_file:
        config_data = validate.parse(config_file)
    project = ProjectGlobal.validate(config_data.get('project'))
    requirements = RequirementsGlobal.validate(
            config_data.get('requirements', []))
    parameters = ParametersGlobal.validate(
            config_data.get('parameters', {}))
    SentryGlobal.validate(config_data.get('sentry'))
    if secret_path is not None:
        with open(secret_path) as secret_file:
            secret_data = secret_file.read()
        parameters['secret'] = secret_data
    if initialize:
        RexClass = Rex
    else:
        RexClass = LatentRex
    return RexClass(projects, *requirements, **parameters)


