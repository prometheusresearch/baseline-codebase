#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import StrVal, BoolVal
from rex.restful import SimpleResource
from rex.web import Parameter

from .base import get_instrument_user, response_with_yaml, \
                  payload_without_yaml

__all__ = (
    'SetResource',
)

def get_instrument_version(user, uid):
    div = user.get_object_by_uid(uid, 'instrumentversion')
    if not div:
        raise HTTPNotFound()
    return div


def get_forms(user, instrument_version):
    return user.find_objects(
        'form',
        package_name='forms',
        instrument_version=instrument_version,
    )

def get_channels(user):
    return user.find_objects(
        'channel',
        package_name='forms',
    )

class SetResource(SimpleResource):
    # base_path = '/api/set'
    path = '/api/set/{instrumentversion_uid}'
    parameters = (
        Parameter('instrumentversion_uid', StrVal()),
        Parameter('with_yaml', BoolVal(), False)
    )

    def make_forms_dict(self, forms):
        result = {}
        for form in forms:
            result[form.channel.uid] = form.as_dict(
                extra_properties=['configuration'],
            )
        return result

    def retrieve(self, request, instrumentversion_uid, with_yaml, **kwargs):
        user = get_instrument_user(request)
        div = get_instrument_version(
            user,
            instrumentversion_uid,
        )
        forms = get_forms(user, div)
        result = {
            'instrument_version': div.as_dict(extra_properties=['definition']),
            'forms': self.make_forms_dict(forms),
        }
        if with_yaml:
            return response_with_yaml(result)
        return result

