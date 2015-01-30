
from rex.core import IntVal, StrVal, ChoiceVal, MaybeVal, MapVal
from rex.widget import Widget, Field, StateField
from rex.widget.field.url import URLField, URLVal

__all__ = (
    'InstrumentListWidget',
    'InstrumentEditorWidget'
)

class InstrumentListWidget(Widget):
    """Formbuilder List Widget"""

    name = 'InstrumentList'
    js_type = 'rex-formbuilder/lib/list/InstrumentList'

    home = URLField(
        default=URLVal()('rex.formbuilder:/api')
    )
    editorURLTemplate = URLField()

class InstrumentEditorWidget(Widget):
    """Formbuilder Editor Widget"""

    name = 'InstrumentEditor'
    js_type = 'rex-formbuilder/lib/editor/InstrumentEditor'

    home = URLField(
        default=URLVal()('rex.formbuilder:/')
    )
    indexURL = URLField(
        default=URLVal()('rex.formbuilder:/')
    )
    previewURLTemplate = URLField(
        default=URLVal()('rex.form_previewer:/?instrument_id=${uid}')
    )
    editorURLTemplate = URLField()
    group = StateField(ChoiceVal(['published', 'drafts']))
    uid = StateField(StrVal())
