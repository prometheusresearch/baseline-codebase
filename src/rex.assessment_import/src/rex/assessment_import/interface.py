from collections import OrderedDict
from copy import deepcopy

from rex.core import Error
from rex.instrument import InstrumentVersion
from rex.instrument.util import get_implementation


class FieldObjectAbstract(object):


    def add_field(self, instrument_definition, field_definition):
        field = self.get_field(instrument_definition, field_definition)
        self.fields[field.id] = field
        return field

    def get_field(self, instrument_definition, field_definition):
        field_type = field_definition['type']
        field_type = InstrumentVersion\
                        .get_full_type_definition(instrument_definition,
                                                  field_type)
        field_id = field_definition['id']
        base_type = field_type['base']
        description = field_definition.get('description')
        required = field_definition.get('required', False)
        field = Field(field_id, base_type, description, required)
        if base_type == 'recordList':
            for branch_field_definition in field_type['record']:
                field.add_field(instrument_definition, branch_field_definition)
        elif base_type == 'matrix':
            for row_definition in field_type['rows']:
                row_id = row_definition['id']
                required = row_definition.get('required', False)
                description = row_definition.get('description')
                for column_definition in field_type['columns']:
                    definition = deepcopy(column_definition)
                    column_id = definition['id']
                    definition['id'] = row_id + '_' + column_id
                    definition['description'] = description
                    definition['required'] = required
                    field.add_field(instrument_definition, definition)
                    field.add_row(row_id)
                    field.add_column(column_id)
        elif base_type in ('enumeration', 'enumerationSet'):
            for code, definition in field_type['enumerations'].items():
                field.add_enumeration(code, description)
        return field


class Instrument(FieldObjectAbstract):

    @classmethod
    def create(cls, instrument_version, default_tpl_fields):
        id = instrument_version.uid
        definition = instrument_version.definition
        instrument = Instrument(id, definition)
        for field_definition in definition['record']:
            field = instrument.add_field(definition, field_definition)
        instrument.add_template(instrument.id, instrument.fields,
                                default_tpl_fields)
        return instrument

    def __init__(self, id, definition):
        self.id = id
        self.title = definition.get('title')
        self.definition = definition
        self.fields = OrderedDict()
        self.templates = OrderedDict()

    def add_template(self, obj_tpl_name, fields, default_tpl_fields):
        template = self.templates.get(obj_tpl_name)
        if not template:
            template = ObjectTemplate(obj_tpl_name, self, [],
                                      default_tpl_fields)
        parent_name_list = template.parent_name_list
        for field_id, field in fields.items():
            data = OrderedDict()
            data['name'] = field_id
            data['type'] = [field.base_type]
            data['required'] = '(required)' if field.required else ''
            data['description'] = field.description or ''
            if field.base_type == 'enumeration':
                data['type'] = field.enumerations.keys()
                field.add_template(**data)
            elif field.base_type == 'enumerationSet':
                data['type'] = ['TRUE.FALSE']
                for id in field.enumerations:
                    data['name'] = enum_tpl_name = field.id + '_' + id
                    field.add_template(**data)
            elif field.base_type == 'recordList':
                rec_tpl_name  = obj_tpl_name + '.' + field.id
                rec_parent_name_list = parent_name_list + [field.id]
                rec_obj_template = ObjectTemplate(rec_tpl_name,
                                                  field,
                                                  rec_parent_name_list,
                                                  default_tpl_fields)
                self.templates[rec_tpl_name] = rec_obj_template
                self.add_template(rec_tpl_name, field.fields,
                                  default_tpl_fields)
            elif field.base_type == 'matrix':
                self.templates[obj_tpl_name] = template
                self.add_template(obj_tpl_name, field.fields,
                                  default_tpl_fields)
            else:
                field.add_template(**data)
            if field.base_type != 'recordList':
                template.add_field_output(field)
        self.templates[obj_tpl_name] = template



class Field(FieldObjectAbstract):

    def __init__(self, id, base_type, description, required):
        self.id = id
        self.base_type = base_type
        self.description = description
        self.required = required
        self.fields = OrderedDict()
        self.rows = []
        self.columns = []
        self.enumerations = OrderedDict()
        self.templates = OrderedDict()

    def add_row(self, id):
        self.rows.append(id)

    def add_column(self, id):
        self.columns.append(id)

    def add_enumeration(self, enumeration_id, description):
        self.enumerations[enumeration_id] = description

    def add_template(self, name, type, required, description):
        self.templates[name] = \
            template = FieldTemplate(name, type, required, description)
        return template


