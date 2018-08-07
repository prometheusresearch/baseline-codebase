
from rex.core import cached, get_settings as get_app_settings
import requests
import functools
from .setting import PortalClient
from .error import PatientPortalClientError

class Shard(object):

    def __init__(self, id, title, url, api_key, timeout=30, submit_package_size=20,
                 client_certificate=None):
        self.id = id
        self.title = title
        self.url = url
        self.timeout = timeout
        self.submit_package_size = submit_package_size
        self.session = requests.Session()
        self.session.headers.update({
            'X-Portal-API-Key': api_key
        })
        if client_certificate is not None:
            self.session.cert = client_certificate

    def __str__(self):
        return '%s (%s, %s)' % (self.title, self.id, self.url)

    def get_url(self, endpoint):
        assert endpoint.startswith('/')
        host = self.url[0:-1] if self.url.endswith('/') else self.url
        return host + endpoint

    def run(self, method, endpoint, params, payload=None):
        url = self.get_url(endpoint)
        req = getattr(self.session, method)
        args = {'params': params, 'timeout': self.timeout}
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

    def get(self, endpoint, params):
        return self.run('get', endpoint, params)

    def post(self, endpoint, params, payload=None):
        return self.run('post', endpoint, params, payload)

    def put(self, endpoint, params, payload=None):
        return self.run('put', endpoint, params, payload)

    def delete(self, endpoint, params, payload=None):
        return self.run('delete', endpoint, params, payload)

    def get_list(self, endpoint, params, key, limit=50):
        offset = 0
        ret = []
        while True:
            data = self.get(endpoint, dict(list(params.items()) + [
                ('limit', limit),
                ('offset', offset)
            ]))
            ret += data[key]
            if data['count'] < limit:
                break
            offset += limit
        return ret

    def get_subjects(self, limit=50):
        return self.get_list('/subjects',
                             {'unabbreviated': '1'},
                             'subjects',
                             limit)

    def get_consents(self, limit=50):
        return self.get_list('/consents',
                             {'unacknowledged': '1'},
                             'consents',
                             limit)

    def get_tasks(self, limit=50):
        return self.get_list('/tasks',
                            {'unacknowledged': '1', 'unabbreviated': '1'},
                             'tasks',
                             limit)

    def get_subject_users(self, subject_code):
        return self.get_list('/subjects/@%s/users' % subject_code,
                             {'unabbreviated': 1},
                             'users')

    def update_subject_user(self, subject_code, user_code, payload):
        return self.put('/subjects/@%s/users/@%s' % (subject_code, user_code),
                        {}, payload)

    def update_subject(self, code, payload):
        return self.put('/subjects/@' + code, {}, payload)

    def update_consent(self, code, payload):
        return self.put('/consents/@' + code, {}, payload)

    def delete_consent(self, code):
        return self.delete('/consents/@' + code, {})

    def update_task(self, code, payload):
        return self.put('/tasks/@' + code, {}, payload)

    def delete_task(self, code):
        return self.delete('/tasks/@' + code, {})

    def submit_tasks(self, tasks):
        package_size = self.submit_package_size
        remainder = tasks
        while remainder:
            package = remainder[0:package_size]
            self.post('/tasks', {'unabbreviated': '1'}, package)
            remainder = remainder[package_size:]

    def submit_consents(self, consents):
        package_size = self.submit_package_size
        remainder = consents
        while remainder:
            package = remainder[0:package_size]
            self.post('/consents', {}, package)
            remainder = remainder[package_size:]

    def publish_enrollment_profile(self, code, host_system_tag,
                                   tasks=[], consents=[]):
        return self.post('/enrollmentprofiles', {}, {
                         'code': code,
                         'status': 'active',
                         'host_system_tag': host_system_tag,
                         'tasks': tasks,
                         'consents': consents
                         })
