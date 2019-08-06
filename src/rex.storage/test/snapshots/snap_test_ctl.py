# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['test_upload_single_file 1'] = '''Uploading /.../test-storage/test-input/1.txt to /dst
'''

snapshots['test_upload_single_file_with_renaming 1'] = '''Uploading /.../test-storage/test-input/1.txt to /dst/2.txt
'''

snapshots['test_upload_directory 1'] = '''Uploading /.../test-storage/test-input/dir1/subdir/2.txt to /dst/dir1/subdir/2.txt
Uploading /.../test-storage/test-input/dir1/subdir/3.txt to /dst/dir1/subdir/3.txt
'''

snapshots['test_upload_all_to_url 1'] = '''Uploading /.../test-storage/test-input/1.txt to local://dst/other/1.txt
Uploading /.../test-storage/test-input/dir1/subdir/2.txt to local://dst/other/dir1/subdir/2.txt
Uploading /.../test-storage/test-input/dir1/subdir/3.txt to local://dst/other/dir1/subdir/3.txt
Uploading /.../test-storage/test-input/dir2/4.txt to local://dst/other/dir2/4.txt
Uploading /.../test-storage/test-input/dir2/5.txt to local://dst/other/dir2/5.txt
'''

snapshots['test_upload_non_existent 1'] = '''FATAL ERROR: [Errno 2] No such file or directory: '/.../test-storage/test-input/bad-name.txt'

'''
