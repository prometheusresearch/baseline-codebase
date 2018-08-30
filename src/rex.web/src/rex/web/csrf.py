#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from .secret import b2a
import itertools
import os


def trusted(req):
    """
    Checks if the request came a trusted source.

    This function implements protection against CSRF (Cross-Site Request
    Forgery) as described in
    https://www.owasp.org/index.php/Cross-Site_Request_Forgery_%28CSRF%29.

    This function assumes that the request came from a trusted source if:

    1. The user session contains a ``_csrf_token`` value.
    2. The request contains either an HTTP header ``X-CSRF-Token`` or
       a form parameter ``_csrf_token``.
    3. The token values from the user session and the request coincide.
    """
    # Get the CRSF token from the user session.
    session = req.environ.get('rex.session', {})
    session_csrf_token = session.get('_csrf_token')
    # Get the token value from the request.
    request_csrf_token = req.environ.get('HTTP_X_CSRF_TOKEN') or \
                         req.params.get('_csrf_token')
    # Check if the values coincide.
    if not session_csrf_token or not request_csrf_token:
        return False
    is_equal = True
    for ch1, ch2 in itertools.zip_longest(session_csrf_token,
                                           request_csrf_token):
        is_equal &= (ch1 == ch2)
    return is_equal


def retain_csrf_token(req):
    """
    Associates a CSRF token with the user session.

    *Returns:* the token value.
    """
    session = req.environ.get('rex.session', {})
    csrf_token = session.get('_csrf_token')
    if not csrf_token:
        csrf_token = session['_csrf_token'] = b2a(os.urandom(16))
    return csrf_token


def make_csrf_meta_tag(req):
    """
    Generates a ``<meta>`` tag containing the value of the CSRF token::

        <meta name="_csrf_token" content="...">
    """
    return """<meta name="_csrf_token" content="%s">""" \
            % retain_csrf_token(req)


def make_csrf_input_tag(req):
    """
    Generates an ``<input>`` tag containing the value of the CSRF token::

        <input name="_csrf_token" type="hidden" value="...">
    """
    return """<input name="_csrf_token" type="hidden" value="%s">""" \
            % retain_csrf_token(req)


