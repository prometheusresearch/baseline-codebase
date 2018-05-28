/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import Action from '../Action';
import Title from './Title';
import fetchEntity from './fetchEntity';

import * as ui from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import * as form from 'rex-widget/form';

export class View extends React.Component {
  _interval: ?number = null;

  props: {
    title: string,
    context: Object,
    fields: Object,
    entity: Object,
    onClose: Function,
    width: number,
    fetched: Object,
    refetch: Function,
    refreshInterval?: ?number,
  };

  static defaultProps = {
    icon: 'file',
    width: 400,
  };

  render() {
    let {fields, entity, context, onClose, width, fetched} = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action title={title} onClose={onClose} width={width}>
        {!fetched.entity.updating
          ? <form.ConfigurableEntityForm
              key={fetched.entity.data.id}
              disableValidation
              readOnly
              entity={entity.type.name}
              value={fetched.entity.data}
              fields={fields}
            />
          : <ui.Preloader />}
      </Action>
    );
  }

  refresh = () => {
    this.props.refetch();
    this.props.forceRefreshData();
  };

  componentDidMount() {
    if (this.props.refreshInterval != null) {
      this._interval = setInterval(this.refresh, this.props.refreshInterval * 1000);
    }
  }

  componentWillUnmount() {
    if (this._interval != null) {
      clearInterval(this._interval);
    }
  }

  static renderTitle({entity, title = `View ${entity.name}`}, context) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props) {
    return props.title || `View ${props.entity.type.name}`;
  }
}

export default Fetch(fetchEntity)(View);
