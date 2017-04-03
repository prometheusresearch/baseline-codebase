
import mimetypes
from webob import Response

from rex.widget import (
        Widget, Field, responder, FormField, EnumFormField, RequestURL)
from rex.core import SeqVal, MaybeVal, RecordVal, StrVal, OneOfVal, ChoiceVal

from .introspect import get_table_description
from .load import import_tabular_data
from .marshal import (
        make_template,
        FILE_FORMATS,
        FILE_FORMAT_CSV,
        FILE_FORMAT_TSV,
        FILE_FORMAT_XLS)


class SelectImportTableField(FormField):

    type='select_import_table'

    fields = (
        ('tables', SeqVal(StrVal())),
    )

    def widget(self):
        # TODO: table titles / check table existance
        return SelectImportTableWidget(tables=self.tables)


class SelectImportTableWidget(Widget):

    js_type = 'rex-tabular-import/lib/SelectImportTable'

    tables = Field(SeqVal(StrVal()))

    _validate_table = StrVal('^[a-zA-Z0-9-\.\(\)_]+$')
    _validate_tabular_format = ChoiceVal(FILE_FORMAT_CSV,
                                         FILE_FORMAT_XLS,
                                         FILE_FORMAT_TSV)

    @responder(url_type=RequestURL)
    def template(self, req):
        format = req.GET.pop('format', None)
        table = req.GET.pop('table', None)
        if table is None or format is None:
            return Response(status=400,
                        json='{"error": "Required parameters not provided"}')
        table = self._validate_table(table)
        format = self._validate_tabular_format(format)
        description = get_table_description(table)
        if not description:
            raise Error('No table named "%s" exists' % table)
        template = make_template(description, format)
        filename = '%s-template.%s' % (table, format.lower())
        content_type, _ = mimetypes.guess_type(filename)
        return Response(
                body=template,
                content_type=(content_type or 'application/octet-stream'),
                content_disposition=('attachment; filename=%s' % filename))
