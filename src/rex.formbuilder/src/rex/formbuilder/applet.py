#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.application import Applet
from rex.core import Setting, MaybeVal, StrVal


__all__ = (
    'FormbuilderApplet',
    'FormbuilderOverrides',
)


class FormbuilderApplet(Applet):
    title = 'Formbuilder (Experimental)'
    name = 'formbuilder'
    icon = '/images/icon.png'


class FormbuilderOverrides(Setting):
    """
    rex_formbuilder_overrides defines a file with overrides for formbuilder
    urlmap.yaml

    Example:
        rex_formbuilder_overrides: rex.package:/path/to/overrides.yaml
    """

    name = 'rex_formbuilder_overrides'
    validator = MaybeVal(StrVal())
    default = 'rex.formbuilder:/urlmap/dummy.yaml'

