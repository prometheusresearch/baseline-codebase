********************************
Upgrade to version 4.12
********************************

The `rex.platform` of version 4.12 brings a new level of the application
flexibility for the price of the total backward incompatibility and manual
upgrade requirement. In this document we'll try to summarize the steps needed
for the successful upgrade from pre-4.12 version.


Upgrade to 4.11
-----------------

This is the step #0. If your application is using pre-4.11 version of the
`rex.platform` execute the version-by-version upgrade until it's using 4.11.


Pre-upgrade Actions
-------------------

While being on the 4.11 you can do several actions which will make the upgrade
eaier:

* Remove the dead-code. I.e. unneeded imports, non-used JavaScript of Python
  files, YAML configuration. In short everything which is not used anymore
  should be removed from your application code entirely.

* Swicth to use new `data fetching api`_.

.. _`data fetching api`: https://doc.rexdb.org/rex.widget/2.2.0/guide/data-api.html

After doing all of this, upgrade the `rex.platform` version number in your
`setup.py` and try to serve your application. It should fail miserably, but
that's the expected behavior which we're going to fix on our next step.


Removing rex.applet dependency
------------------------------

One of the biggest changes on the 4.12 removing the `rex.applet` dependency.
This leads to less packages and more granular access control. The main goal of
this chapter is to provide instructions how to merge all you Python, JavaScript
and YAML code together.

We assume that the target application consists of the main `client.pkg` package
and several applets in its dependencies. Our goal here is to get rid of those
applets entirely and make sure all the valuable code is transfered to the
`client.pkg` package.


settings.yaml & deploy.yaml
~~~~~~~~~~~~~~~~~~~~~~~~~~~

This probably is the simplest part of the whole process. If your project
happened to have settings and deploy facts spread accross multiple applets,
packages, merge it manually and put the content to the
`client.pkg/static/settings.yaml` and `client.pkg/static/deploy.yaml`
respectively. Of course, in case of deploy you may design more advanced and
maintainable file structure with includes etc. This is up to your application
design. The key success metric here is absense of settings and deploy fact in
applets and transferring them right to the `client.pkg` source code.


Python code
~~~~~~~~~~~~~

Moving Python code is a little bit more complex. Presumably, you have several
types of Python assets in the application: commands, control routines, widgets,
actions  formfields & permissions. We recommend you the following file
structure for keeping that::
    
    client.pkg/
        src/
            client/
                __init__.py
                pkg/
                    __init__.py
                    action/ # keep all actions here, one per file
                        __init__.py
                        my_action1.py
                        ...
                    widget/ # keep all widgets here, one per file
                        __init__.py
                        my_widget1.py
                        ...
                    formfield/ # keep all formfields here, one per file
                        __init__.py
                        my_formfield1.py
                        ...
                    ctl/ # keep all control routines here, one per file
                        __init__.py
                        my_ctl1.py
                        ...
                    commands/ # keep all commands here, one per file
                        __init__.py
                        my_command1.py
                        ...
                    auth.py # custom permissions python code as-is


Don't forget to make sure all the assets are properly imported in the
`client/pkg/__init__.py`. Transfer all the Python assets from all your applets
right to the main `client.pkg`.


JavaScript Code
~~~~~~~~~~~~~~~

The process for the JavaScript code is much like the one for the Python code
with just a different code structure::

    client.pkg/
        static/
            js/
                package.json
                lib/
                    action/
                        MyAction1.js
                        ...
                    widget/
                        MyWidget1.js
                        ...
                    formfield/
                        MyFormField1.js
                        ...

The assumption here is that your main JavaScript assets are widgets, actions
and formfields. If you have other JavaScript code, modify the file structure in
order to fulfill your needs. Although the recommendation to separate 3 main
types of assets onto 3 different folders remains though.

If your application happened to have additional JavaScript packages in its
dependency list - specify those in the `client.pkg/static/js/package.json`.

Once this step is completed - get back to your Python code and make sure the
`js_type` attribute of all widgets, actions and formfields is specified
properly (i.e. pointing to the JavaScript code in the `client.pkg` and not the
applet).


urlmap.yaml
~~~~~~~~~~~

This section is probably the most complex. So, let's imagine you've got
`client.pkg` with 2 applets in it: `client.applet1` and `client.applet2`. Both
applets have the `static/urlmap.yaml` file configured. And the
`client.pkg/static/settings.yaml` says something like this::

    access:
        client.applet1: applet1_access
        client.applet2: applet2_access
