"""

    rex.widget.column
    =================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Validate

from .formfield import FormFieldVal

__all__ = ('ColumnVal',)


class ColumnVal(Validate):
    """ Validator for column specifications.
    """

    _validate = FormFieldVal()

    def __call__(self, value):
        return self._validate(value)
