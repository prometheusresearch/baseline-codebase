#
# Copyright (c) 2019-present, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name="rex.graphql",
    version="1.0.0",
    description="GraphQL API for the RexDB platform",
    long_description=open("README.rst", "r").read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
    package_dir={"": "src"},
    packages=find_packages("src"),
    namespace_packages=["rex"],
    entry_points={
        'rex.ctl': [
            'graphql = rex.graphql.ctl',
        ],
    },
    install_requires=[
        "rex.core",
        "rex.db",
        "rex.ctl",
        "rex.web",
        "rex.logging",
        "rex.query",
        "rex.deploy",
        "HTSQL",
        "cached-property == 1.5.1",
        "webob >=1.8.2, <1.9",
        "graphql-core == 2.1",
    ],
    dependency_links=["https://dist.rexdb.org/packages/"],
    rex_init="rex.graphql",
)
