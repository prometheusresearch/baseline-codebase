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

from .core import ALL_DOMAINS
from .extensions import BabelMapper


__all__ = (
    'I18N_EXTRACT',
    'I18N_INIT',
    'I18N_UPDATE',
    'I18N_COMPILE',
)


# pylint: disable=C0103

# TODO: should try to restrict these command to only work on projects installed
# as editable. don't want these commands to operate on truly installed packages


def _get_pot_location(package, domain):
    pot_dir = package.abspath('i18n')
    pot_file = os.path.join(pot_dir, '%s.pot' % domain)
    return pot_dir, pot_file


def check_domain(domain):
    if domain in ALL_DOMAINS:
        return domain
    raise ValueError('%s is not a valid domain' % domain)


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
    setting = option(
        None,
        pair,
        default={},
        plural=True,
        value_name='PARAM=VALUE',
        hint='set a configuration parameter',
    )
    domain = option(
        None,
        check_domain,
        default=ALL_DOMAINS,
        plural=True,
        value_name='DOMAIN',
        hint='the gettext domain(s) to operate on; can choose from: %s' % (
            ', '.join(ALL_DOMAINS),
        ),
    )

    def __init__(self, project, require, setting, domain):
        self.project = project
        self.require = require
        self.setting = setting
        self.domain = domain

    def get_rex(self):
        return make_rex(
            self.project,
            self.require,
            self.setting,
            False,
            ensure='rex.i18n',
        )


@task
class I18N_EXTRACT(I18N_TASK):
    """
    extracts translatable strings from a project and creates a POT file
    """

    def __call__(self):
        mapper_config = {}
        with self.get_rex():
            app_package = get_packages()[self.project]
            for domain in self.domain:
                mapper_config[domain] = \
                    BabelMapper.domain_mapper_config(domain)

        base_args = ['pybabel', 'extract']

        base_args.append('--keyword=lazy_gettext')

        base_args.append('--project=%s' % app_package.name)

        try:
            dist = pkg_resources.get_distribution(app_package.name)

            base_args.append('--version=%s' % dist.version)

            try:
                pkg_info = dist.get_metadata('PKG-INFO')
            except IOError:
                pass
            else:
                pkg_info = message_from_string(pkg_info)

                if 'Author' in pkg_info:
                    base_args.append(
                        '--copyright-holder=%s' % pkg_info['Author'],
                    )
                if 'Author-Email' in pkg_info:
                    base_args.append(
                        '--msgid-bugs-address=%s' % pkg_info['Author-Email'],
                    )

        # pylint: disable=W0704
        except pkg_resources.DistributionNotFound:
            pass

        for domain in self.domain:
            args = base_args[:]

            config_file = NamedTemporaryFile(delete=False)
            config_file.write(mapper_config[domain])
            config_file.close()
            args.append('--mapping=%s' % config_file.name)

            pot_dir, pot_file = _get_pot_location(app_package, domain)
            if not os.path.exists(pot_dir):
                os.makedirs(pot_dir)
            args.append('--output=%s' % pot_file)

            args.append('.')  # TODO: can't assume running from project root

            CommandLineInterface().run(args)

            os.remove(config_file.name)


@task
class I18N_INIT(I18N_TASK):
    """
    initializes a translation locale for a project
    """

    locale = argument(str)

    def __init__(self, project, require, setting, domain, locale):
        super(I18N_INIT, self).__init__(project, require, setting, domain)
        self.locale = locale

    def __call__(self):
        with self.get_rex():
            app_package = get_packages()[self.project]

        base_args = ['pybabel', 'init']

        base_args.append('--locale=%s' % self.locale)

        for domain in self.domain:
            args = base_args[:]

            args.append('--domain=%s' % domain)

            pot_dir, pot_file = _get_pot_location(app_package, domain)
            if not os.path.exists(pot_file):
                raise fail(
                    'The POT file is missing for domain "%s" -- you should run'
                    ' the \'i18n-extract\' task first.' % (
                        domain,
                    ),
                )
            args.append('--input-file=%s' % pot_file)
            args.append('--output-dir=%s' % pot_dir)

            CommandLineInterface().run(args)


@task
class I18N_UPDATE(I18N_TASK):
    """
    updates a translation locale based on an updated POT file
    """

    locale = argument(str, None)

    def __init__(self, project, require, setting, domain, locale):
        super(I18N_UPDATE, self).__init__(project, require, setting, domain)
        self.locale = locale

    def __call__(self):
        with self.get_rex():
            app_package = get_packages()[self.project]

        base_args = ['pybabel', 'update']

        if self.locale:
            base_args.append('--locale=%s' % self.locale)

        for domain in self.domain:
            args = base_args[:]

            args.append('--domain=%s' % domain)

            pot_dir, pot_file = _get_pot_location(app_package, domain)
            if not os.path.exists(pot_file):
                raise fail(
                    'The POT file is missing for domain "%s" -- you should run'
                    ' the \'i18n-extract\' task first.' % (
                        domain,
                    ),
                )
            args.append('--input-file=%s' % pot_file)
            args.append('--output-dir=%s' % pot_dir)

            CommandLineInterface().run(args)


@task
class I18N_COMPILE(I18N_TASK):
    """
    compiles a translation locale for runtime use
    """

    locale = argument(str, None)

    def __init__(self, project, require, setting, domain, locale):
        super(I18N_COMPILE, self).__init__(project, require, setting, domain)
        self.locale = locale

    def __call__(self):
        with self.get_rex():
            app_package = get_packages()[self.project]

        base_args = ['pybabel', 'compile', '--use-fuzzy']

        if self.locale:
            base_args.append('--locale=%s' % self.locale)

        for domain in self.domain:
            args = base_args[:]

            args.append('--domain=%s' % domain)

            pot_dir, _ = _get_pot_location(app_package, domain)
            if not os.path.exists(pot_dir):
                raise fail(
                    'The I18N directory is missing -- you should run the'
                    ' \'i18n-extract\' task first.',
                )
            args.append('--directory=%s' % pot_dir)

            CommandLineInterface().run(args)

