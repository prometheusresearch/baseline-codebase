
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "show how to load Rex metadata"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import pkg_resources
        dist = pkg_resources.get_distribution('rex.setup_demo')
        print "rex_init.txt:", dist.get_metadata('rex_init.txt')
        print "rex_static.txt:", dist.get_metadata('rex_static.txt')

setup(
    name='rex.setup_demo',
    description="This package demonstrates capabilities of rex.setup",
    version='1.0',
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    url="http://bitbucket.org/prometheus/rex.setup",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=['rex.setup'],
    cmdclass={'demo': demo},
    rex_init='rex.setup_demo',
    rex_static='static',
)

