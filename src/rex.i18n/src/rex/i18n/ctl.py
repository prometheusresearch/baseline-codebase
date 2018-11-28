#
# Copyright (c) 2014, Prometheus Research, LLC
#


import os
import re

from email import message_from_string

import pkg_resources

from babel.messages.frontend import CommandLineInterface

from rex.core import Error, get_packages
from rex.ctl import Task, argument, option, log
from rex.ctl.common import make_rex
from rex.setup import commonjs

from .core import ALL_DOMAINS, DOMAIN_BACKEND, DOMAIN_FRONTEND, \
    get_locale_identifier
from .validators import LocaleVal


__all__ = (
    'I18NExtractTask',
    'I18NInitTask',
    'I18NUpdateTask',
    'I18NCompileTask',
)


# pylint: disable=E1101,C0103


def check_domain(domain):
    if domain in ALL_DOMAINS:
        return domain
    raise ValueError('%s is not a valid domain' % domain)


class I18NTask(Task):
    # pylint: disable=abstract-method

    class options(object):  # noqa
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

    def get_pot_location(self, domain):
        pot_dir = os.path.join(self.project_path, 'static', 'i18n')
        pot_file = os.path.join(pot_dir, '%s.pot' % domain)
        return pot_dir, pot_file


class I18NExtractTask(I18NTask):
    """
    extracts translatable strings from a project and creates POT file(s)

    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    """

    name = 'i18n-extract'

    class arguments(object):  # noqa
        project_path = argument(str, default=os.getcwd())

    def __call__(self):
        with make_rex('rex.i18n'):
            if DOMAIN_BACKEND in self.domain:
                self.extract_backend()
            if DOMAIN_FRONTEND in self.domain:
                self.extract_frontend()

    def extract_backend(self):
        args = ['pybabel', 'extract', '--no-location']
        args.append('--keyword=lazy_gettext')
        args.extend([
            '--%s=%s' % (key, val)
            for key, val in list(self.get_package_metadata().items())
        ])
        args.append('--mapping=%s' % (
            get_packages().abspath('rex.i18n:/babel_extract.ini'),
        ))

        pot_dir, pot_file = self.get_pot_location(DOMAIN_BACKEND)
        if not os.path.exists(pot_dir):
            os.makedirs(pot_dir)
        args.append('--output=%s' % pot_file)

        args.append(self.project_path)

        log('\nExtracting backend strings from: %s' % (self.project_path,))
        CommandLineInterface().run(args)

    def get_package_metadata(self):
        metadata = {}

        setup = os.path.join(self.project_path, 'setup.py')

        if os.path.exists(setup):
            setup = open(setup, 'r').read()
            match = re.search(
                r"name\s*=\s*['\"]([^'\"]*)['\"]",
                setup,
                re.DOTALL,
            )

            if match:
                package_name = match.groups()[0]

                metadata['project'] = package_name

                try:
                    dist = pkg_resources.get_distribution(package_name)

                    metadata['version'] = dist.version

                    try:
                        pkg_info = dist.get_metadata('PKG-INFO')
                    except IOError:  # pragma: no cover
                        pass
                    else:
                        pkg_info = message_from_string(pkg_info)

                        if 'Author' in pkg_info:
                            metadata['copyright-holder'] = pkg_info['Author']
                        if 'Author-Email' in pkg_info:
                            metadata['msgid-bugs-address'] = \
                                pkg_info['Author-Email']

                except pkg_resources.DistributionNotFound:  # pragma: no cover
                    pass

        return metadata

    def extract_frontend(self):
        commonjs.npm([
            'install',
            '--global',
            'gettext-parser@1.2.x',
            'babel-core@6.x',
            'babel-preset-prometheusresearch',
            'babel-plugin-transform-flow-strip-types',
        ])

        js_path = os.path.join(self.project_path, 'js')  # the 'new' convention
        if not os.path.exists(js_path):
            js_path = os.path.join(self.project_path, 'static/js')  # the 'old'
        log('\nExtracting frontend strings from: %s' % (js_path,))

        args = [
            get_packages().abspath('rex.i18n:/js_extractor/index.js'),
            js_path,
        ]

        pot_dir, pot_file = self.get_pot_location(DOMAIN_FRONTEND)
        if not os.path.exists(pot_dir):
            os.makedirs(pot_dir)
        args.append(pot_file)

        metadata = self.get_package_metadata()
        project = metadata['project']
        if metadata.get('version'):
            project = '%s %s' % (project, metadata['version'])
        args.append(project)

        print(commonjs.node(args))


