**********************************
  REX.NOTEBOOK Programming Guide
**********************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: meth(literal)
.. role:: func(literal)

Overview
========

``rex.notebook`` package provides Jupyter Notebook interface to Rex
applications.

**WARNING:** Rex Notebook is only for internal usage, it shouldn't be deployed
outside of Prometheus VPN as it is insecure by design (Jupyter notebook allows
to execute arbitrary code in server context).

Usage
=====

``rex notebook``
----------------

The command ``rex notebook`` runs a single user notebook server which is
accessible only for the user which id you specify when starting the server::

  % rex notebook --config nb.yaml andrey@prometheusresearch.com

Where ``nb.yaml`` is the standard Rex application configuration which defines
what databases and cloud storage resources are accessible to notebooks.

``rex notebook-nbconvert``
--------------------------

The command ``rex notebook-nbconvert`` converts Jupyter notebooks into HTML (or
PDF) documents::

  % rex notebook-nbconvert --config nb.yaml ./notebook.ipynb
