from rex.i18n import ngettext, gettext as _
from rex.web import Command, render_to_response, get_assets_bundle


SOME_THING = _('apple')

COUNT = 2
OTHER_THING = ngettext('%(num)s banana', '%(num)s bananas', COUNT)


class DemoCommand(Command):
    access = 'anybody'
    path = '/'

    def render(self, request):
        return render_to_response(
            'rex.i18n_demo:/www/index.html',
            request,
            bundle=get_assets_bundle(),
        )

