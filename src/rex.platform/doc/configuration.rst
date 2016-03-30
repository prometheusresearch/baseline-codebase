********************************
REX.PLATFORM Configuration Guide
********************************

.. contents:: Table of Contents
   :depth: 3


Overview
========

RexDB is a platform for delivering Research Data Repositories that deliver 
domain specific data management solutions through analyst-driven 
configuration.  The RexDB Platform empowers analysts to implement custom data 
models, user interfaces, electronic data capture forms, and data exploration 
workflows through well documented configuration files.  With the addition of 
a software engineer, the RexDB Platform can be heavily customized to support a 
variety of highly specialized cases, such as advanced ETL processes, 
integration with third party libraries and toolkits, and interfacing with 
external APIs to create complex data pipelines.

.. |R| unicode:: 0xAE .. registered trademark sign


Descriptions of Configuration
=============================

Data Modeling with RexDeploy
----------------------------

Data is the heart and soul of every Research Data Repository.  RexDeploy is a
fully declarative database schema deployment mechanism for the RexDB
Application. It allows an analyst to describe the structure of the RexDB
application database, perform complex data transforms, and import data from
external sources.

Unlike many other database schema deployment mechanisms, RexDeploy is a
fact-based, declarative system.  Rather than describing a series of actions to
occur on the database, an analyst or developer declares the structure of the
database directly as a series of modularized facts.  Each time RexDeploy deploys
the schema, these facts are checked against the currently existing structure.
If the structure fulfills the fact, nothing occurs.  If the structure does not
meet the fact, RexDeploy attempts to insert, update or delete meta-data to
fulfill the declared facts.  This mechanism is far easier for non-technical
users to conceptualize, as well as improving performance since only necessary
operations are initiated.

RexDeploy allows for a full range of meta-data objects to be declared, including
tables, columns, foreign-key references, unique-keys, complex identity-keys, as
well as the insertion of raw SQL.  In addition to meta-data, RexDeploy allows
for the insertion of raw record data via CSVs, which is commonly used for
loading large sets of pre-generated dema data.

Designing User Interfaces with RexAction
----------------------------------------

Custom data driven web application development is typically very time consuming
and requires a highly specialized skillset normally reserved by software
engineers.  RexAction is a toolkit that allows analysts to configure data driven
web applications via graph-structured screen workflow configuration.  RexAction
dramatically simplifies application development by introspecting the underlying
data model and automatically generating a data access layer to the application
database.

Electronic Data Capture with RexAcquire
---------------------------------------

RexAcquire is a comprehensive Electronic Data Capture (EDC) that includes
mechanisms to directly capture data from direct reporters through a separate web
portal (RexSurvey), a dual-data validation entry system designed for rapid
keyboard entry by system users (RexEntry), and an SMS-based data submission
system for capturing data via cellular phone data entry.

RexAcquire separates data acquisition from the transactional system so that it
can scale to a large number of users.  In addition, both instrument
configuration and the resulting item-level assessment data are stored as
structured JSON data within the database.  This storage mechanism ensures that
the meta-data of the transactional system does not need to expand as additional
instruments and versions are added.  This elimination of schema expansion has
significant positive impact on the performance of the application.

Package Setup
=============

This is an example project directory structure::

    /demo
        setup.py (required)
        /static
            setting.yaml (required)
            deploy.yaml
            urlmap.yaml

Setup.py File
-------------

This is an example setup.py file::

    from setuptools import setup, find_packages
    
    setup(
        name='rex.platform_demo',
        version='5.0.0',
        description="Demo package for testing rex.platform",
        include_package_data=True,
        install_requires=[
            'rex.platform',
        ],
        rex_static='static',
    )

Configuration Examples
======================

Permissions and Menus
---------------------

A RexDB-based Application allows a configuration analyst to declare how a user
is authorized in RexDB and what options that they have available in the
application.

Access Queries
~~~~~~~~~~~~~

A configuration analyst can configure multiple access queries that contain logic
that dictates if a user can access a particular permission and therefore a set
of functionality.  This configuration is found in the settings.yaml file of a
package.  This is an example of an access query::

    access_queries:
      admin: user[$USER].admin

In this example, the "admin" permission can be accessed by a current
user, whose user identity (i.e. email) is found in the user table and for whose
record has a true value for the admin boolean flag.

Further information regarding Access Queries can be found in the 
`Authentication and Authorization section of the rex.db documentation
<https://doc.rexdb.org/rex.db/latest/guide.html#authentication-and-authorization>`_.

Access Masks
~~~~~~~~~~~

A configuration analyst can configure multiple access masks for each permission
that contain logic that dictates which records in a given table are accessible
by a given user with this permission.  This configuration is found in the
settings.yaml file of a package.  This is an example of an access mask::

   access_masks:
     viewer:
     - school?!is_null(campus)

In this example, the "viewer" permission can only access school records where
the campus attribute is not null.

Main Menu
~~~~~~~~

A configuration analyst can configure groups and items that will be displayed in
the main application menu.  Each item will correspond to a particular path (URL
location) in the system, which will most likely be a RexAction wizard, but could
also be a custom widget or data access port.  This configuration is found in the
settings.yaml file of a package.  This is an example of a main menu::

    main_menu:
    - title: Recruit Participants
      items:
      - rex.study:/recruitment-admin/
      - rex.study:/recruitment-admin/manage-families
    - title: Enroll Participants
      items:
      - rex.study:/enrollment-admin/
      - rex.study:/enrollment-admin/appointment
      - rex.study:/enrollment-admin/participants

In this example, the main menu will display two groups; Recruit Participants and
Enroll Participants.  Within the Recruit Participant Group, two items will be
displayed corresponding to the configuration in the /recruitment-admin/ and
/recruitment-admin/manage-families paths of the rex.study package.  These two
paths map to wizards that are contained within the urlmap.yaml file (or
corresponding linked files) of the rex.study package.

RexAction
---------

A RexDB-based Application allows a configuration analyst to configure
data-driven screens called "wizards" that are composed of "actions" and attach
the newly configured wizard to a particular path (URL location) in the
application.  This path can then be referenced by the aforementioned menu
configuration for user accessibility.

Wizard
~~~~~

A configuration analyst can configure a RexAction wizard, which is a particular
type of widget that can be configured via YAML within the urlmap.yaml file of a
given package.  A wizard is composed of a graph structure of configured actions
that express navigation paths through a given wizard.  During this navigation an
"entity" or database table record may be handed from one action to another.
This allows users to perform complex sequences of actions, such as selecting a
record, viewing the record, editing the record, and associating the given record
with another entity.  This graph structure allows for both sibling actions
(lateral movement within the graph) and child actions with branching.

Actions
~~~~~~

Within a wizard, a configuration analyst can configure a series of actions or
individual screens based on a set of predefined action types that represent
common database activities.  It is alos possible for software developers with
experience with Javascript to program more custom actions that deviate from
these predefined templates.

Types of Actions

* Page - A page action displays arbitrary title and text.  It can be used for
example to compose help pages.
* Pick - A page action shows a list of records in database.  This is a generic
action which displays a list of records in database as a configurable datatable.
 Each item in the list can be selected by clicking on it.
* Make - A make action renders a form to create a new entity.
* View - A view actions displays information about a specified entity.
* Edit - An edit action renders a form to edit a new entity.
* Drop - A drop action displays a form to delete an entity.
* Plotly - A plotly action draws plots with the plotly library.

