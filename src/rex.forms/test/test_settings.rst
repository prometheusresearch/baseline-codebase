********
Settings
********

.. contents:: Table of Contents


The default contents of the s_implementation record will point to the
abstract interface classes, which, of course, are mostly useless::

    >>> from rex.core import Rex, get_settings
    >>> test = Rex('__main__', 'rex.forms')
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(channel=rex.forms.interface.channel.Channel, form=rex.forms.interface.form.Form, task=rex.forms.interface.task.Task, entry=rex.forms.interface.entry.Entry, draftform=rex.forms.interface.draftform.DraftForm)


Typically an app would have these implementations specified in its
``settings.yaml`` file::

    >>> test = Rex('__main__', 'rex.forms_demo')
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(channel=rex.forms_demo.DemoChannel, form=rex.forms_demo.DemoForm, task=rex.forms_demo.DemoTask, entry=rex.forms_demo.DemoEntry, draftform=rex.forms_demo.DemoDraftForm)


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.forms_demo', forms_implementation={'channel': 'rex.forms_demo.OtherDemoChannel'})
    >>> test.on()
    >>> get_settings().forms_implementation
    Record(channel=rex.forms_demo.OtherDemoChannel, form=rex.forms_demo.DemoForm, task=rex.forms_demo.DemoTask, entry=rex.forms_demo.DemoEntry, draftform=rex.forms_demo.DemoDraftForm)

