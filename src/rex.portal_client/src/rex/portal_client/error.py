
import re

class PortalClientError(Exception):
    pass

class PortalError(Exception):
    pass

class TaskAlreadySubmitted(Exception):
    pass

class PatientPortalClientError(Exception):
    pass

def raise_portal_error(data):
    error = data['error']
    if error.startswith('Specified host_system_id already exists') \
    and 'While creating Task for submission' in error:
        raise TaskAlreadySubmitted(error)
    else:
        raise PortalError(error)
