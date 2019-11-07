***************************
Add a new JavaScript bundle
***************************

Codebase contains JavaScript code inside ``js/`` subdirectory as a set of
packages (directories with ``package.json`` files inside).

Some of those packages can function as entry points for JavaScript applications,
that means that there's a corresponding JavaScript bundle which can be linked
with a Python package.

This guide documents how to create an entry point package with a bundle.

1. Create a new package inside ``js/`` subdirectory of the codebase::

      $ mkdir js/rex-app
      $ cd js/rex-app
      $ npm init

   The last command will ask few questions to populate ``package.json``.

2. Add a file ``index.js`` which would be used as an entry point to your
   application, usually you'd want to render some React component in there::

      // @flow

      import invariant from 'invariant'
      import * as React from 'react'
      import * as ReactDOM from 'react-dom'

      let root = document.createElement('div');
      invariant(document.body != null, 'DOM is not available')
      document.body.appendChild(root)

      ReactDOM.render(<div>Hello!</div>, root)


3. Modify ``package.json`` to add a dependency on ``rex-webpack-config``
   package::

      ...
      "dependencies": {
        "rex-webpack-config": "*"
      }
      ...

   There's no version constraint necessary (thus we use ``*``) because the
   package comes from the codebase itself.

   Then also add the following scripts to ``package.json``::

      ...
      "scripts": {
        "build": "rex-webpack-build",
        "watch": "rex-webpack-watch"
      }
      ...

   You can ``yarn watch`` command to run a bundler in watch mode and ``yarn
   build`` command to run a bundler to produce production build.

   There will be ``build/`` subdirectory created.

4. Finnaly update ``Makefile.src`` at the root of the codebase (1) to link
   JavaScript package's ``build/`` directory to a corresponding Python package
   you want the serve bundle from and (2) to instruct the codebase build process
   to build the bundle for our ``rex-app`` package::

      SRC_DATA = \
        js/rex-app/build:share/rex/rex.app/www/bundle

      SRC_JS = \
        js/rex-app

   That would allow to use ``rex.web.find_assets_bundle`` to find the URL of the
   bundle and then pass to a Jinja2 template::

      from rex.web import find_assets_bundle, render_to_response

      bundle = find_assets_bundle()
      if bundle is None:
          raise Error("No bundle found")
      response = render_to_response("index.html", request, bundle=bundle)

   where ``index.html`` template will use ``bundle`` to inject ``<script>`` and
   ``<style>`` tags::

      {% if bundle.css %}
      <link media="not-applicable" rel="stylesheet" href="{{ bundle.css|url }}">
      {% endif %}
      {% if bundle.js %}
      <script src="{{ bundle.js|url }}"></script>
      {% endif %}
