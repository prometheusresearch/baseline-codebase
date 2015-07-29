
__all__ = (
    'age_in_months',
    'is_red'
)

def age_in_months(assessment, calculations):
    return assessment.get('q_age', 0)*12


class IsRedObject(object):
    def __call__(self, assessment, calculations):
        if not assessment['q_color']:
            return False
        return (assessment['q_color'].lower() == u'red')

is_red = IsRedObject()

