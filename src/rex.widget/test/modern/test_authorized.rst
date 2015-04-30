Configurable application actions
================================

    >>> from rex.core import Rex
    >>> from rex.web import Command
    >>> from webob import Request, Response
    >>> import yaml

    >>> config = yaml.load(open('./demo/rex.yaml'))
    >>> demo = Rex(config['project'], **config['parameters'])
    >>> #**

    >>> authorized = lambda u: Request.blank('/widget/authorized?access=%s' % u)

'/authorized' command
---------------------------------------------------

`/authorized` command takes one parameter `access`. It should be an 
absolute URL or the url in `package:/url` format. It returns the JSON
object with one boolean key `{"authorized": true/false}`, which shows if
current user if authorized to access the URL submitted in `access` parameter.
Currently it supports only URLs defined in `urlmap.yaml`.

It doesn't support commands::

    >>> req = authorized('/widget/authorized')
    >>> print req.get_response(demo)
    501 Not Implemented
    Content-Type: text/html; charset=UTF-8
    Content-Length: 47
    <BLANKLINE>
    Cannot obtain access for rex.widget:/authorized


It doesn't support static files in static/www::

    >>> req = Request.blank('/bundle/bundle.js')
    >>> print req.get_response(demo)              # doctest: +ELLIPSIS
    200 OK
    ...

    >>> req = authorized('/bundle/bundle.js')
    >>> print req.get_response(demo)
    501 Not Implemented
    Content-Type: text/html; charset=UTF-8
    Content-Length: 58
    <BLANKLINE>
    Cannot obtain access for rex.widget_demo:/bundle/bundle.js

It supports urls defined in `urlmap.yaml`::

    >>> req = authorized('/')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 19
    <BLANKLINE>
    {"authorized":true}

URL can be defined in `package:/url` format::

    >>> req = authorized('rex.widget_demo:/')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 19
    <BLANKLINE>
    {"authorized":true}

It returns `false` when user is not authorized::

    >>> req = authorized('/authenticated/only')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 20
    <BLANKLINE>
    {"authorized":false}

    >>> req.remote_user = 'Bob'
    >>> print req.get_response(demo)
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 19
    <BLANKLINE>
    {"authorized":true}

It also works fine when application is located in subpath::

    >>> app_path = '/application_path'
    >>> req = authorized('%s/authenticated/only' % app_path)
    >>> req.script_name = app_path
    >>> print req.get_response(demo)
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 20
    <BLANKLINE>
    {"authorized":false}
