Chrome
======

Chrome is a special widget which wraps every top level widget in a Rex
application. It can be used to implement UI features which are common for all
screens in an application, for example: footer, navigation bar and so on.

By default there's base chrome widget configured. It provides no visible chrome
UI but just sets ``document.title`` based on the current top level widget
rendered.

Applications can implement their own chrome widget and configure it via
``rex_widget.chrome`` setting::

    rex_widget:
      chrome: myapp.chrome.MyAppChrome

The module ``myapp.chrome`` then should export ``MyAppChrome`` widget class::

    from rex.widget import Chrome

    class MyAppChrome(Chrome):

        js_type = 'myapp', 'MyAppChrome'

The example code above just updates ``js_type`` property which instructs Rex
Widget to use a different React component for chrome. But implementors are free
to override other parts of :class:`rex.widget.Chrome` base class which is a
subclass of :class:`rex.widget.Widget`.

The React component for a chrome widget looks like::

    import React from 'react'
    import Chrome from 'rex-widget/lib/Chrome'

    export default class MyAppChrome extends React.Component {
      render() {
        let {content, ...props} = this.props;
        return (
          <Chrome {...props}>
            <div>My App Toolbar</div>
            {content}
            <div>My App Footer</div>
          </Chrome>
        );
      }
    }

The example code above uses ``rex-widget/lib/Chrome`` as a base component to
render chrome but implementors are not required to use it and can provide a
completely custom implementation instead.
