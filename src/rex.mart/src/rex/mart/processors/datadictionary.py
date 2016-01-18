#
# Copyright (c) 2015, Prometheus Research, LLC
#


from csv import DictReader
from StringIO import StringIO

from rex.core import Error, StrVal, MaybeVal

from ..fields import EnumerationSetField
from .base import Processor


__all__ = (
    'DataDictionaryProcessor',
)


# pylint: disable=no-self-use


class CsvVal(StrVal):
    def __init__(self, required_fields=None, *args, **kwargs):
        super(CsvVal, self).__init__(*args, **kwargs)
        self.required_fields = required_fields or []

    def __call__(self, data):
        value = super(CsvVal, self).__call__(data).strip()

        try:
            reader = DictReader(StringIO(value))
            for field in self.required_fields:
                if field not in reader.fieldnames:
                    raise Error('Missing required field "%s"' % (field,))
        except Error:
            raise
        except Exception as exc:
            raise Error('Invalid CSV input: %s' % (exc,))

        return value


class DataDictionaryProcessor(Processor):
    """
    Creates a set of tables that includes metadata about the tables and
    columns that were created in the Mart.

    This Processor accepts the following options:

    * ``table_name_tables``: The name of the table that will contain metadata
      records about Mart tables. Defaults to ``datadictionary_table``.
    * ``table_name_columns``: The name of the table that will contain metadata
      records about Mart columns. Defaults to ``datadictionary_column``.
    * ``table_name_enumerations``: The name of the table that will contain
      metadata records about enumeration values used in this Mart. Defaults to
      ``datadictionary_enumeration``.
    * ``table_descriptions``: A CSV-formatted string that contains table
      metadata that will override the automatically-discovered metadata.
      Expects input like::
            name,title,description
            mytable,My Table,A table containing things
            othertable,,My Description
    * ``column_descriptions``: A CSV-formatted string that contains column
      metadata that will override the automatically-discovered metadata.
      Expects input like::
            table,name,title,description,source,datatype
            mytable,mycolumn,My Column,A column for stuff,Special Database,text
            othertable,othercol,,Primary column for flags,Nowhere,
    """

    #:
    name = 'datadictionary'

    options = (
        ('table_name_tables', StrVal(), 'datadictionary_table'),
        ('table_name_columns', StrVal(), 'datadictionary_column'),
        ('table_name_enumerations', StrVal(), 'datadictionary_enumeration'),
        ('table_descriptions', MaybeVal(CsvVal(['name'])), None),
        ('column_descriptions', MaybeVal(CsvVal(['table', 'name'])), None),
    )

    def execute(self, options, interface):
        tables = dict()

        # Extract basic information from rex.deploy model
        model = interface.get_deploy_model()
        for table_model in model.tables():
            table = Table(table_model.label)
            table.title = table_model.title
            tables[table.name] = table

            for field_model in table_model.fields():
                column = Column(field_model.label)
                column.title = field_model.title
                if field_model.is_link:
                    column.datatype = 'link'
                else:
                    datatype = field_model.type
                    if isinstance(datatype, list):
                        column.datatype = 'enumeration'
                        column.enumerations = datatype
                    else:
                        column.datatype = datatype
                table.columns[column.name] = column

        # Extract information out of the Instrument definitions
        def extract_mapping_info(mapping):
            table = tables[mapping.table_name]
            table.title = mapping.title
            table.description = mapping.description

            for field in mapping.fields.values():
                if isinstance(field, EnumerationSetField):
                    # A little hacky, but since this mapping "field" actually
                    # results in multiple physical columns, we need to handle
                    # them separately.
                    for enum in field.enumerations:
                        column = \
                            table.columns[field.get_enum_target_name(enum)]
                        if field.title:
                            column.title = '%s (%s)' % (field.title, enum)
                        if field.description:
                            column.description = '%s (%s)' % (
                                field.description,
                                enum,
                            )
                        column.source = field.source

                else:
                    column = table.columns[field.target_name]
                    column.title = field.title
                    column.description = field.description
                    column.source = field.source

        for mapping in interface.get_assessment_mappings():
            extract_mapping_info(mapping)
            for child_mapping in mapping.children.itervalues():
                extract_mapping_info(child_mapping)

        # Load in configured overrides
        self.do_table_overrides(tables, options['table_descriptions'])
        self.do_column_overrides(tables, options['column_descriptions'])

        # Load the dictionary into the Mart
        facts = self.get_base_facts(options)
        for table in tables.values():
            facts += table.get_deploy_facts(options)
        interface.deploy_facts(facts)

    def do_table_overrides(self, tables, table_descriptions):
        if not table_descriptions:
            return

        reader = DictReader(StringIO(table_descriptions))
        for row in reader:
            if row['name'] not in tables:
                continue
            table = tables[row['name']]

            for attr in ('title', 'description'):
                if row.get(attr):
                    setattr(table, attr, row[attr])

    def do_column_overrides(self, tables, column_descriptions):
        if not column_descriptions:
            return

        reader = DictReader(StringIO(column_descriptions))
        for row in reader:
            if row['table'] not in tables:
                continue
            table = tables[row['table']]

            if row['name'] not in table.columns:
                continue
            column = table.columns[row['name']]

            for attr in ('title', 'description', 'source', 'datatype'):
                if row.get(attr):
                    setattr(column, attr, row[attr])

            if column.datatype != 'enumeration':
                column.enumerations = []

    def get_base_facts(self, options):
        facts = []

        # Table table
        facts.append({
            'table': options['table_name_tables'],
        })
        facts.append({
            'column': 'name',
            'of': options['table_name_tables'],
            'type': 'text',
            'required': True,
        })
        facts.append({
            'identity': ['name'],
            'of': options['table_name_tables'],
        })
        facts.append({
            'column': 'title',
            'of': options['table_name_tables'],
            'type': 'text',
            'required': False,
        })
        facts.append({
            'column': 'description',
            'of': options['table_name_tables'],
            'type': 'text',
            'required': False,
        })

        # Column table
        facts.append({
            'table': options['table_name_columns'],
        })
        facts.append({
            'link': 'table',
            'to': options['table_name_tables'],
            'of': options['table_name_columns'],
            'required': True,
        })
        facts.append({
            'column': 'name',
            'of': options['table_name_columns'],
            'type': 'text',
            'required': True,
        })
        facts.append({
            'identity': ['table', 'name'],
            'of': options['table_name_columns'],
        })
        facts.append({
            'column': 'title',
            'of': options['table_name_columns'],
            'type': 'text',
            'required': False,
        })
        facts.append({
            'column': 'description',
            'of': options['table_name_columns'],
            'type': 'text',
            'required': False,
        })
        facts.append({
            'column': 'source',
            'of': options['table_name_columns'],
            'type': 'text',
            'required': False,
        })
        facts.append({
            'column': 'datatype',
            'of': options['table_name_columns'],
            'type': 'text',
            'required': False,
        })

        # Enumeration table
        facts.append({
            'table': options['table_name_enumerations'],
        })
        facts.append({
            'link': 'column',
            'to': options['table_name_columns'],
            'of': options['table_name_enumerations'],
            'required': True,
        })
        facts.append({
            'column': 'name',
            'of': options['table_name_enumerations'],
            'type': 'text',
            'required': True,
        })
        facts.append({
            'identity': ['column', 'name'],
            'of': options['table_name_enumerations'],
        })

        return facts


