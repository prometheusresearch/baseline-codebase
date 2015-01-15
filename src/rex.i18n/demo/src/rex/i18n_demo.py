from rex.i18n import ngettext, gettext as _


SOME_THING = _('apple')

COUNT = 2
OTHER_THING = ngettext('%(num)s banana', '%(num)s bananas', COUNT)

