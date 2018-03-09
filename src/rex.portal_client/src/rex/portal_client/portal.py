

from rex.core import cached, get_settings as get_app_settings
import requests
import functools
from .setting import PortalClient
from .error import PatientPortalClientError


@cached
def get_settings():
    settings = get_app_settings().portal_client
    if settings is None:
        raise PatientPortalClientError(
            "Communication settings for Patient Portal are not specified.\n"
            + PortalClient.__doc__
        )
    return settings

@cached
def get_session():
    settings = get_settings()
    s = requests.Session()
    s.headers.update({
        'X-Portal-API-Key': settings.api_key
    })
    if settings.client_certificate:
        s.cert = settings.client_certificate
    return s

def get_url(endpoint):
    assert endpoint.startswith('/')
    settings = get_settings()
    host = settings.url[0:-1] if settings.url.endswith('/') else settings.url
    return host + endpoint

def run(method, endpoint, params, payload=None):
    settings = get_settings()
    url = get_url(endpoint)
    req = getattr(get_session(), method)
    args = {'params': params, 'timeout': settings.timeout}
    if payload is not None:
        args['json'] = payload
    try:
        response = req(url, **args)
    except requests.exceptions.RequestException as e:
        raise PatientPortalClientError('ERROR/Network: ' + str(e))
    if response.status_code in (200, 201, 202):
        return response.json()
    elif response.status_code == 204:
        return
    else:
        if response.status_code == 400:
            error = response.json()['error']
        else:
            error = response.text
        raise PatientPortalClientError('ERROR/Portal: ' + error)

get = functools.partial(run, 'get')
post = functools.partial(run, 'post')
put = functools.partial(run, 'put')
delete = functools.partial(run, 'delete')

def get_list(endpoint, params, key, limit=50):
    offset = 0
    ret = []
    while True:
        data = get(endpoint, dict(list(params.items()) + [
            ('limit', limit),
            ('offset', offset)
        ]))
        ret += data[key]
        if data['count'] < limit:
            break
        offset += limit
    return ret

get_subjects = functools.partial(get_list,
        '/subjects',
        {'unabbreviated': '1'},
        'subjects')

get_consents = functools.partial(get_list,
        '/consents',
        {'unacknowledged': '1'},
        'consents')

get_tasks = functools.partial(get_list,
        '/tasks',
        {'unabbreviated': '1', 'unacknowledged': '1'},
        'tasks')

def get_subject_users(subject_code):
    return get_list('/subjects/@%s/users' % subject_code,
                    {'unabbreviated': 1},
                    'users')
def update_subject_user(subject_code, user_code, payload):
    return put('/subjects/@%s/users/@%s' % (subject_code, user_code),
               {}, payload)

def update_subject(code, payload):
    return put('/subjects/@' + code, {}, payload)

def update_consent(code, payload):
    return put('/consents/@' + code, {}, payload)

def delete_consent(code):
    return delete('/consents/@' + code, {})

def update_task(code, payload):
    return put('/tasks/@' + code, {}, payload)

def delete_task(code):
    return delete('/tasks/@' + code, {})

def submit_tasks(tasks):
    package_size = get_settings().task_package_size
    remainder = tasks
    while remainder:
        package = remainder[0:package_size]
        post('/tasks', {'unabbreviated': '1'}, package)
        remainder = remainder[package_size:]

def publish_enrollment_profile(code, host_system_tag, tasks=[], consents=[]):
    return post('/enrollmentprofiles', {}, {
            'code': code,
            'status': 'active',
            'host_system_tag': host_system_tag,
            'tasks': tasks,
            'consents': consents
        })
