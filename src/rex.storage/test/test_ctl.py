import pytest
import os
from pathlib import Path
import util
from rex.ctl import Ctl

CONFIG = f"""\
project: rex.storage
parameters:
  storage_credentials:
    local:
      key: {util.STORAGE_PATH}
  storage_mount:
    /dst: local://dst
"""

CONFIG_PATH = (util.STORAGE_PATH / 'rex_test.yaml').resolve()

def fix_cwd(s):
    return s.replace(os.getcwd(), '/...')

def upload(*args):
    cmd = ' '.join(['upload', 'rex.storage', f"--config={CONFIG_PATH}"]
            + [str(util.TEST_INPUT_PATH / arg) for arg in args[:-1]]
            + [args[-1]])
    return Ctl(cmd)

def assert_same_files(local, cloud):
    local = (util.TEST_INPUT_PATH / local).resolve()
    cloud = (util.STORAGE_PATH / cloud).resolve()
    assert local.exists()
    assert cloud.exists()
    assert open(local, 'rb').read() == open(cloud, 'rb').read()


def setup_function():
    util.remove_storage()
    util.make_storage()
    util.ensure_test_input_dir()
    util.makedirs('dst')
    with open(CONFIG_PATH, 'w') as f:
        f.write(CONFIG)

def test_upload_single_file(snapshot):
    task = upload('1.txt', '/dst')
    output = task.wait()
    snapshot.assert_match(fix_cwd(output))
    assert_same_files('1.txt', 'dst/1.txt')

def test_upload_single_file_with_renaming(snapshot):
    task = upload('1.txt', '/dst/2.txt')
    output = task.wait()
    snapshot.assert_match(fix_cwd(output))
    assert_same_files('1.txt', 'dst/2.txt')

def test_upload_directory(snapshot):
    task = upload('dir1', '/dst')
    output = task.wait()
    snapshot.assert_match(fix_cwd(output))
    assert_same_files('dir1/subdir/2.txt', 'dst/dir1/subdir/2.txt')
    assert_same_files('dir1/subdir/3.txt', 'dst/dir1/subdir/3.txt')

def test_upload_all_to_url(snapshot):
    task = upload('1.txt', 'dir1', 'dir2', 'local://dst/other')
    output = task.wait()
    snapshot.assert_match(fix_cwd(output))
    assert_same_files('1.txt', 'dst/other/1.txt')
    assert_same_files('dir1/subdir/2.txt', 'dst/other/dir1/subdir/2.txt')
    assert_same_files('dir1/subdir/3.txt', 'dst/other/dir1/subdir/3.txt')
    assert_same_files('dir2/4.txt', 'dst/other/dir2/4.txt')
    assert_same_files('dir2/5.txt', 'dst/other/dir2/5.txt')

def test_upload_non_existent(snapshot):
    task = upload('bad-name.txt', 'local://dst/other')
    output = task.wait(expect=1)
    snapshot.assert_match(fix_cwd(output))

