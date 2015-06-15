#
# Copyright (c) 2015, Prometheus Research, LLC
#


from datetime import datetime
from importlib import import_module

from prismh.core.validation.instrument import get_full_type_definition
from rex.core import get_settings, Extension
from rex.db import get_db

from ..errors import InstrumentError


__all__ = (
    'CalculationMethod',
    'PythonCalculationMethod',
    'HtsqlCalculationMethod',
)


class CalculationMethod(Extension):
    """
    An extension that allows a developer to add support for new Calculation Set
    methods.
    """

    #: The name of the calculation as referenced by the ``method`` property in
    #: a Calculation Set Definition.
    name = None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'CalculationMethod':
            assert cls.__call__ != CalculationMethod.__call__, \
                'abstract method %s.__call__()' % cls

    def __call__(
            self,
            options,
            assessment,
            previous_results=None,
            scope_additions=None):
        """
        Executes the specified calculation.

        Must be implemented by concrete classes.

        :param options:
            the ``options`` from the Calculation Set Definition calculation
        :type options: dict
        :param assessment: the Assessment to execute the calculation on
        :type assessment: Assessment
        :param previous_results:
            the results of previous calculations executed on this Assessment
        :type previous_results: dict
        :param scope_additions:
            a dictionary containing the extra scope names and values to inject
            into the execution context
        :type scope_additions: dict
        """

        raise NotImplementedError()

    def flatten_assessment_data(self, assessment):
        """
        Returns a dictionary that contains the Assessment's values, without any
        of the Assessment metadata or extraneous structures.

        :param assessment: the Assessment containing the data the flatten
        :type assessment: Assessment
        :rtype: dict
        """

        data = {}
        definition = assessment.instrument_version.definition

        for field in definition['record']:
            field_id = field['id']
            field_type = field['type']
            field_value = assessment.data['values'][field_id]['value']
            data[field_id] = self.get_value(
                field_value,
                field_type,
                definition,
            )

        return data

    def get_value(self, field_value, field_type, definition):
        """
        Retrieves a normalized/deserialized value from an Assessment value.

        :param field_value: the field's value from the Assessment
        :param field_type:
            the type description of the field from the Instrument Definition
        :type field_type: str or dict
        :param definition:
            the Instrument Definition that corresponds to the Asssessment
        :type definition: dict
        """

        if field_value is None:
            return None

        type_def = get_full_type_definition(definition, field_type)

        if type_def['base'] == 'date':
            value = datetime.strptime(field_value, '%Y-%m-%d').date()

        elif type_def['base'] == 'time':
            value = datetime.strptime(field_value, '%H:%M:%S').time()

        elif type_def['base'] == 'dateTime':
            value = datetime.strptime(field_value, '%Y-%m-%dT%H:%M:%S')

        elif type_def['base'] == 'matrix':
            matrix = {}
            for row in field_type['rows']:
                matrix[row['id']] = {}
                for column in field_type['columns']:
                    matrix[row['id']][column['id']] = self.get_value(
                        field_value[row['id']][column['id']]['value'],
                        column['type'],
                        definition,
                    )
            value = matrix

        elif type_def['base'] == 'recordList':
            recs = []
            for record in field_value:
                rec = {}
                for subfield in type_def['record']:
                    subfield_id = subfield['id']
                    subfield_type = subfield['type']
                    subfield_value = record[subfield_id]['value']
                    rec[subfield_id] = self.get_value(
                        subfield_value,
                        subfield_type,
                        definition,
                    )
                recs.append(rec)
            value = recs

        else:
            value = field_value

        return value


