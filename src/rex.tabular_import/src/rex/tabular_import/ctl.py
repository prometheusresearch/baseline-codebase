#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from rex.core import Error
from rex.ctl import RexTask, argument, option, log

from .introspect import get_table_description
from .load import import_tabular_data
from .marshal import FILE_FORMATS, FILE_FORMAT_CSV, make_template


__all__ = (
    'TabularImportTemplateTask',
    'TabularImportTask',
)


def file_formats(value):
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
            file_formats,
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


class TabularImportTask(RexTask):
    """
    loads records from a flat file into a table in the database

    The tabular-import task will take the records described in a flat file
    (generally one based on a template from the tabular-import-template task)
    and load them into the specified table.
    """

    name = 'tabular-import'

    class arguments(object):  # noqa
        table = argument(str)
        data = argument(str)

    class options(object):  # noqa
        format = option(
            None,
            file_formats,
            default=FILE_FORMAT_CSV,
            value_name='FORMAT',
            hint='the format that the data file is in; if not specified, %s is'
            ' assumed' % (
                FILE_FORMAT_CSV,
            ),
        )
        use_defaults = option(
            None,
            bool,
            hint='whether or not the default values defined for non-primary'
            ' key fields should be used when null columns are received; by'
            ' default, this is disabled',
        )

    def __call__(self):
        try:
            file_content = open(self.data, 'rb').read()
        except Exception as exc:
            raise Error('Could not open "%s" for reading: %s' % (
                self.data,
                str(exc),
            ))

        with self.make():
            try:
                num_imported = import_tabular_data(
                    self.table,
                    file_content,
                    self.format,
                    use_defaults=self.use_defaults,
                )
            except Exception as exc:
                raise Error(str(exc))
            else:
                log('%s records imported into %s' % (
                    num_imported,
                    self.table,
                ))

