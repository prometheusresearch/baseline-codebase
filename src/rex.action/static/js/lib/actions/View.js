/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                       from 'react';
import RexWidget                   from 'rex-widget';
import Fetch                       from 'rex-widget/lib/data/Fetch';
import Action                      from '../Action';
import {getEntityTitle, isLoaded}  from '../Entity';
import Title                       from './Title';
import fetchEntity                 from './fetchEntity';

@Fetch(fetchEntity)
export default class View extends React.Component {

  static defaultProps = {
    icon: 'eye-open',
    width: 400
  };

  render() {
    let {fields, entity, context, onClose, width, fetched} = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action title={title} onClose={onClose} width={width}>
        {!fetched.entity.updating ?
          <RexWidget.Forms.ConfigurableEntityForm
            key={fetched.entity.data.id}
            readOnly
            entity={entity.type.name}
            value={fetched.entity.data}
            fields={fields}
            /> :
            <RexWidget.Preloader />}
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
