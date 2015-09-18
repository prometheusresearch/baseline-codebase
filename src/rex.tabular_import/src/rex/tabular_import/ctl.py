#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from rex.core import Error
from rex.ctl import RexTask, argument, option

from .introspect import get_table_description
from .marshal import FILE_FORMATS, FILE_FORMAT_CSV, make_template


__all__ = (
    'TabularImportTemplateTask',
)


def output_formats(value):
    value = value.upper()
    if value in FILE_FORMATS:
        return value
    raise ValueError('Invalid format type "%s" specified' % value)


class TabularImportTemplateTask(RexTask):
    """
    creates a template file that can be used with the tabular-import task

    The tabular-import-template task will create a template file that contains
    a skeleton structure and field information about the table you wish to
    import data into.
    """

    name = 'tabular-import-template'

    class arguments(object):  # noqa
        table = argument(str)

    class options(object):  # noqa
        output = option(
            None,
            str,
            default=None,
            value_name='OUTPUT_FILE',
            hint='the file to write to; if not specified, stdout is used',
        )
        format = option(
            None,
            output_formats,
            default=FILE_FORMAT_CSV,
            value_name='FORMAT',
            hint='the format to output the template in; can be %s; if not'
            ' specified, defaults to %s' % (
                ', '.join(FILE_FORMATS),
                FILE_FORMAT_CSV,
            ),
        )

    def __call__(self):
        with self.make():
            description = get_table_description(self.table)
        if not description:
            raise Error('No table named "%s" exists' % self.table)

        if self.output:
            try:
                output = open(self.output, 'wb')
            except Exception as exc:
                raise Error('Could not open "%s" for writing: %s' % (
                    self.output,
                    str(exc),
                ))
        else:
            output = sys.stdout

        template = make_template(description, self.format)
        output.write(template)

