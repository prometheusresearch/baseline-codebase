#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, StrVal, MapVal


__all__ = (
    'TemplatesSetting',
)


class TemplatesSetting(Setting):
    """
    A mapping that allows you to override the Jinja templates used by the
    Commands in this application.

    Example::

        form_previewer_templates:
            viewform: my.package:/template/viewform.html
    """

    name = 'form_previewer_templates'
    default = {}
    validate = MapVal(StrVal(), StrVal())

