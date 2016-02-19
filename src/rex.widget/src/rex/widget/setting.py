"""

    rex.widget.setting
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import (Setting, RecordVal, StrVal, RecordVal, Validate, Error,
                      BoolVal)

from .transitionable import as_transitionable
from .util import PropsContainer, WidgetClassReference
from .chrome import Chrome


def _encode_record_type(value, req, path):
    return PropsContainer(value._asdict())


def make_record_type_transitionable(record_type):
    as_transitionable(record_type, tag='map')(_encode_record_type)


_element_color_val = RecordVal(
    ('text_color', StrVal(), None),
    ('background_color', StrVal(), None),
    ('border_color', StrVal(), None),
)

make_record_type_transitionable(_element_color_val.record_type)

_element_color_default = _element_color_val.record_type(
    text_color=None,
    background_color=None,
    border_color=None,
)

element_color_val = RecordVal(
    ('text_color', StrVal(), None),
    ('background_color', StrVal(), None),
    ('border_color', StrVal(), None),
    ('hover', _element_color_val, _element_color_default),
    ('active', _element_color_val, _element_color_default),
    ('focus', _element_color_val, _element_color_default),
    ('disabled', _element_color_val, _element_color_default),
)

make_record_type_transitionable(element_color_val.record_type)

element_color_default = element_color_val.record_type(
    text_color=None,
    background_color=None,
    border_color=None,
    hover=_element_color_default,
    focus=_element_color_default,
    active=_element_color_default,
    disabled=_element_color_default,
)

class RexWidgetSetting(Setting):
    """
    Rex Widget site wide configuration.

    Example::

        rex_widget:
            theme:
                ...

    """

    name = 'rex_widget'

    _theme_val = RecordVal(
        ('button', element_color_val, element_color_default),
        ('success_button', element_color_val, element_color_default),
        ('danger_button', element_color_val, element_color_default),
        ('quiet_button', element_color_val, element_color_default),
    )

    make_record_type_transitionable(_theme_val.record_type)

    _theme_default = _theme_val.record_type(
        button=element_color_default,
        success_button=element_color_default,
        danger_button=element_color_default,
        quiet_button=element_color_default,
    )

    _chrome_val = WidgetClassReference()
    _chrome_default = Chrome

    validate = RecordVal(
        ('theme', _theme_val, _theme_default),
        ('chrome', _chrome_val, _chrome_default),
        ('warn_incompatible_browser', BoolVal(), True),
    )

    default = validate.record_type(
        theme=_theme_default,
        chrome=_chrome_default,
        warn_incompatible_browser=True,
    )
