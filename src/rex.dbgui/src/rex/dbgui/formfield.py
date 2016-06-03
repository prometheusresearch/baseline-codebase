

from rex.core import StrVal
from rex.widget import formfield, Field

class DbguiEntityField(formfield.EntityFormField):

    type = 'dbgui_entity'

    def widget(self):
        return DbguiEntityLink(_data=self.data, table=self.data.entity)


class DbguiEntityLink(formfield.AutocompleteField):

    js_type = 'rex-dbgui/lib/DbguiEntityField'

    table = Field(StrVal())
