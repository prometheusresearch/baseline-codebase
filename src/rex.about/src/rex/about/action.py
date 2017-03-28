#
# Copyright (c) 2017, Prometheus Research, LLC
#

import re

from email import message_from_string
from pkg_resources import Environment

from rex.action import Action
from rex.core import StrVal, get_settings, get_rex
from rex.widget import Field, computed_field

from .license import REXDB_LICENSE


__all__ = (
    'AboutAction',
)


class AboutAction(Action):
    """
    The Action used to generate an "About" page.
    """

    name = 'about'
    js_type = 'rex-about/lib/About'

    license = Field(
        StrVal(),
        doc='The RexDB license text to display.',
        default=REXDB_LICENSE,
    )

    overview = Field(
        StrVal(),
        doc='The text to display on the Overivew tab under the application'
        ' version.',
        default=None,
    )

    @computed_field
    def environment_packages(self, request):
        info = {
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

            pkg_info = self.get_package_info(env[pkg][0])

            if rex_mask.match(pkg_info['name']):
                info['rex_packages'].append(pkg_info)
            else:
                info['other_packages'].append(pkg_info)

            if pkg_info['name'] == this_application_name:
                info['application_package'] = pkg_info

        return info

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
            pkg_info = distribution.get_metadata(distribution.PKG_INFO)
        except IOError:
            pass
        else:
            pkg_info = message_from_string(pkg_info)
            if 'License' in pkg_info and pkg_info['License'] != 'UNKNOWN':
                info['license'] = unicode(pkg_info['License'], errors='ignore')
            if 'Author' in pkg_info and pkg_info['Author'] != 'UNKNOWN':
                info['author'] = unicode(pkg_info['Author'], errors='ignore')
            if 'Home-page' in pkg_info and pkg_info['Home-page'] != 'UNKNOWN':
                info['homepage'] = unicode(pkg_info['Home-page'], errors='ignore')

        return info

    def context(self):
        return {}, {}

