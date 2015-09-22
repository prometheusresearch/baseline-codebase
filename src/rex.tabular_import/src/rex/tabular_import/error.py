#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.error import Error as HTSQLError
from rex.core import Error


__all__ = (
    'TabularImportError',
)


class TabularImportError(Error):
    """
    An exception indicating a failure to import records into a table.
    """

    HTSQL_IGNORED_PARAGRAPHS = (
        'While processing',
        'While inserting a record',
    )

    #: A list of dictionaries describing the per-row errors that occurred.
    row_errors = []

    def __init__(self, message=None, payload=None):
        super(TabularImportError, self).__init__(
            message or 'Errors occurred while importing the records',
            payload=payload,
        )
        self.row_errors = []

    def add_row_error(self, row, index, message):
        if isinstance(message, HTSQLError):
            message = self._massage_htsql_error(message)

        self.row_errors.append({
            'row': row,
            'index': index,
            'message': message,
        })

    def _massage_htsql_error(self, error):
        parts = []
        for paragraph in error.paragraphs:
            if paragraph.message not in self.HTSQL_IGNORED_PARAGRAPHS:
                if paragraph.quote:
                    parts.append('%s: %s' % (
                        paragraph.message,
                        paragraph.quote.strip(),
                    ))
                else:
                    parts.append(paragraph.message)
        return ', '.join(parts)

    def __str__(self):
        parts = [str(self.paragraphs[0])]
        parts.append('\n'.join([
            '    %s: %s' % (
                error['index'],
                error['message'],
            )
            for error in self.row_errors
        ]))
        parts.extend([str(paragraph) for paragraph in self.paragraphs[1:]])
        return '\n'.join([part for part in parts if part])

