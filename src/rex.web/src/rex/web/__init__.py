#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
This package provides web stack for the Rex platform: custom URL handlers,
rendering static resources, templates, sessions, authentication and
authorization mechanism.
"""


from .auth import authenticate, authorize, Authenticate, Authorize
from .command import Command, Parameter
from .handle import HandleLocation, HandleFile, HandleError
from .route import MountSetting
from .secret import SecretSetting
from .template import get_jinja, render_to_response, HandleTemplate


