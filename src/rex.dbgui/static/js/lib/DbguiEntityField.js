
import React from 'react';
import {ReadOnlyField, AutocompleteField} from 'rex-widget/form';

export default class DbguiEntityField extends React.Component {
  render() {
    let {table, ...props} = this.props;
    let {readOnly, formValue} = props;
    let {value} = formValue;
    if (readOnly && value) {
      let id = table.replace('_', '-');
      let href = `${__MOUNT_POINTS__['rex.dbgui']}/${table}#`
                 + `/pick-${id}[${value}]`
                 + `/view-${id}`;
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
