#
# Copyright (c) 2014, Prometheus Research, LLC
#


from .util import package_version


__all__ = (
    'get_assessment_meta',
    'set_assessment_meta',
    'set_assessment_application',
)


def get_assessment_meta(data, name, default=None):
    """
    Retrieves a metadata property from an Assessment Document.

    :param data: the Assessment Document to retrieve the property from
    :type data: dict
    :param name: the name of the property to retrieve
    :type name: string
    :param default:
        the value to return if the property does not exist; if not specified,
        defaults to ``None``
    :type default: string
    :returns:
        the value of the desired property from the Assessment Document, or the
        ``default`` value if the property does not exist
    """

    return data.get('meta', {}).get(name, default)


def set_assessment_meta(data, name, value):
    """
    Sets a metadata property on an Assessment Document.

    :param data: the Assessment Document to modify
    :type data: dict
    :param name: the name of the property to set
    :type name: string
    :param value: the value the property should be set to
    :type value: string
    """

    if 'meta' not in data:
        data['meta'] = {}
    data['meta'][name] = value


def set_assessment_application(data, name, version=None):
    """
    Adds (or updates) an application token to the ``application`` metadata
    property on an Assessment Document.

    :param data: the Assessment Document to modify
    :type data: dict
    :param name: the name of the application (typically the package name)
    :type name: string
    :param version:
        the version of the application; if not specified this method will
        attempt to find the version of the package `name`, otherwise it
        will use '?'
    :type version: string
    :returns: the full, updated application metadata property value
    """

    if not version:
        version = package_version(name) or '?'

    current_tokens = get_assessment_meta(data, 'application', '').split()
    new_tokens = []

    updated = False
    for token in current_tokens:
        if token.startswith('%s/' % name):
            new_tokens.append('%s/%s' % (name, version))
            updated = True
        else:
            new_tokens.append(token)
    if not updated:
        new_tokens.append('%s/%s' % (name, version))

    application = ' '.join(new_tokens)
    set_assessment_meta(data, 'application', application)

    return application

