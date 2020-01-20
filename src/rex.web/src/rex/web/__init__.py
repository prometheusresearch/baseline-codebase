#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
This package provides web stack for the RexDB platform: custom URL handlers,
rendering static resources, templates, sessions, authentication and
authorization mechanism.
"""


from .auth import (
    authenticate, authorize, confine, Authenticate, Authorize, Confine,
    AccessSetting)
from .command import Command, Parameter
from .csrf import (
    trusted, retain_csrf_token, make_csrf_meta_tag, make_csrf_input_tag)
from .handle import HandleLocation, HandleFile, HandleError
from .path import PathMask, PathMap
from .route import (
    MountSetting, Pipe, Route, not_found, url_for, route, get_routes,
    make_sentry_script_tag)
from .secret import SecretSetting, encrypt_and_sign, validate_and_decrypt
from .services import ServicesSetting
from .template import (
    get_jinja, render_to_response, HandleTemplate, jinja_filter_json,
    jinja_filter_urlencode, jinja_filter_url, find_assets_bundle,
    get_assets_bundle)
from .ctl import (
    HTTPHostGlobal, HTTPPortGlobal, UWSGIGlobal, ServeTask, WSGITask,
    ServeUWSGITask, StartTask, StopTask, StatusTask)


