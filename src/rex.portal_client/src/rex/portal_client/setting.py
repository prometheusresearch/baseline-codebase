

from rex.core import Setting, RecordVal, StrVal, IntVal, OneOfVal, SeqVal

class PortalClient(Setting):
    """
    Communication settings for the Patient Portal. Specify as following:
        portal_client:
          url: http://patient-portal.com/maybe/path # required
          api_key: my-secret-key #required
          # HTTP connection timeout, optional
          timeout: 30
          # how many tasks should be sent in one HTTP request, optional
          task_package_size: 20
          # can either be a string that is the path to the PEM file, or a list
          # of two items, the first is the path to the Certificate file, the
          # second is the path to the file with the Private Key
          client_certificate: ['client.cert', 'client.key']
    """

    name = 'portal_client'
    validate = RecordVal([
        ('url', StrVal(r'^https?://.+$')),
        ('api_key', StrVal()),
        ('timeout', IntVal(), 30),
        ('task_package_size', IntVal(), 20),
        ('client_certificate', OneOfVal(StrVal(), SeqVal(StrVal())), None),
    ])
    default = None

