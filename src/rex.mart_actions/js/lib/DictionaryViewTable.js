/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import * as ui from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import * as form from 'rex-widget/form';
import Title from './Title';
import martFromContext from './martFromContext';


@Fetch(function ({data, context, contextTypes}) {
  data = data.params({
    '*': context.mart_table,
    'mart': martFromContext(context)
  });
  return {
    entity: data.getSingleEntity()
  };
})
export default class DictionaryViewTable extends React.Component {
  static defaultProps = {
    icon: 'file'
  };

  render() {
    let {fields, title, context, onClose, fetched} = this.props;
    return (
      <Action title={title} onClose={onClose}>
        {!fetched.entity.updating ?
          <form.ConfigurableEntityForm
            key={fetched.entity.data.id}
            disableValidation
            readOnly
            entity={context.mart_table}
            value={fetched.entity.data}
            fields={fields}
            /> :
            <ui.Preloader />}
      </Action>
    );
  }

  static renderTitle({title}, {mart_table}) {
    return (
      <Title
        title={title}
        subtitle={mart_table}
        />
    );
  }
}

