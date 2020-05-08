#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.instrument.util import get_implementation
from rex.web import authenticate


__all__ = (
    'get_instrument_user',
    'sanitize_instrument_id',
    'get_instrument_version',
)


def get_instrument_user(request):
    login = authenticate(request)
    user_impl = get_implementation('user')
    return user_impl.get_by_login(login)


def sanitize_instrument_id(identifier):
    parts = identifier.split(':')
    return '_'.join(parts[1:])


def get_instrument_version(identifier, version):
    instrument_id = sanitize_instrument_id(identifier)

    inst_impl = get_implementation('instrument')
    instrument = inst_impl.get_by_uid(instrument_id)
    if not instrument:
        return None

    iv_impl = get_implementation('instrumentversion')
    vers = iv_impl.find(instrument=instrument.uid)
    for ver in vers:
        if ver.definition['version'] == version:
            return ver

    return None

