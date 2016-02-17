/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import {Fetch} from 'rex-widget/data';
import {Preloader} from 'rex-widget/ui';
import * as form from 'rex-widget/form';
import {VBox} from 'rex-widget/layout';
import Action from '../Action';
import Title from './Title';
import fetchCrossEntity from './fetchCrossEntity';

@Fetch(fetchCrossEntity)
export default class ViewCross extends React.Component {

  static defaultProps = {
    icon: 'eye-open',
    width: 400
  };

  render() {
    let {fields, entity, context, onClose, width, fetched} = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    let children;
    if (fetched.entity.updating) {
      children = <Preloader />;
    } else if (fetched.entity.data === null) {
      children = (
        <VBox flex={1} alignItems="center" justifyContent="center">No data</VBox>
      );
    } else {
      children = (
        <form.ConfigurableEntityForm
          key={fetched.entity.data.id}
          readOnly
          entity={entity.type.name}
          value={fetched.entity.data}
          fields={fields}
          />
      );
    }
    return (
      <Action title={title} onClose={onClose} width={width}>
        {children}
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
