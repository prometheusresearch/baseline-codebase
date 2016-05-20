
__all__ = (
    'double_string',
    'is_red',
)


def repeat_calc1(assessment, calculations):
    return calculations['calc1'] * 2


class RedChecker(object):
    def __init__(self, field_name):
        self.field_name = field_name

    def __call__(self, assessment, calculations):
        return assessment[self.field_name] == 'red'

is_q1_red = RedChecker('q1')

