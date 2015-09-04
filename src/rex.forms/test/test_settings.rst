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

    >>> test = Rex('__main__', 'rex.forms')
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

    >>> test = Rex('__main__', 'rex.forms_demo')
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(form=rex.forms_demo.DemoForm, draftform=rex.forms_demo.DemoDraftForm)
    >>> Form.get_implementation()
    rex.forms_demo.DemoForm
    >>> DraftForm.get_implementation()
    rex.forms_demo.DemoDraftForm
    >>> test.off()


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.forms_demo', forms_implementation={'form': 'rex.forms_demo.OtherDemoForm'})
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(form=rex.forms_demo.OtherDemoForm, draftform=rex.forms_demo.DemoDraftForm)
    >>> Form.get_implementation()
    rex.forms_demo.OtherDemoForm
    >>> DraftForm.get_implementation()
    rex.forms_demo.DemoDraftForm
    >>> test.off()

