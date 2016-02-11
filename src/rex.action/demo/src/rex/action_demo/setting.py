
from rex.core import Setting, SeqVal, RecordVal, StrVal, MaybeVal, MapVal
from rex.widget_chrome import Menu as ChromeMenu
ChromeMenu.name = None


class Menu(Setting):
    """
    Application menu.
    """

    name = 'menu'
    default = []
    validate = SeqVal(RecordVal(
        ('title', StrVal()),
        ('items', SeqVal(RecordVal(
            ('title', MaybeVal(StrVal()), None),
            ('url', StrVal()),
            ('access', StrVal()),
            ('wizard_source', MaybeVal(StrVal()), None),
            ('action_source', MaybeVal(MapVal(StrVal(), StrVal())), {}),
        )))
    ))
