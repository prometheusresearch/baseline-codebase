
from rex.core import Setting, StrVal, MapVal, SeqVal, RecordVal, MaybeVal

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


ColorVal = StrVal(pattern=r'(?i)^#[0-9a-f]{3}|#[0-9a-f]{6}$')

class ApplicationBanner(Setting):
    """
    This setting defines a text that has been shown on the application banner.
    """

    name = 'application_banner'
    default = None
    validate = StrVal()


class ApplicationHeaderBgcolor(Setting):
    """
    Background color of the page header. Example value: #000000
    """

    name = 'application_header_bgcolor'
    default = '#000000'
    validate = ColorVal


class ApplicationHeaderBgcolorHover(Setting):
    """
    Background color of the page header when mouse over the link.
    Example value: #555555
    """

    name = 'application_header_bgcolor_hover'
    default = '#555555'
    validate = ColorVal


class ApplicationHeaderTextcolor(Setting):
    """
    Background color of the page header. Example value: #000000
    """

    name = 'application_header_textcolor'
    default = '#FFFFFF'
    validate = ColorVal


class ApplicationHeaderTextcolorHover(Setting):
    """
    Background color of the page header when mouse over the link.
    Example value: #555555
    """

    name = 'application_header_textcolor_hover'
    default = '#FFFFFF'
    validate = ColorVal


class UserProfileUrl(Setting):
    """
    URL of the user profile page. Also used when user logs in for the first
    time.
    """

    name = 'user_profile_url'
    default = None
    validate = StrVal()


class PersonalMenuLinks(Setting):
    """
    A list of label/url records that defines what links to show in the
    "Personal Menu" (upper right corner of navbar).
    """

    name = 'personal_menu_links'
    default = []
    validate = SeqVal(RecordVal(
        ('label', StrVal()),
        ('url', StrVal()),
    ))

class UsernameQuery(Setting):
    """
    HTSQL query to get the user name.
    Supposed to return the displayable name of the currently logged user.
    Defaults to: $USER
    """

    name = 'username_query'
    default = '$USER'
    validate = StrVal()


class MainMenu(Setting):
    """
    Main menu.
    """

    name = 'menu'
    default = []
    validate = SeqVal(RecordVal(
        ('title', StrVal()),
        ('items', SeqVal(RecordVal(
            ('title', MaybeVal(StrVal()), None),
            ('url', StrVal()),
            ('access', StrVal()),
        )))
    ))
