from rex.core import Error

__all__ = (
    'AssessmentImportError',
)

class AssessmentImportError(Error):

    def __init__(self, message, payload=None, template_id=None):
        self.message = message
        self.template_id = template_id
        super(AssessmentImportError, self).__init__(message, payload=payload)

