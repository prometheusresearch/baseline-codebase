/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import Action from "../Action";
import Title from "./Title";
import fetchEntity from "./fetchEntity";

import * as rexui from "rex-ui";
import { Fetch } from "rex-widget/data";
import * as ui from "rex-widget/ui";
import * as form from "rex-widget/conf-form";

type Props = {|
  title?: string,
  entity: Object,
  context: Object,
  fields: Object,
  width: number,
  fetched: Object,
  refetch: Function,
  refreshInterval?: ?number,
  forceRefreshData(): void
|};

type TitleProps = {
  title?: string,
  entity: Object
};

type ActionContext = Object;

export class View extends React.Component<Props> {
  _interval: ?IntervalID = null;

  static defaultProps = {
    icon: "file",
    width: 400
  };

  render() {
    let { fields, entity, context, width, fetched } = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action title={title} width={width}>
        {!fetched.entity.updating
          ? <form.ConfView
              key={fetched.entity.data.id}
              initialValue={fetched.entity.data}
              config={{ type: "fieldset", fields }}
            />
          : <rexui.PreloaderScreen />}
      </Action>
    );
  }

  refresh = () => {
    this.props.refetch();
    this.props.forceRefreshData();
  };

  componentDidMount() {
    if (this.props.refreshInterval != null) {
      this._interval = setInterval(
        this.refresh,
        this.props.refreshInterval * 1000
      );
    }
  }

  componentWillUnmount() {
    if (this._interval != null) {
      clearInterval(this._interval);
    }
  }

  static renderTitle(
    { entity, title = `View ${entity.name}` }: TitleProps,
    context: ActionContext
  ) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props: TitleProps) {
    return props.title || `View ${props.entity.type.name}`;
  }
}

export default Fetch(fetchEntity)(View);
