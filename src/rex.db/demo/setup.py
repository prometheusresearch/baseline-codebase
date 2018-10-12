
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "open HTSQL shell"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os, os.path, shutil
        import sqlite3
        sql = open('./static/db_demo.sql').read()
        if os.path.exists('../sandbox'):
            shutil.rmtree('../sandbox')
        os.mkdir('../sandbox')
        connection = sqlite3.connect('../sandbox/db_demo.sqlite')
        connection.executescript(sql)
        connection.commit()
        cmd = "rex shell rex.db_demo --set db=sqlite:../sandbox/db_demo.sqlite"
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.db_demo',
    version = "3.7.0",
    description="Demo package for testing rex.db",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.db',
    ],
    cmdclass={'demo': demo},
    rex_init='rex.db_demo',
    rex_static='static',
)

