*****************************
REX.LOGGING Programming Guide
*****************************

.. contents:: Table of Contents


Overview
========

This package is a convenience wrapper around the `Python Logging`_ framework
that allows you to perform logging configuration through RexDB application
settings.

.. _`Python Logging`: https://docs.python.org/2/library/logging.html

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Usage
=====

Basic usage of this package is very simple. Just call the ``get_logger()``
function and use the returned `Logger object`_ to output your messages.

.. _`Logger object`: https://docs.python.org/2/library/logging.html#logger-objects

::

    >>> from rex.core import Rex
    >>> from rex.logging import get_logger

    >>> with Rex('rex.logging'):
    ...     logger = get_logger()
    ...     logger.debug('debug message')
    ...     logger.info('info message')
    ...     logger.warning('warn message')
    ...     logger.error('error message')
    ...     logger.critical('critical message')
    INFO:root:info message
    WARNING:root:warn message
    ERROR:root:error message
    CRITICAL:root:critical message


Settings
========

``rex.logging`` provides the following settings:

* ``logging_formatters``
* ``logging_filters``
* ``logging_handlers``
* ``logging_loggers``
* ``logging_root``

Each of these settings corresponds to a section of the `Python Logging
configuration`_ dictionary. All values of these settings across an application
instance will be merged and automatically loaded into the `Python Logging
framework`_.

.. _`Python Logging configuration`: https://docs.python.org/2/library/logging.config.html#configuration-dictionary-schema
.. _`Python Logging framework`: https://docs.python.org/2/library/logging.html

By default, the ``rex.logging`` package provides the following configuration:

``logging_formatters``
    Three formatters are defined; ``brief``, ``basic``, and ``detailed``. The
    messages they output look like the following:

    ``brief``
        ``<message>``

    ``basic``
        ``<level>:<logger name>:<message>``

    ``detailed``
        ``<datetime>|<PID>|<thread name>|<logger name>|<level>|<message>``

``logging_handlers``
    One handler is defined named ``console``, which outputs the log messages to
    standard out in ``basic`` format.

``logging_root``
    The root logger is configured to log at level ``INFO`` and uses the
    ``console`` handler.

