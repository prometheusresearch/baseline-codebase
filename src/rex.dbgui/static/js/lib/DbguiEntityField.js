
import React from 'react';
import {ReadOnlyField, AutocompleteField} from 'rex-widget/form';

export class DbguiEntityField extends React.Component {
  render() {

    let {readOnly, formValue} = this.props;
    if (readOnly) {
      return (
        <ReadOnlyField {...this.props}>
          Hello
        </ReadOnlyField>
      );
    }
    else {
      return <AutocompleteField {...this.props}/>;
    }
  }
}
