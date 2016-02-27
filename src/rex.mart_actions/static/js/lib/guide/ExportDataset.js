/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {autobind} from 'rex-widget/lang';
import {VBox, HBox} from 'rex-widget/layout';
import {Button} from 'rex-widget/ui';
import * as stylesheet from 'rex-widget/stylesheet';

import QueryAction        from './QueryAction';
import QueryFieldSelector from './QueryFieldSelector';

let style = stylesheet.create({
  Caption: {
    fontWeight: 'bold',
    fontSize: '90%',
    marginRight: 5,
  }
});

@QueryAction
export default class ExportDataset extends React.Component {

  static defaultProps = {
    title: 'Export',
    icon: 'download-alt'
  };

  constructor(props) {
    super(props);
    this.state = {
      query: null
    };
  }

  render() {
    let {fields, db, ...props} = this.props;

    let exportButtons = ['csv', 'tsv', 'xls', 'xlsx'].map((format) => {
      return (
        <Button
          key={format}
          Component="a"
          target="_blank"
          size="small"
          href={db.query(this.query.format(format)).href}>
          {format.toUpperCase()}
        </Button>
      );
    });

    return (
      <Action {...props}>
        <HBox alignItems="center">
          <style.Caption>Download dataset as:</style.Caption>
          {exportButtons}
        </HBox>
        {fields && fields.length > 0 &&
          <div>
            <h5>Select fields for export:</h5>
            <QueryFieldSelector
              fields={fields}
              query={this.query}
              onQueryUpdate={this.onQueryUpdate}
              />
          </div>}
      </Action>
    );
  }

  get query() {
    return this.state.query || this.props.query;
  }

  @autobind
  onQueryUpdate(query) {
    this.setState({query});
  }
}

