
import React from 'react';
import {ReadOnlyField, AutocompleteField} from 'rex-widget/form';
import {recordLink} from './History';

export default class DbguiEntityField extends React.Component {

  render() {
    let {table, ...props} = this.props;
    let {readOnly, formValue} = props;
    let {value} = formValue;
    if (readOnly && value) {
      return (
        <ReadOnlyField {...props}>
          <a href={'#' + recordLink(table, value)}>{value}</a>
        </ReadOnlyField>
      );
    }
    else {
      return <AutocompleteField {...props}/>;
    }
  }
}
