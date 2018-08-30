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
        print("rex_init.txt:", dist.get_metadata('rex_init.txt'))
        print("rex_static.txt:", dist.get_metadata('rex_static.txt'))


setup(
    name='rex.setup_demo',
    description="This package demonstrates capabilities of rex.setup",
    version='4.1.2',
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    url="http://bitbucket.org/prometheus/rex.setup",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[],
    cmdclass={'demo': demo},
    rex_init='rex.setup_demo',
    rex_static='static',
    rex_bundle={
        './www/jquery': [
            'https://raw.github.com/jquery/jquery/1.10.2/MIT-LICENSE.txt#md5=e43aa437a6a1ba421653bd5034333bf9',
            'http://code.jquery.com/jquery-1.10.2.js#md5=91515770ce8c55de23b306444d8ea998',
            'http://code.jquery.com/jquery-1.10.2.min.js#md5=628072e7212db1e8cdacb22b21752cda',
            'http://code.jquery.com/jquery-1.10.2.min.map#md5=6c3ccfc221d36777d383b6e04d0b8af9',
        ],
        './www/bootstrap': [
            'https://raw.github.com/twbs/bootstrap/v3.0.0/LICENSE#md5=e23fadd6ceef8c618fc1c65191d846fa',
            'https://github.com/twbs/bootstrap/releases/download/v3.0.0/bootstrap-3.0.0-dist.zip#md5=6b17c05bb1a1ddb123b7cadea187ff68',
        ],
        #'./www/bundle': [
        #    'webpack:',
        #],
        './www/doc': [
            'doc:html',
            'doc:latex',
        ],
    }, )
