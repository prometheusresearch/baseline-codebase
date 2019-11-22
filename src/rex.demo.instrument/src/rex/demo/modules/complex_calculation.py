import math
from datetime import date

class Calculator(object):
    def __call__(self, assessment, calculations):
        computed = None
        if (not assessment['q_boolean'] \
                and assessment['q_date'] < date(2015, 6, 1)):
            computed = assessment['q_recordlist'][-1]['hello'] + ', ' + \
                assessment['q_matrix']['row2']['column2'] + ', ' + \
                str(math.trunc(assessment['q_float']))
        return str(computed)

complex_object_calc = Calculator()

def complex_function_calc(assessment, calculations):
    computed = None
    if 'white' in assessment['q_enumerationset'] \
            and 'red' not in assessment['q_enumerationset']:
        computed = assessment['q_recordlist'][-1]['hello'] + ', ' + \
            assessment['q_matrix']['row2']['column2'] + ', ' + \
            str(math.trunc(assessment['q_float']))
    return str(computed)


