from rex.core import Error

__all__ = (
    'AssessmentImportError',
    'AssessmentValidationError',
)

class AssessmentImportError(Error):

    def __init__(self, message, payload=None, template_id=None):
        self.message = message
        self.template_id = template_id
        super(AssessmentImportError, self).__init__(message, payload=payload)


class AssessmentValidationError(Error):

    def __init__(self, message, payload=None):
        self.message = message
        super(AssessmentValidationError, self).__init__(message, payload=payload)

