********************************
RexStudy Installation Directions
********************************

.. contents:: Table of Contents


Install the Application
***********************

Note: Use of this package requires access to a Python package server with the
RexDB suite available on it.

First, install ``rex.setup``::

    pip install rex.setup==1.2.2

Next, install ``rexdb.study``::

    pip install rexdb.study==3.3.2.0


Create a Configuration File
***************************

Create a file named ``rex.yaml`` and add the following lines::

    project: rexdb.study
    parameters:
        db: pgsql:<db_name>
        secret: mysecretcode
    http-host: 0.0.0.0
    http-port: <port>


Update the Database
*******************

Deploy the database updates needed by RexStudy::

    rex rdoma-deploy


Add User
********

In order to log into the system for the first time, you'll need to create the
first user of the system by adding them directly to the database. This can be
done by launching an HTSQL shell::

    rex shell

Then run the following HTSQL commands::

    /merge(user_group:={name:='rexdb',module:=[['rex_study'].core]})
    /merge(user:={user_group:=['rexdb'],name:='<YOUR-USERNAME>',email:='<YOUR-EMAIL-ADDRESS>'})
    /merge(user_role:={user:=[['rexdb'].<YOUR-USERNAME>],role:=[['meta'].user_admin]})

Once you've logged into the system, you can enter the User Manager section of
the application and add any additional roles or users you wish.


Install Demo Packages (Optional)
********************************

If you want, you can pre-load the system with sample data and configurations
by installing additional packages.

RexDB Demo Data package::

    pip install rex.study_demo==3.3.0.2  (from source)

RexEntry Demo Data::

    pip install rex.entry_demo==1.0.0  (from source)

Demo Client package::

    pip install client.demo.study==3.3.2.0  (from source)
    rex rdoma-deploy

If you install the Demo Client package, you'll also need to update the
``project`` entry in your ``rex.yaml`` file to be ``client.demo.study``.

Launch the Application
**********************

You can launch the application using the built-in server::

    rex serve

