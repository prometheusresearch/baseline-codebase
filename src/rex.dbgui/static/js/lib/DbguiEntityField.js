
import React from 'react';
import {ReadOnlyField, AutocompleteField} from 'rex-widget/form';

export default class DbguiEntityField extends React.Component {
  static contextTypes = {
    baseUrl: React.PropTypes.string
  };

  render() {
    let {table, ...props} = this.props;
    let {readOnly, formValue} = props;
    let {value} = formValue;
    let {baseUrl} = this.context;
    if (readOnly && value) {
      let id = table.replace(/_/g, '-');
      let href = `${baseUrl}/${table}#/pick-${id}[${value}]/view-${id}`;
      return (
        <ReadOnlyField {...props}>
          <a href={href}>{value}</a>
        </ReadOnlyField>
      );
    }
    else {
      return <AutocompleteField {...props}/>;
    }
  }
}
