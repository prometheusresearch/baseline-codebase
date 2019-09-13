import os
import shutil
from pathlib import Path


storage_path = '{cwd}/test-storage'
STORAGE_PATH = Path('./test-storage').resolve(strict=False)
test_input_path = f"./test-storage/test-input"
TEST_INPUT_PATH = Path(test_input_path).resolve(strict=False)

def make_storage():
    if not STORAGE_PATH.exists():
        os.makedirs(str(STORAGE_PATH))

def remove_storage():
    if STORAGE_PATH.exists():
        shutil.rmtree(str(STORAGE_PATH), ignore_errors=True)

def makedirs(*dirs):
    for dir in dirs:
        path = (STORAGE_PATH / Path(dir)).resolve(strict=False)
        assert STORAGE_PATH in path.parents
        if not path.exists():
            os.makedirs(str(path))

def read_file(filename):
    path = (STORAGE_PATH / Path(filename)).resolve(strict=False)
    assert STORAGE_PATH in path.parents
    return open(str(path)).read()

def ensure_test_input_dir():
    files = [
        '1.txt',
        'dir1/subdir/2.txt',
        'dir1/subdir/3.txt',
        'dir2/4.txt',
        'dir2/5.txt',
    ]
    for file in files:
        path = TEST_INPUT_PATH / file
        makedirs(str(path.parent))
        with open(str(path), 'w') as f:
            f.write(file)

