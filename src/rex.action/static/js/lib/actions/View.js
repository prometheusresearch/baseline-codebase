/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                       from 'react';
import Action                      from '../Action';
import Title                       from './Title';
import fetchEntity                 from './fetchEntity';
import * as ui from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import * as form from 'rex-widget/form';

@Fetch(fetchEntity)
export default class View extends React.Component {

  static defaultProps = {
    icon: 'file',
    width: 400
  };

  render() {
    let {fields, entity, context, onClose, width, fetched} = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action title={title} onClose={onClose} width={width}>
        {!fetched.entity.updating ?
          <form.ConfigurableEntityForm
            key={fetched.entity.data.id}
            readOnly
            entity={entity.type.name}
            value={fetched.entity.data}
            fields={fields}
            /> :
            <ui.Preloader />}
      </Action>
    );
  }

  static renderTitle({entity, title = `View ${entity.name}`}, context) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props) {
    return props.title || `View ${props.entity.type.name}`;
  }
}
