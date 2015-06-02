Form fields
===========

Rex Widget uses :class:`rex.widget.FormField` data structure for configurable
form fields and datatable columns.

Define form field aliases
-------------------------

Sometimes it is useful to define new form field type as a preconfigured alias
for an existent field type. For example we might want to have ``sex`` field type
which is a preconfigured ``enum`` with ``male`` and ``female`` values.

To do that we need to subclass :class:`rex.widget.FormField` and override its
``__call__(self)`` method and ``type`` class attribute::

    from rex.widget import FormField

    class SexFormField(FormField):
    
        type = 'sex'
    
        def __call__(self):
            enum = EnumFormField(options=[
                {'value': 'male', 'label': 'Male'},
                {'value': 'female', 'label': 'Female'},
                {'value': 'not-known', 'label': 'Not Known'},
                {'value': 'not-applicable', 'label': 'Not Applicable'}
            ], **self.values)
            return enum()
