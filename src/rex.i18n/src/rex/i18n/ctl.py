#
# Copyright (c) 2014, Prometheus Research, LLC
#


import os.path
import pkg_resources

from email import message_from_string
from tempfile import NamedTemporaryFile

from cogs import task, argument, option
from cogs.log import fail
from babel.messages.frontend import CommandLineInterface

from rex.core import get_packages
from rex.ctl.common import make_rex, pair

from .extensions import BabelMapper


__all__ = (
    'I18N_EXTRACT',
    'I18N_INIT',
    'I18N_UPDATE',
    'I18N_COMPILE',
)


# TODO: should try to restrict these command to only work on projects installed
# as editable. don't want these commands to operate on truly installed packages


def _get_pot_location(package):
    pot_dir = package.abspath('i18n')
    pot_file = os.path.join(pot_dir, 'messages.pot')
    return pot_dir, pot_file


class I18N_TASK(object):
    project = argument(str)

    require = option(
        None,
        str,
        default=[],
        plural=True,
        value_name='PACKAGE',
        hint='include an additional package',
    )
    set = option(
        None,
        pair,
        default={},
        plural=True,
        value_name='PARAM=VALUE',
        hint='set a configuration parameter',
    )

    def __init__(self, project, require, set):
        self.project = project
        self.require = require
        self.set = set

    def get_rex(self):
        return make_rex(
            self.project,
            self.require,
            self.set,
            False,
            ensure='rex.i18n',
        )


@task
class I18N_EXTRACT(I18N_TASK):
    """
    extracts translatable strings from a project and creates a POT file
    """

    def __call__(self):
        with self.get_rex():
            app_package = get_packages()[self.project]
            mapper_config = BabelMapper.mapper_config()

        args = ['pybabel', 'extract']

        config_file = NamedTemporaryFile(delete=False)
        config_file.write(mapper_config)
        config_file.close()
        args.append('--mapping=%s' % config_file.name)

        args.append('--keyword=lazy_gettext')

        pot_dir, pot_file = _get_pot_location(app_package)
        if not os.path.exists(pot_dir):
            os.makedirs(pot_dir)
        args.append('--output=%s' % pot_file)

        args.append('--project=%s' % app_package.name)

        try:
            dist = pkg_resources.get_distribution(app_package.name)

            args.append('--version=%s' % dist.version)

            try:
                pkg_info = dist.get_metadata('PKG-INFO')
            except IOError:
                pass
            else:
                pkg_info = message_from_string(pkg_info)

                if 'Author' in pkg_info:
                    args.append(
                        '--copyright-holder=%s' % pkg_info['Author'],
                    )
                if 'Author-Email' in pkg_info:
                    args.append(
                        '--msgid-bugs-address=%s' % pkg_info['Author-Email'],
                    )

        except pkg_resources.DistributionNotFound:
            pass

        args.append('.')  # TODO: can't assume running from project root

        CommandLineInterface().run(args)

        os.remove(config_file.name)


@task
class I18N_INIT(I18N_TASK):
    """
    initializes a translation locale for a project
    """

    locale = argument(str)

    def __init__(self, project, require, set, locale):
        super(I18N_INIT, self).__init__(project, require, set)
        self.locale = locale

    def __call__(self):
        with self.get_rex():
            app_package = get_packages()[self.project]

        args = ['pybabel', 'init']

        pot_dir, pot_file = _get_pot_location(app_package)
        if not os.path.exists(pot_file):
            raise fail(
                'The POT file is missing -- you should run the'
                ' \'i18n-extract\' task first.',
            )
        args.append('--input-file=%s' % pot_file)
        args.append('--output-dir=%s' % pot_dir)

        args.append('--locale=%s' % self.locale)

        CommandLineInterface().run(args)


@task
class I18N_UPDATE(I18N_TASK):
    """
    updates a translation locale based on an updated POT file
    """

    locale = argument(str, None)

    def __init__(self, project, require, set, locale):
        super(I18N_UPDATE, self).__init__(project, require, set)
        self.locale = locale

    def __call__(self):
        with self.get_rex():
            app_package = get_packages()[self.project]

        args = ['pybabel', 'update']

        pot_dir, pot_file = _get_pot_location(app_package)
        if not os.path.exists(pot_file):
            raise fail(
                'The POT file is missing -- you should run the'
                ' \'i18n-extract\' task first.',
            )
        args.append('--input-file=%s' % pot_file)
        args.append('--output-dir=%s' % pot_dir)

        if self.locale:
            args.append('--locale=%s' % self.locale)

        CommandLineInterface().run(args)


@task
class I18N_COMPILE(I18N_TASK):
    """
    compiles a translation locale for runtime use
    """

    locale = argument(str, None)

    def __init__(self, project, require, set, locale):
        super(I18N_COMPILE, self).__init__(project, require, set)
        self.locale = locale

    def __call__(self):
        with self.get_rex():
            app_package = get_packages()[self.project]

        args = ['pybabel', 'compile', '--use-fuzzy']

        pot_dir, _ = _get_pot_location(app_package)
        if not os.path.exists(pot_dir):
            raise fail(
                'The I18N directory is missing -- you should run the'
                ' \'i18n-extract\' task first.',
            )
        args.append('--directory=%s' % pot_dir)

        if self.locale:
            args.append('--locale=%s' % self.locale)

        CommandLineInterface().run(args)

