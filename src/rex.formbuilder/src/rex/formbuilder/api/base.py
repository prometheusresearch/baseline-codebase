#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import get_settings, StrVal, IntVal
from rex.web import Parameter, authenticate
from rex.instrument import User


__all__ = (
    'BaseResource',
    'get_instrument_user',
    'ConstantArg',
    'FakeRequest',
)


def get_instrument_user(request):
    login = authenticate(request)
    return User.get_implementation().get_by_login(login)


class ConstantArg(object):
    def __init__(self, name, value):
        self.name = name
        self.value = value


class FakeRequest(object):
    def __init__(self, payload, user):
        self.payload = payload
        self.environ = {
            'rex.user': user.login
        }


class BaseResource(object):
    base_parameters = (
        Parameter('uid', StrVal(), None),
        Parameter('offset', IntVal(0), 0),
        Parameter('limit', IntVal(1), 100),
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
        # pylint: disable=no-self-use

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

    def do_retrieve(self, request, uid):
        # pylint: disable=no-self-use

        user = get_instrument_user(request)
        instance = self.get_or_404(user, uid)
        return instance.as_dict(extra_properties=self.extra_properties)

    def get_arg_from_payload(self, arg, payload, required=False):
        # pylint: disable=no-self-use

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

            if prop in request.payload:
                setattr(
                    instance,
                    prop,
                    request.payload[prop],
                )
                updated = True

        if updated:
            if hasattr(instance, 'modify'):
                instance.modify(user)
            instance.save()

        return instance.as_dict(extra_properties=self.extra_properties)

    def do_delete(self, request, uid):
        user = get_instrument_user(request)
        instance = self.get_or_404(user, uid)
        instance.delete()

