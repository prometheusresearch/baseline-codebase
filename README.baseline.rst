********
Baseline
********

This codebase houses the base RexDB Platform components.


Demo
====
Unless otherwise overridden by a descendent codebase, you can launch the
built-in demo application by doing::

    $ make init
    $ ./bin/rex --config=demo.baseline.yaml deploy
    $ make start

The application can then be accessed at: `<http://localhost:8080/>`_


Forms Demo
==========
To launch the ``rex.forms`` demo app (after ``make init`` has occurred)::

    $ ./bin/rex --config=demo.forms.yaml deploy
    $ ./bin/rex --config=demo.forms.yaml serve-uwsgi

The application can then be accessed at: `<http://localhost:8080/@forms>`_


Documentation
=============
After initializing this codebase (``make init``), documentation for this
codebase can be found at: `<http://localhost:8080/doc/>`_

