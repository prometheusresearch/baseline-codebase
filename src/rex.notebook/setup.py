#
# Copyright (c) 2019-present, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name="rex.notebook",
    version="1.0.0",
    description="Jupyter Notebook integration for Rex Applications",
    long_description=open("README.rst", "r").read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    package_dir={"": "src"},
    packages=find_packages("src"),
    namespace_packages=["rex"],
    install_requires=[
        "rex.core",
        "rex.db",
        # TODO: specify constraints
        "notebook == 6.0.0",
        "ipykernel == 5.1.2",
        "jupyter_client == 5.3.1",
    ],
    entry_points={"rex.ctl": ["rex = rex.notebook.ctl"]},
    dependency_links=["https://dist.rexdb.org/packages/"],
    rex_init="rex.notebook",
)
