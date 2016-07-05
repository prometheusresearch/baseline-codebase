*************************
  Parsing ``menu.yaml``
*************************

::

    >>> from rex.core import Rex
    >>> from rex.menu import get_menu

    >>> demo = Rex('rex.menu_demo')
    >>> demo.on()

    >>> menu = get_menu()

    >>> from webob import Request

    >>> req = Request.blank('/')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    200 OK
    ...
    <html lang="en">
    ..."rex-action/lib/actions/Page"...
    </html>

    >>> req = Request.blank('/individual')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank('/individual', remote_user='carl@example.com')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    200 OK
    ...
    <html lang="en">
    ..."rex-action/lib/wizard/Wizard"...
    </html>

    >>> req = Request.blank('/explore', remote_user='carl@example.com')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    200 OK
    ...
    <html lang="en">
    ..."rex-widget/lib/library/IFrame"...
    </html>

    >>> req = Request.blank('/search')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    307 Temporary Redirect
    Location: http://google.com/
    ...

