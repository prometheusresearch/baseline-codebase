#
# Copyright (c) 2015, Prometheus Research, LLC
#


import json
import re

from email import message_from_string
from pkg_resources import Environment
from webob import Response

from rex.core import get_rex, get_settings
from rex.web import Command


__all__ = (
    'ApplicationEnvironmentCommand',
)


class ApplicationEnvironmentCommand(Command):
    """
    A JSON API used by the AboutRexDB widget to retrieve information about the
    packages in the server's environment.
    """

    path = '/environment'

    def get_package_info(self, distribution):
        info = {
            'name': distribution.project_name,
            'version': distribution.version,
        }

        if get_settings().about_private_package_mask and \
                re.match(
                    get_settings().about_private_package_mask,
                    info['name']):
            return info

        try:
            pkg_info = distribution.get_metadata('PKG-INFO')
        except IOError:
            try:
                pkg_info = distribution.get_metadata('METADATA')
            except IOError:
                pkg_info = None
        if pkg_info:
            pkg_info = message_from_string(pkg_info)
            if 'License' in pkg_info and pkg_info['License'] != 'UNKNOWN':
                info['license'] = pkg_info['License']
            if 'Author' in pkg_info and pkg_info['Author'] != 'UNKNOWN':
                info['author'] = pkg_info['Author']
            if 'Home-page' in pkg_info and pkg_info['Home-page'] != 'UNKNOWN':
                info['homepage'] = pkg_info['Home-page']

        return info

    def render(self, request):
        response = {
            'application_package': None,
            'rex_packages': [],
            'other_packages': [],
        }

        rex = get_rex()
        this_application_name = rex.requirements[0].replace('_', '-')

        rex_mask = re.compile(get_settings().about_rex_package_mask)
        if get_settings().about_exclude_package_mask:
            exclude_mask = re.compile(
                get_settings().about_exclude_package_mask,
            )
        else:
            exclude_mask = None

        env = Environment()
        for pkg in sorted(env):
            if (exclude_mask and exclude_mask.match(pkg)) \
                    or pkg == 'python':  # Don't list Python itself
                continue

            info = self.get_package_info(env[pkg][0])

            if rex_mask.match(info['name']):
                response['rex_packages'].append(info)
            else:
                response['other_packages'].append(info)

            if info['name'] == this_application_name:
                response['application_package'] = info

        return Response(
            json.dumps(response),
            headerlist=[
                ('Content-type', 'application/json'),
            ],
        )

