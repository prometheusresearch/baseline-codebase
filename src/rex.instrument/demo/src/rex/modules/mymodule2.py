# mymodule.py

class Calculator(object):
    def __call__(self, assessment, calculations):
        return assessment['q_float'] + assessment['q_integer']

my_calculation = Calculator()
