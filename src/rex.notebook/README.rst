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

Usage
=====

The command ``rex notebook`` runs a single user notebook server which is
accessible only for the user which id you specify when starting the server::

  % rex notebook --config nb.yaml andrey@prometheusresearch.com

Where ``nb.yaml`` is the standard Rex application configuration which defines
what databases and cloud storage resources are accessible to notebooks.

