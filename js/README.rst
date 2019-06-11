JS
==

Testing
-------

Tests are being run with jest_::

   % make test

To add a new test create a ``*.test.js`` file alongside a module you are
testing. For example::

   MyComponent.js
   MyComponent.test.js

.. _jest: https://jestjs.io

Linting
-------

We use flow_ to check code for errors::

   % make check

.. _flow: https://flow.org