class Table(object):
    def __init__(self, name, title=None, description=None):
        self.name = name
        self.title = title
        self.description = description
        self.columns = dict()

    def get_deploy_facts(self, options):
        facts = []

        facts.append({
            'data': [self.as_dict()],
            'of': options['table_name_tables'],
        })

        for column in self.columns.values():
            facts += column.get_deploy_facts(self.name, options)

        return facts

    def as_dict(self):
        return {
            'name': self.name,
            'title': self.title,
            'description': self.description,
        }


class Column(object):
    def __init__(
            self,
            name,
            title=None,
            description=None,
            source=None,
            datatype=None):
        self.name = name
        self.title = title
        self.description = description
        self.source = source
        self.datatype = datatype
        self.enumerations = []

    def get_deploy_facts(self, table_name, options):
        facts = []

        data = self.as_dict()
        data.update({
            'table': table_name,
        })
        facts.append({
            'data': [data],
            'of': options['table_name_columns'],
        })

        if self.enumerations:
            facts.append({
                'data': [
                    {
                        'column': '%s.%s' % (table_name, self.name),
                        'name': enum,
                    }
                    for enum in self.enumerations
                ],
                'of': options['table_name_enumerations'],
            })

        return facts

    def as_dict(self):
        return {
            'name': self.name,
            'title': self.title,
            'description': self.description,
            'source': self.source,
            'datatype': self.datatype,
        }

