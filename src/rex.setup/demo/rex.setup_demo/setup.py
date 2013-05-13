
from setuptools import setup, find_packages

setup(
    name='rex.setup_demo',
    description="This package demonstrates capabilities of rex.setup",
    version='1.0',
    author="Kirill Simonov; Prometheus Research, LLC",
    author_email="xi@prometheusresearch.com",
    url="http://bitbucket.org/prometheus/rex.setup",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=['rex.setup'],
    rex_init='rex.setup_demo',
    rex_static='static',
)

