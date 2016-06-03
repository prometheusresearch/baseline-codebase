

from rex.widget import formfield

class DbguiEntityField(formfield.EntityFormField):

    type = 'dbgui_entity'

    def widget(self):
        return DbguiEntityLink(_data=self.data)


class DbguiEntityLink(formfield.AutocompleteField):

    js_type = 'rex-dbgui/lib/DbguiEntityField'