class I18NInitTask(I18NTask):
    """
    initializes a translation locale for a project

    The locale argument is the code of the locale to initialize.

    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    """

    name = 'i18n-init'

    class arguments(object):  # noqa
        locale = argument(LocaleVal())
        project_path = argument(str, default=os.getcwd())

    def __call__(self):
        base_args = ['pybabel', 'init']

        base_args.append(
            '--locale=%s' % get_locale_identifier(self.locale, sep='_')
        )

        for domain in self.domain:
            args = base_args[:]

            args.append('--domain=%s' % domain)

            pot_dir, pot_file = self.get_pot_location(domain)
            if not os.path.exists(pot_file):
                raise Error(
                    'The POT file is missing for domain "%s" -- you should run'
                    ' the \'i18n-extract\' task first.' % (
                        domain,
                    ),
                )
            args.append('--input-file=%s' % pot_file)
            args.append('--output-dir=%s' % pot_dir)

            CommandLineInterface().run(args)


class I18NUpdateTask(I18NTask):
    """
    updates a translation locale based on an updated POT file

    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    """

    name = 'i18n-update'

    class arguments(object):  # noqa
        project_path = argument(str, default=os.getcwd())

    class options(object):  # noqa
        locale = option(
            None,
            LocaleVal(),
            default=None,
            hint='the locale to update; if not specified, all locales in the'
            ' project are updated',
        )

    def __call__(self):
        base_args = ['pybabel', 'update']

        if self.locale:
            base_args.append(
                '--locale=%s' % get_locale_identifier(self.locale, sep='_')
            )

        for domain in self.domain:
            args = base_args[:]

            args.append('--domain=%s' % domain)

            pot_dir, pot_file = self.get_pot_location(domain)
            if not os.path.exists(pot_file):
                raise Error(
                    'The POT file is missing for domain "%s" -- you should run'
                    ' the \'i18n-extract\' task first.' % (
                        domain,
                    ),
                )
            args.append('--input-file=%s' % pot_file)
            args.append('--output-dir=%s' % pot_dir)

            CommandLineInterface().run(args)


class I18NCompileTask(I18NTask):
    """
    compiles a translation locale for runtime use

    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    """

    name = 'i18n-compile'

    class arguments(object):  # noqa
        project_path = argument(str, default=os.getcwd())

    class options(object):  # noqa
        locale = option(
            None,
            LocaleVal(),
            default=None,
            hint='the locale to compile; if not specified, all locales in the'
            ' project are compiled',
        )

    def __call__(self):
        base_args = ['pybabel', 'compile', '--use-fuzzy']

        if self.locale:
            base_args.append(
                '--locale=%s' % get_locale_identifier(self.locale, sep='_')
            )

        for domain in self.domain:
            args = base_args[:]

            args.append('--domain=%s' % domain)

            pot_dir, _ = self.get_pot_location(domain)
            if not os.path.exists(pot_dir):
                raise Error(
                    'The I18N directory is missing -- you should run the'
                    ' \'i18n-extract\' task first.',
                )
            args.append('--directory=%s' % pot_dir)

            try:
                CommandLineInterface().run(args)
            except:  # pylint: disable=W0702
                log(
                    'There was a failure when trying to compile domain: %s' % (
                        domain,
                    )
                )

