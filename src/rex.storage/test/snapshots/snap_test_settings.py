# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['test_credentials 1'] = '''Got unexpected field:
    azure
While validating setting:
    storage_credentials
While initializing RexDB application:
    rex.storage
With parameters:
    storage_credentials: {'azure': {'key': '1', 'secret': '2'}}'''

snapshots['test_mount_errors 1'] = '''Path cannot be root
Path `../some/path` should start with "/"
No driver for `azure://some/path/`. Use one of: s3, gcs, local, rex
URL `some-junk-here/` does not match the regexp: `^(?P<service>.+?)://(?P<container>[^/]+)/(?P<path>.*)$`
Mount point `/good` is already defined. Check treainling slash.
While validating setting:
    storage_mount
While initializing RexDB application:
    rex.storage
With parameters:
    storage_credentials: {'local': {'key': '{cwd}/test-storage'}}
    storage_mount: {'/': 'local://x/1', '../some/path': 'local://x/2', '/bad-url': 'azure://some/path', '/bad-url-2': 'some-junk-here', '/good/': 'local://x/1', '/good': 'local://x/2'}'''

snapshots['test_mount_ok 1'] = {
    '/path1/': {
        'url': 'local://bucket1/'
    },
    '/path2/': {
        'url': 'local://bucket1/subpath/'
    }
}
