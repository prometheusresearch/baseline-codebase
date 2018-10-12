**********************
  Using ``rex.menu``
**********************

.. contents:: Table of Contents


Parsing ``menu.yaml``
=====================

We start with creating and activating an application object::

    >>> from rex.core import Rex, SandboxPackage

    >>> demo = Rex('rex.menu_demo')
    >>> demo.on()

Then, we use function ``get_menu()`` to load menu structure from a
``menu.yaml`` file::

    >>> from rex.menu import get_menu

    >>> menu = get_menu()

    >>> print(menu)                                      # doctest: +ELLIPSIS
    MenuItem('', [MenuItem('Home', [...]), MenuItem('Individuals', [...]), ...])

When none of the packages has a ``menu.yaml`` file, an empty menu is returned::

    >>> with Rex('rex.menu'):
    ...     print(get_menu())
    MenuItem('')

``rex.menu`` requires that menu item paths are well-formed URLs::

    >>> sandbox = SandboxPackage()
    >>> sandbox.rewrite('/menu.yaml', """
    ... menu:
    ... - title: Bad Path
    ...   path: Bad Path
    ... """)

    >>> Rex(sandbox, 'rex.menu')                        # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Got ill-formed path:
        path mask must start with /: 'Bad Path'
    While parsing:
        "/.../menu.yaml", line 4
    ...

It also requires that the item paths are unique::

    >>> sandbox.rewrite('/menu.yaml', """
    ... menu:
    ... - title: Documentation
    ...   external: http://google.com/
    ... - title: Documentation
    ...   external: http://bing.com/
    ... """)

    >>> Rex(sandbox, 'rex.menu')                        # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Detected duplicate or ambiguous path:
        /documentation
    Defined in:
        "/.../menu.yaml", line 5
    And previously in:
        "/.../menu.yaml", line 3
    ...

``rex.menu`` complains if it finds ``menu.yaml`` file in more than one
package::

    >>> Rex(sandbox, 'rex.menu_demo')                   # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected exactly one menu configuration, found more than one:
        sandbox:/menu.yaml
        rex.menu_demo:/menu.yaml
    ...


Handling requests
=================

``rex.menu`` provides several ways for defining menu handlers.  One way is to use
the ``rex.action`` framework, which renders an action wizard::

    >>> from webob import Request

    >>> req = Request.blank('/')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <html lang="en">
    ...["rex-action", "Page", ...
    </html>

``rex.menu`` verifies that the user has required permissions::

    >>> req = Request.blank('/individual')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

    >>> req = Request.blank('/individual', remote_user='carl@example.com')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <html lang="en">
    ...["rex-action", "Wizard", ...
    </html>

``rex.menu`` also allows to define a ``rex.widget``-based handler::

    >>> req = Request.blank('/explore', remote_user='carl@example.com')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <html lang="en">
    ...["rex-widget", "IFrame", ...
    </html>

A menu item can also redirect the user to an external URL::

    >>> req = Request.blank('/search')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    307 Temporary Redirect
    Location: http://google.com/
    ...

``rex.menu`` add a trailing slash::

    >>> req = Request.blank('/study')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    301 Moved Permanently
    Location: http://localhost/study/
    ...


