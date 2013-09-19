#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import task, argument, option
from cogs.log import log, fail
from .common import make_rex
from rex.core import get_packages, ModulePackage, StaticPackage, Setting, Error
import io
import email
import os.path
import pprint
import pkg_resources
import yaml


@task
class PACKAGES:
    """list application components

    The `packages` task lists components of a RexDB application.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")

    def __init__(self, project, require):
        self.project = project
        self.require = require

    def __call__(self):
        # Get a list of components.
        try:
            with make_rex(self.project, self.require, initialize=False):
                packages = get_packages()
            # FIXME: we miss components with no extensions and resources.
        except Error, error:
            raise fail(str(error))

        for package in packages:
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


@task
class SETTINGS:
    """list configuration parameters

    The `settings` task lists configuration parameters of a RexDB application.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")

    def __init__(self, project, require):
        self.project = project
        self.require = require

    def __call__(self):
        # Get mappings from setting names to setting types and
        # packages where they are declared.
        app = make_rex(self.project, self.require, initialize=False)
        try:
            with app:
                packages = get_packages()
                setting_map = {}
                setting_package = {}
                for package in packages:
                    for setting_type in Setting.by_package(package):
                        setting_map[setting_type.name] = setting_type
                        setting_package[setting_type.name] = package
        except Error, error:
            raise fail(str(error))

        # Load setting values from `settings.yaml` files and application
        # parameters.
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
            log("`[{}]`", name)
            # Determine and display setting information.
            setting_type = setting_map[name]
            package = setting_package[name]
            is_set = name in parameters
            is_mandatory = (setting_type.default == Setting.default)
            value = parameters.get(name)
            source = sources.get(name)
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


