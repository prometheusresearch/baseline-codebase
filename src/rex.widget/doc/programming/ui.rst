.. _ui-components:

UI components
=============

Rex Widget provides a library of UI components which can be used to construct
user interfaces.

UI components are exposed through the ``rex-widget/ui`` ES2015 module. Only
specific components could be imported::

  import {Button, Preloader} from 'rex-widget/ui';

  <Button>Push</Button>

Or an entire UI component library could be brought into scope::

  import * as ui from 'rex-widget/ui';

  <ui.Button>Push</ui.Button>