class FieldTemplate(object):

    def __init__(self, name, type, required, description):
        self.name = name
        self.type = type
        self.required = required
        self.description = description or ''
        formatted_string = '%(description)s\n%(type)s\n%(required)s' \
                           % {'description': description,
                              'type': type,
                              'required': required}
        self.formatted_string = formatted_string.strip()


class ObjectTemplate(object):

    def __init__(self, obj_tpl_name, obj, parent_name_list=[],
                 default_fields=OrderedDict()):
        self.obj_tpl_name = obj_tpl_name
        self.obj = obj
        self.output = self.blank_output(default_fields)
        self.parent_name_list = parent_name_list

    def blank_output(self, default_fields):
        output = OrderedDict()
        for (field_id, description) in default_fields.items():
            output[field_id] = description
        return output

    def add_field_output(self, field):
        for name, template in field.templates.items():
            self.output[name] = template.formatted_string


class Assessment(object):

    @classmethod
    def save(cls, instrument, obj_tpl_name, data, parameters):
        template = instrument.templates.get(obj_tpl_name)
        if not template:
            return None
        assessment, context = cls.validate(data, template, parameters)
        if not assessment:
            assessment = cls.create(instrument.id, data, context)
        return assessment

    @classmethod
    def validate(cls, data, template, parameters):
        obj_type = 'Instrument' if not template.parent_name_list else 'Field'
        assessment_id = data.get('assessment_id')
        required = ['subject', 'date']
        if 'assessment_id' not in data:
            raise Error("Expected field `assessment_id` not found"
                " in the assessment  data. Please, check the data given for"
                " %(obj_type)s `%(obj_name)s` of template `%(tpl_obj_name)s`."
                % {'obj_type': obj_type,
                   'obj_name': template.obj.id,
                   'tpl_obj_name': template.obj_tpl_name}
            )
        for field_name in required:
            if field_name not in data:
                raise Error("Expected field `%(field_name)s` not found"
                    " in the Assessment %(assessment_id)s data."
                    % {'field_name': field_name,
                       'assessment_id': ("`%s`" % assessment_id)
                                         if assessment_id else ''
                      }
                )
        for field_name in template.output:
            if field_name not in data:
                raise Error("Field '%(tpl_field_name)s' is expected"
                    " for %(obj_type)s '%(obj_id)s' not found in"
                    " the Assessment `%(assessment_id)s` data."
                    % {'tpl_field_name': field_name,
                       'obj_type': obj_type,
                       'obj_id': template.obj.id,
                       'assessment_id': assessment_id
                       }
                )
        context = OrderedDict()
        assessment_impl = get_implementation('assessment')
        assessment = assessment_impl.get_by_uid(assessment_id)
        if assessment:
            return assessment, context
        context_action = assessment_impl.CONTEXT_ACTION_CREATE
        try:
            context_impl = assessment_impl \
                .get_implementation_context(context_action)
        except Exception, exc:
            raise Error("Unable to get_implementation_context of an Assessment"
                " object.", exc)
        for param_name in context_impl:
            parameter = context_impl[param_name]
            param_value = data.get(param_name)
            if param_value is None:
                param_value = parameters.get(param_name)
            if parameter['required'] and ((param_value or None) is None):
                raise Error("Unnable to create Assessment"
                    " `%(assessment_id)s`" % {'assessment_id': assessment_id},
                    "Undefined required parameter `%(param_name)s`."
                    % {'param_name': param_name}
                    )
            validate = parameter['validator']
            try:
                validate(param_value)
            except Exception, exc:
                raise Error("Unnable to create Assessment `%(assessment_id)s`"
                    " parameter `%(param_name)s` got unexpected"
                    " value `%(param_value)s`."
                    % {'assessment_id': assessment_id,
                       'param_name': param_name,
                       'param_value': param_value},
                    exc
                )
            context[param_name] = param_value
        return assessment, context

    @classmethod
    def create(cls, instrument_version, data, context):
        assessment_impl = get_implementation('assessment')
        subject_impl = get_implementation('subject')
        subject_id = data.get('subject')
        subject = subject_impl.get_by_uid(subject_id)
        if not subject:
            subject = subject_impl.create(subject_id)
        else:
            print 'subject', subject
        evaluation_date = data.get('date')
        assessment_id = data.get('assessment_id')
        print 'create', assessment_id
        assessment = assessment_impl.create(
                                        subject,
                                        instrument_version,
                                        evaluation_date=evaluation_date,
                                        implementation_context=context)
        print assessment
        return assessment
