Test rex.platform
=================

::

    >>> import tempfile
    >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

    >>> from rex.core import Rex, get_packages
    >>> app = Rex('rex.platform_demo', db='pgsql:platform_demo', attach_dir=attach_dir)
    >>> app.on()

    >>> platform = get_packages()['rex.platform']

    >>> platform.exists('www/bundle/bundle.js')
    True
    >>> platform.exists('www/bundle/bundle.css')
    True

    >>> import webob

    >>> '/platform/bundle/bundle.js' in str(webob.Request.blank('/').get_response(app))
    True

    >>> '/platform/bundle/bundle.css' in str(webob.Request.blank('/').get_response(app))
    True

    >>> app.off()
    >>> import os
    >>> os.rmdir(attach_dir)
