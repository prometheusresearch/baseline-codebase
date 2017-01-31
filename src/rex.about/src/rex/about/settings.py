#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, StrVal, MaybeVal


__all__ = (
    'AboutPrivatePackageMaskSetting',
    'AboutRexPackageMaskSetting',
    'AboutExcludePackageMaskSetting',
)


class AboutPrivatePackageMaskSetting(Setting):
    """
    A regular expression that will be used to identify which packages are
    considered "private", meaning they will only display name and version
    information.

    If not specified, defaults to: ``^(props\\.|client\\.).*``
    """

    #:
    name = 'about_private_package_mask'
    validate = MaybeVal(StrVal())
    default = r'^(props\.|client\.).*'


class AboutRexPackageMaskSetting(Setting):
    """
    A regular expression that will be used to identify which packages are
    considered part of the RexDB suite.

    If not specified, defaults to: ``^rex\\..*``
    """

    #:
    name = 'about_rex_package_mask'
    validate = StrVal()
    default = r'^rex\..*'


class AboutExcludePackageMaskSetting(Setting):
    """
    A regular expression that will be used to identify which packages should be
    completely hidden from view.
    """

    #:
    name = 'about_exclude_package_mask'
    validate = MaybeVal(StrVal())
    default = None

