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
    license="Apache-2.0",
    package_dir={"": "src"},
    packages=find_packages("src"),
    namespace_packages=["rex"],
    install_requires=[
        "rex.core",
        "rex.db",
        "notebook == 6.0.0",
        "nbformat == 4.4.0",
        "nbconvert == 5.6.0",
        "nbstripout == 0.3.6",
        "pandas == 0.25.1",
        "matplotlib == 3.1.1",
        "ipykernel == 5.1.2",
        "jupyter_client == 5.3.1",
        "papermill == 1.2.0",
    ],
    entry_points={"rex.ctl": ["rex = rex.notebook.ctl"]},
    dependency_links=["https://dist.rexdb.org/packages/"],
    rex_init="rex.notebook",
)
