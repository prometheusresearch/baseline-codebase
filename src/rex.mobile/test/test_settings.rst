********
Settings
********

.. contents:: Table of Contents


mobile_implementation
=====================

The default contents of the mobile_implementation record will point to the
abstract interface classes, which, of course, are mostly useless::

    >>> from rex.core import Rex, get_settings
    >>> from rex.mobile.interface import *

    >>> test = Rex('__main__', 'rex.mobile', db='pgsql:mobile_demo')
    >>> test.on()
    >>> get_settings().mobile_implementation
    Record(interaction=rex.mobile.interface.interaction.Interaction)
    >>> Interaction.get_implementation()
    rex.mobile.interface.interaction.Interaction
    >>> test.off()


Typically an app would have these implementations specified in its
``settings.yaml`` file::

    >>> test = Rex('__main__', 'rex.mobile_demo')
    >>> test.on()
    >>> get_settings().mobile_implementation
    Record(interaction=rex.mobile_demo.DemoInteraction)
    >>> Interaction.get_implementation()
    rex.mobile_demo.DemoInteraction
    >>> test.off()


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.mobile_demo', mobile_implementation={'interaction': 'rex.mobile_demo.OtherDemoInteraction'})
    >>> test.on()
    >>> get_settings().mobile_implementation
    Record(interaction=rex.mobile_demo.OtherDemoInteraction)
    >>> Interaction.get_implementation()
    rex.mobile_demo.OtherDemoInteraction
    >>> test.off()

