#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import get_settings, StrVal, IntVal, AnyVal
from rex.instrument.util import get_implementation
from rex.web import Parameter, authenticate

from copy import deepcopy
from .dumper import FancyDumper
import yaml

import yaml

__all__ = (
    'BaseResource',
    'get_instrument_user',
    'response_with_yaml',
    'payload_without_yaml',
    'ConstantArg',
)

def get_instrument_user(request):
    login = authenticate(request)
    user_impl = get_implementation('user')
    return user_impl.get_by_login(login)

def response_with_yaml(result):
    instrument = result['instrument_version']
    instrument['version'] = instrument['definition']['version']
    instrument['definition'] = \
        yaml.dump(instrument['definition'], Dumper=FancyDumper, \
                       default_flow_style=False)
    for name, form in result['forms'].items():
        form['configuration'] = \
            yaml.dump(form['configuration'], Dumper=FancyDumper, \
                           default_flow_style=False)
    return result

def payload_without_yaml(source):
    payload = deepcopy(source)
    payload['instrument_version']['definition'] = \
        AnyVal().parse(payload['instrument_version']['definition'])
    for name, form in payload.get('forms', {}).items():
        form['configuration'] = AnyVal().parse(form['configuration'])
    return payload

class ConstantArg(object):

    def __init__(self, name, value):
        self.name = name
        self.value = value

class BaseResource(object):
    base_parameters = (
        Parameter('uid', StrVal(), None),
        Parameter('offset', IntVal(0), 0),
        Parameter('limit', IntVal(1), 1000000),
    )

    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = None
    interface_package = 'instrument'
    extra_properties = []

    def get_or_404(self, user, uid):
        instance = user.get_object_by_uid(
            uid,
            self.interface_name,
            package_name=self.interface_package,
        )
        if not instance:
            raise HTTPNotFound()
        return instance

    def get_criteria(self, params, allowed_params):
        criteria = {}
        for allowed_param in allowed_params:
            if allowed_param in params:
                criteria[allowed_param] = params[allowed_param]
        return criteria

    def do_list(self, request, list_criteria=None, **kwargs):
        list_criteria = list_criteria or []
        list_criteria.extend(['limit', 'offset'])
        criteria = self.get_criteria(kwargs, list_criteria)

        user = get_instrument_user(request)
        instances = user.find_objects(
            self.interface_name,
            package_name=self.interface_package,
            **criteria
        )
        return [
            instance.as_dict(extra_properties=self.extra_properties)
            for instance in instances
        ]

    def do_retrieve(self, request, uid, extra_properties=None, **kwargs):
        user = get_instrument_user(request)
        instance = self.get_or_404(user, uid)
        return instance.as_dict(extra_properties=self.extra_properties)

    def get_arg_from_payload(self, arg, payload, required=False):
        if isinstance(arg, ConstantArg):
            return arg.name, arg.value
        elif isinstance(arg, tuple):
            name, impl = arg
        else:
            name, impl = arg, None

        if name in payload:
            value = payload[name]
            if impl:
                value = impl.get_by_uid(value)
                if not value:
                    raise HTTPBadRequest(
                        '%s is not the UID of a valid %s' % (
                            payload[name],
                            name,
                        )
                    )
            return name, value

        elif required:
            raise HTTPBadRequest(
                'Missing required parameter: %s' % (
                    name,
                )
            )

        else:
            return None, None

    def do_create(self, request, create_args=None, create_kwargs=None):
        create_args = create_args or []
        create_kwargs = create_kwargs or []

        cargs = []
        for create_arg in create_args:
            name, value = self.get_arg_from_payload(
                create_arg,
                request.payload,
                required=True,
            )
            cargs.append(value)

        ckwargs = {}
        for create_kwarg in create_kwargs:
            name, value = self.get_arg_from_payload(
                create_kwarg,
                request.payload,
            )
            if name and value:
                ckwargs[name] = value

        setting = getattr(
            get_settings(),
            '%s_implementation' % self.interface_package,
        )
        impl = getattr(
            setting,
            self.interface_name,
        )
        instance = impl.create(*cargs, **ckwargs)
        return instance.as_dict(extra_properties=self.extra_properties)

    def do_update(self, request, uid, properties=None):
        properties = properties or []

        user = get_instrument_user(request)
        instance = self.get_or_404(user, uid)

        updated = False
        for prop in properties:
            if isinstance(prop, ConstantArg):
                setattr(
                    instance,
                    prop.name,
                    prop.value,
                )
                updated = True
            if prop in request.payload:
                setattr(
                    instance,
                    prop,
                    request.payload[prop],
                )
                updated = True

        if updated:
            instance.save()

        return instance.as_dict(extra_properties=self.extra_properties)

    def do_delete(self, request, uid):
        user = get_instrument_user(request)
        instance = self.get_or_404(user, uid)
        instance.delete()