class PythonCalculationMethod(CalculationMethod):
    """
    Implements the Python calculation method. Allows for calculations to be
    supplied as either expressions or as named callables which are imported
    and executed.
    """

    #:
    name = 'python'

    def __call__(
            self,
            options,
            assessment,
            previous_results=None,
            scope_additions=None):
        previous_results = previous_results or {}
        scope_additions = scope_additions or {}
        result = None

        assessment_data = self.flatten_assessment_data(assessment)
        callable_opt = options.get('callable')
        expression_opt = options.get('expression')

        if callable_opt:
            result = self.execute_callable(
                callable_opt,
                assessment_data,
                previous_results,
                scope_additions,
            )

        elif expression_opt:
            result = self.execute_expression(
                expression_opt,
                assessment_data,
                previous_results,
                scope_additions,
            )

        return result

    def execute_callable(
            self,
            callable_opt,
            assessment,
            previous_results,
            scope_additions):
        if '.' not in callable_opt:
            raise InstrumentError("Unexpected callable %(callable)s:"
                                  " module name is expected."
                                  % {'callable': callable_opt})
        callable_module_path, callable_obj_name = \
                                    callable_opt.rsplit('.', 1)
        try:
            callable_module = import_module(callable_module_path)
        except ImportError, exc:
            raise InstrumentError("Unexpected callable %(callable)s:"
                    " unable to import module %(module)s: %(exc)s."
                    % {'callable': callable_opt,
                       'module': callable_module_path,
                       'exc': exc
                      })
        try:
            callable_obj = getattr(callable_module, callable_obj_name)
        except AttributeError, exc:
            raise InstrumentError("Unexpected callable %(callable)s: "
                        "suitable callable object not found: %(exc)s"
                        % {'callable': callable_opt, 'exc': exc})
        if not callable(callable_obj):
            raise InstrumentError("Unexpected callable option %(callable)s:"
                    " %(name)s is not callable."
                    % {'callable': callable_opt, 'name': callable_obj_name})

        used_additional_scope = []
        for name, value in scope_additions.items():
            if name not in __builtins__:
                __builtins__[name] = value
                used_additional_scope.append(name)
        try:
            result = callable_obj(assessment, previous_results)
        except Exception, exc:
            raise InstrumentError("Execution of %(callable)s failed: %(exc)s"
                                  % {'callable': callable_opt, 'exc': exc})
        finally:
            for name in used_additional_scope:
                if name in __builtins__:
                    del __builtins__[name]

        return result

    def execute_expression(
            self,
            expression_opt,
            assessment,
            previous_results,
            scope_additions):
        method_locals = scope_additions
        method_locals['assessment'] = assessment
        method_locals['calculations'] = previous_results

        default_modules = \
            get_settings().instrument_calculationmethod_default_module_list
        for module_name in default_modules:
            try:
                module = import_module(module_name)
                method_locals[module_name] = module
            except ImportError, exc:
                raise InstrumentError("Got unexpected module %(module)s"
                    " from setting"
                    " 'instrument_calculationmethod_default_module_list'"
                    % {'module': module_name})

        try:
            return eval(expression_opt, {}, method_locals)
        except Exception, exc:
            raise InstrumentError(
                "Unable to calculate expression %(expr)s: %(exc)s"
                % {'expr': expression_opt, 'exc': exc})


class HtsqlCalculationMethod(CalculationMethod):
    """
    Implements the HTSQL calculation method. Allows for calculations to be
    specified as expressions.
    """

    #:
    name = 'htsql'

    def flatten_assessment_data(self, assessment):
        flat = super(HtsqlCalculationMethod, self).flatten_assessment_data(
            assessment,
        )

        definition = assessment.instrument_version.definition

        for field in definition['record']:
            type_def = get_full_type_definition(definition, field['type'])

            if type_def['base'] == 'recordList':
                del flat[field['id']]

            elif type_def['base'] == 'matrix':
                matrix = flat[field['id']]
                del flat[field['id']]

                for row in matrix.keys():
                    for column in matrix[row].keys():
                        new_id = field['id'] + '_' + row + '_' + column
                        flat[new_id] = matrix[row][column]

        return flat

    def __call__(
            self,
            options,
            assessment,
            previous_results=None,
            scope_additions=None):
        previous_results = previous_results or {}
        scope_additions = scope_additions or {}

        parameters = {}
        parameters.update(scope_additions)
        parameters.update(self.flatten_assessment_data(assessment))
        parameters.update(previous_results)

        db = get_db()
        try:
            product = db.produce(options['expression'], **parameters)
            return product.data
        except Exception, exc:
            raise InstrumentError("Unexpected htsql %(htsql)s: %(exc)s"
                                  % {'htsql': options['expression'],
                                     'exc': exc})

