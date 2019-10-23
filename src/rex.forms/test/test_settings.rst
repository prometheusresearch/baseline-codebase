********
Settings
********

.. contents:: Table of Contents


forms_implementation
====================

The default contents of the forms_implementation record will point to the
abstract interface classes, which, of course, are mostly useless::

    >>> from rex.core import Rex, get_settings
    >>> from rex.forms.interface import *

    >>> test = Rex('__main__', 'rex.forms', db='pgsql:demo.forms')
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(form=rex.forms.interface.form.Form, draftform=rex.forms.interface.draftform.DraftForm)
    >>> Form.get_implementation()
    rex.forms.interface.form.Form
    >>> DraftForm.get_implementation()
    rex.forms.interface.draftform.DraftForm
    >>> test.off()


Typically an app would have these implementations specified in its
``settings.yaml`` file::

    >>> test = Rex('__main__', 'rex.demo.forms')
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(form=rex.demo.forms.interface.DemoForm, draftform=rex.demo.forms.interface.DemoDraftForm)
    >>> Form.get_implementation()
    rex.demo.forms.interface.DemoForm
    >>> DraftForm.get_implementation()
    rex.demo.forms.interface.DemoDraftForm
    >>> test.off()


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.demo.forms', forms_implementation={'form': 'rex.demo.forms.interface.OtherDemoForm'})
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(form=rex.demo.forms.interface.OtherDemoForm, draftform=rex.demo.forms.interface.DemoDraftForm)
    >>> Form.get_implementation()
    rex.demo.forms.interface.OtherDemoForm
    >>> DraftForm.get_implementation()
    rex.demo.forms.interface.DemoDraftForm
    >>> test.off()


forms_presentation_adaptors
===========================

When specified in more than one place, this setting's values will be merged::

    >>> test = Rex('__main__', 'rex.demo.forms')
    >>> test.on()
    >>> get_settings().forms_presentation_adaptors
    {'chan135': ['demo'], 'demoapp': ['lookup'], 'lookupchannel': ['lookup']}
    >>> test.off()

    >>> test = Rex('__main__', 'rex.demo.forms', forms_presentation_adaptors={'chan135': ['lookup'], 'somethingelse': ['demo']})
    >>> test.on()
    >>> get_settings().forms_presentation_adaptors
    {'chan135': ['lookup'], 'demoapp': ['lookup'], 'lookupchannel': ['lookup'], 'somethingelse': ['demo']}
    >>> test.off()

