****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.ctl import ctl, Ctl


i18n-extract
============

The ``i18n-extract`` command will scan a project's source files and extract the
strings marked for translation and put them into POT files::

    >>> ctl('help i18n-extract')
    I18N-EXTRACT - extracts translatable strings from a project and creates POT file(s)
    Usage: rex i18n-extract [<project-path>]
    <BLANKLINE>
    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    <BLANKLINE>
    Options:
      --domain=DOMAIN          : the gettext domain(s) to operate on; can choose from: backend, frontend
    <BLANKLINE>


It takes one optional argument specifying the root path of the project::

    >>> ctl('i18n-extract ./test/sandbox')
    extracting messages from test/sandbox/src/rex/__init__.py
    extracting messages from test/sandbox/src/rex/i18n_demo.py
    extracting messages from test/sandbox/static/template/bar.txt (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/template/foo.html (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/templates/bar.txt (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/templates/foo.html (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/www/bar.css_t (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/www/foo.js_t (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/www/index.html (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    writing PO template file to ./test/sandbox/static/i18n/backend.pot
    extracting messages from test/sandbox/static/js/lib/foo.jsx
    extracting messages from test/sandbox/static/js/lib/index.js
    writing PO template file to ./test/sandbox/static/i18n/frontend.pot
    <BLANKLINE>


It also takes an option that specifies which gettext domain to operate on::

    >>> ctl('i18n-extract ./test/sandbox --domain=backend')
    extracting messages from test/sandbox/src/rex/__init__.py
    extracting messages from test/sandbox/src/rex/i18n_demo.py
    extracting messages from test/sandbox/static/template/bar.txt (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/template/foo.html (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/templates/bar.txt (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/templates/foo.html (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/www/bar.css_t (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/www/foo.js_t (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/sandbox/static/www/index.html (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    writing PO template file to ./test/sandbox/static/i18n/backend.pot

    >>> ctl('i18n-extract ./test/sandbox --domain=doesntexist', expect=1)
    FATAL ERROR: invalid value for option --domain: doesntexist is not a valid domain
    <BLANKLINE>


It will fail if there's a Jinja template with broken syntax::

    >>> ctl('i18n-extract ./test/broken_sandbox --domain=backend', expect=1) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    extracting messages from test/broken_sandbox/src/rex/__init__.py
    extracting messages from test/broken_sandbox/src/rex/i18n_demo.py
    extracting messages from test/broken_sandbox/static/template/bar.txt (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    extracting messages from test/broken_sandbox/static/template/broken.html (extensions="jinja2.ext.do,jinja2.ext.loopcontrols", silent="false")
    Traceback (most recent call last):
        ...
    TemplateSyntaxError: unexpected '}'


i18n-init
=========

The ``i18n-init`` command will initialize a locale for translation in the
project::

    >>> ctl('help i18n-init')
    I18N-INIT - initializes a translation locale for a project
    Usage: rex i18n-init <locale> [<project-path>]
    <BLANKLINE>
    The locale argument is the code of the locale to initialize.
    <BLANKLINE>
    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    <BLANKLINE>
    Options:
      --domain=DOMAIN          : the gettext domain(s) to operate on; can choose from: backend, frontend
    <BLANKLINE>


It takes one required argument indicating the locale to initialize, and one
optional argument specifying the root path of the project::

    >>> ctl('i18n-init fr ./test/sandbox')
    creating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.po based on ./test/sandbox/static/i18n/backend.pot
    creating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.po based on ./test/sandbox/static/i18n/frontend.pot

    >>> ctl('i18n-init es ./test/sandbox --domain=frontend')
    creating catalog ./test/sandbox/static/i18n/es/LC_MESSAGES/frontend.po based on ./test/sandbox/static/i18n/frontend.pot


i18n-update
===========

The ``i18n-update`` command will update existing PO files based on new or
different strings found in the POT files::

    >>> ctl('help i18n-update')
    I18N-UPDATE - updates a translation locale based on an updated POT file
    Usage: rex i18n-update [<project-path>]
    <BLANKLINE>
    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    <BLANKLINE>
    Options:
      --domain=DOMAIN          : the gettext domain(s) to operate on; can choose from: backend, frontend
      --locale=LOCALE          : the locale to update; if not specified, all locales in the project are updated
    <BLANKLINE>


It takes one optional argument specifying the root path of the project::

    >>> output = Ctl('i18n-update ./test/sandbox').wait()
    >>> print('\n'.join([o for o in sorted(output.split('\n')) if o]))
    updating catalog ./test/sandbox/static/i18n/es/LC_MESSAGES/frontend.po based on ./test/sandbox/static/i18n/frontend.pot
    updating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.po based on ./test/sandbox/static/i18n/backend.pot
    updating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.po based on ./test/sandbox/static/i18n/frontend.pot


It also accepts options indicating which locale and/or domain to update::

    >>> ctl('i18n-update ./test/sandbox --domain=backend')
    updating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.po based on ./test/sandbox/static/i18n/backend.pot

    >>> ctl('i18n-update ./test/sandbox --locale=fr')
    updating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.po based on ./test/sandbox/static/i18n/backend.pot
    updating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.po based on ./test/sandbox/static/i18n/frontend.pot

    >>> ctl('i18n-update ./test/sandbox --locale=fr --domain=frontend')
    updating catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.po based on ./test/sandbox/static/i18n/frontend.pot


i18n-compile
============

The ``i18n-compile`` command will compile a project's PO files into the MO
files used by the runtime application::

    >>> ctl('help i18n-compile')
    I18N-COMPILE - compiles a translation locale for runtime use
    Usage: rex i18n-compile [<project-path>]
    <BLANKLINE>
    The project-path argument is the path to the project source repository. If
    not specified, it will assume the current directory.
    <BLANKLINE>
    Options:
      --domain=DOMAIN          : the gettext domain(s) to operate on; can choose from: backend, frontend
      --locale=LOCALE          : the locale to compile; if not specified, all locales in the project are compiled
    <BLANKLINE>


It takes one optional argument specifying the root path of the project::

    >>> output = Ctl('i18n-compile ./test/sandbox').wait()
    >>> print('\n'.join([o for o in sorted(output.split('\n')) if o]))
    compiling catalog ./test/sandbox/static/i18n/es/LC_MESSAGES/frontend.po to ./test/sandbox/static/i18n/es/LC_MESSAGES/frontend.mo
    compiling catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.po to ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.mo
    compiling catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.po to ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.mo


It also accepts options indicating which locale and/or domain to update::

    >>> ctl('i18n-compile ./test/sandbox --domain=backend')
    compiling catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.po to ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.mo

    >>> ctl('i18n-compile ./test/sandbox --locale=fr')
    compiling catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.po to ./test/sandbox/static/i18n/fr/LC_MESSAGES/backend.mo
    compiling catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.po to ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.mo

    >>> ctl('i18n-compile ./test/sandbox --locale=es')
    There was a failure when trying to compile domain: backend
    compiling catalog ./test/sandbox/static/i18n/es/LC_MESSAGES/frontend.po to ./test/sandbox/static/i18n/es/LC_MESSAGES/frontend.mo

    >>> ctl('i18n-compile ./test/sandbox --locale=fr --domain=frontend')
    compiling catalog ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.po to ./test/sandbox/static/i18n/fr/LC_MESSAGES/frontend.mo


