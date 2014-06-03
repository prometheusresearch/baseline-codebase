*********************************
REX.FORMBUILDER Programming Guide
*********************************

.. contents:: Table of Contents


Overview
========

This is a web-based application for configuring instruments for use in the
rex.acquire application.

Settings
========

Overriding of the default ``rex.formbuilder`` page configuration in
``rex.urlmap`` format can be done by the ``rex_formbuilder_overrides`` setting
in the ``settings.yaml`` project file.

Example::

    rex_formbuilder_overrides: my.project:/path/to/custom.yaml
