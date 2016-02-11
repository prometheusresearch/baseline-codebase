
import React from 'react';
import {Action} from 'rex-action';
import {Link} from 'rex-widget';
import {Preloader, SuccessButton} from 'rex-widget/ui';
import {HBox, VBox} from 'rex-widget/layout';
import {Fetch, DataSet} from 'rex-widget/data';
import autobind from 'autobind-decorator';
import {DataTableBase} from 'rex-widget/datatable';
import {SearchInput} from 'rex-widget/form';

export default class PickCity extends React.Component {

  render() {
    let {title, onClose, context} = this.props;
    return (
      <Action title={title} onClose={onClose}>
        <div>{context.city}</div>
      </Action>
    );
  }

}
