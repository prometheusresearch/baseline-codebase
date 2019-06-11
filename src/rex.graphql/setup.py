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
    package_dir={"": "src"},
    packages=find_packages("src"),
    namespace_packages=["rex"],
    install_requires=[
        "rex.core",
        "rex.db",
        "rex.web",
        "rex.logging",
        "HTSQL",
        "webob >=1.8.2, <1.9",
        "sphinx-autodoc-typehints == 1.6.0",
        "graphql-core == 2.1",
    ],
    dependency_links=["https://dist.rexdb.org/packages/"],
    rex_init="rex.graphql",
)
