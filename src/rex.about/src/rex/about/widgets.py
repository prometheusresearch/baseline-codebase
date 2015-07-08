#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import StrVal
from rex.widget import Widget, Field, URLVal


__all__ = (
    'AboutRexDBWidget',
)


class AboutRexDBWidget(Widget):
    """
    The Widget used to generate the "About" page.
    """

    name = 'AboutRexDB'
    js_type = 'rex-about/lib/AboutRexDB'

    heading = Field(
        StrVal(),
        doc='The heading of the page.',
    )

    license = Field(
        StrVal(),
        doc='The RexDB license text to display.',
    )

    overview = Field(
        StrVal(),
        doc='The text to display on the Overivew tab under the application'
        ' version.',
    )

    environment_data = Field(
        URLVal(),
        default='rex.about:/environment',
        doc='The path to the JSON API that provides the environment data.',
    )

