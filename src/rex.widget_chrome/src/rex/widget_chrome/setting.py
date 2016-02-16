from rex.core import (
    Setting, StrVal, MapVal, SeqVal, RecordVal, MaybeVal,
    Validate, OneOfVal, BoolVal)


color_val = StrVal(pattern=r'(?i)^#[0-9a-f]{3}|#[0-9a-f]{6}$')

class ApplicationTitle(Setting):
    """Customizable application title. Defaults to 'RexDB'"""

    name = 'application_title'
    default = 'RexDB'
    validate = StrVal()


class ApplicationLogoutUrl(Setting):
    """Logout URL to be used by application."""

    name = 'application_logout_url'
    default = '/logout'
    validate = StrVal()



class ApplicationBanner(Setting):
    """
    This setting defines a text that has been shown on the application banner.
    """

    name = 'application_banner'
    default = None
    validate = StrVal()


class HeaderPrimaryColor(Setting):
    """
    Primary color for application chrome header.
    """

    name = 'header_primary_color'
    default = None
    validate = MaybeVal(color_val)


class HeaderSecondaryColor(Setting):
    """
    Secondary color for application chrome header.
    """

    name = 'header_secondary_color'
    default = None
    validate = MaybeVal(color_val)


class UserProfileUrl(Setting):
    """
    URL of the user profile page. Also used when user logs in for the first
    time.
    """

    name = 'user_profile_url'
    default = None
    validate = StrVal()


class UsernameQuery(Setting):
    """
    HTSQL query to get the user name.
    Supposed to return the displayable name of the currently logged user.
    Defaults to: $USER
    """

    name = 'username_query'
    default = '$USER'
    validate = StrVal()


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
            ('new_window', BoolVal(), False),
            ('access', StrVal()),
        )))
    ))
