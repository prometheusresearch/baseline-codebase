from rex.widget import Widget, WidgetComposition, Field, computed_field
from .wizard import table_wizard, root_wizard, get_schema
from rex.core import IntVal


class DBGUI(Widget):

    name = 'DBGUI'
    js_type = 'rex-dbgui/lib/DBGUI'

    table_segment = Field(IntVal(), default=None,
                          doc='Which PATH_INFO segment is used for table name')

    def get_path_table(self, req):
        parts = req.path_info.split('/')
        table = None
        path = req.path_url
        if self.table_segment is not None and self.table_segment < len(parts):
            table = parts[self.table_segment]
            path = req.application_url \
                   + '/'.join(parts[0:self.table_segment])
        return path, table

    @computed_field
    def wizard(self, req):
        base_path, table = self.get_path_table(req)
        if table is not None:
            schema = get_schema()
            if not any(t for t in schema.tables() if t.label == table):
                table = None
        proxy = root_wizard() if table is None else table_wizard(table)
        return proxy.wizard

    @computed_field
    def base_url(self, req):
        return self.get_path_table(req)[0]
