#
# Copyright (c) 2013, Prometheus Research, LLC
#

from rex.core import Setting, MaybeVal, BoolVal, StrVal
from rex.application import Applet
from urllib import quote
from webob import Response
from .command import *
import errno


class FormbuilderApplet(Applet):

    title = 'Formbuilder'
    name = 'formbuilder'
    icon = '/img/formbuilder_icon.png'


class FormbuilderOverrides(Setting):
    """
    rex_formbuilder_overrides defines a file with overrides for formbuilder urlmap.yaml

    Example:
        rex_formbuilder_overrides: rex.package:/path/to/overrides.yaml
    """

    name = 'rex_formbuilder_overrides'
    validator = MaybeVal(StrVal())
    default = 'rex.formbuilder:/urlmap/dummy.yaml'


class ManualEditConditions(Setting):
    """
    Boolean parameter that specifies if it is allowed to manually edit
    conditions in Roads builder. By default, user is allowed only to use
    conditions wizard.

    Example:
      manual_edit_conditions: True
    """
    name = 'manual_edit_conditions'
    validator = BoolVal()
    default = False
