# mymodule.py

class Calculator(object):
    def __call__(self, instrumentversion, assessment, calculations):
        return assessment['q_float'] + assessment['q_integer']

my_calculation = Calculator()
