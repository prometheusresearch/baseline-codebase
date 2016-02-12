/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react'

import {autobind} from 'rex-widget/lang';
import * as stylesheet from 'rex-widget/stylesheet';
import * as layout from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';
import ActionInfo from './ActionInfo';
import SourceLocation from './SourceLocation';
import Documentation from './Documentation';

let Code = stylesheet.style('span', {
  fontFamily: 'Menlo, Monaco, monospace',
  whiteSpace: 'pre',
  fontSize: '90%',
});

function Context({info: {contextTypes: {input, output}}, ...props}) {
  let inputKeys = Object.keys(input.rows);
  let outputKeys = Object.keys(output.rows);
  return (
    <layout.VBox>
      {inputKeys.length > 0 &&
        <layout.VBox>
          This action requires the following from context:
          <layout.VBox padding={5}>
            {inputKeys.map(key =>
              <Code key={key}>
                {key}: {input.rows[key].type.format()}
              </Code>)}
          </layout.VBox>
        </layout.VBox>}
      {outputKeys.length > 0 &&
        <layout.VBox>
          This action adds the following to context:
          <layout.VBox padding={5}>
            {outputKeys.map(key =>
              <Code key={key}>
                {key}: {output.rows[key].type.format()}
              </Code>)}
          </layout.VBox>
        </layout.VBox>}
    </layout.VBox>
  );
}

class SourceListing extends React.Component {

  static stylesheet = stylesheet.create({
    Root: {
      Component: layout.VBox,
      padding: 10
    },
    SourceLocation: SourceLocation,
    Source: {
      Component: ui.Panel,
      marginTop: 10,
      fontSize: '70%',
      background: '#f1f1f1',
      whiteSpace: 'pre',
      fontFamily: 'Menlo, Monaco, monospace',
      color: '#333',
      padding: 10,
    },
  });

  render() {
    let {source, location} = this.props;
    let {Root, Source, SourceLocation} = this.constructor.stylesheet;
    return (
      <Root>
        <SourceLocation location={location} />
        <Source>{source}</Source>
      </Root>
    );
  }
}

export default class DetailedActionInfo extends React.Component {

  static defaultProps = {
    defaultTab: 'doc'
  };

  static stylesheet = stylesheet.create({
    Root: {
      Component: layout.VBox,
      flexDirection: 'column-reverse',
      flex: 1,
    },
    HeaderInfo: ActionInfo,
    Content: {
      Component: layout.VBox,
      padding: 10,
      flex: 1,
    },
  });

  constructor(props) {
    super(props);
    this.state = {selected: props.defaultTab};
  }

  render() {
    let {info, tabList} = this.props;
    let {Root, HeaderInfo, Content} = this.stylesheet;
    let {selected} = this.state;
    return (
      <Root>
        <Content>
          <ui.TabList selected={selected} onSelected={this.onSelected}>
            {tabList}
            <ui.Tab title="Documentation" id="doc" flex={1}>
              <Documentation info={info} />
            </ui.Tab>
            {info.source &&
              <ui.Tab title="Source View" id="source" flex={1}>
                <SourceListing location={info.location} source={info.source} />
              </ui.Tab>}
          </ui.TabList>
        </Content>
        <HeaderInfo info={info} />
      </Root>
    );
  }

  get stylesheet() {
    return this.props.stylesheet || this.constructor.stylesheet;
  }

  @autobind
  onSelected(selected) {
    this.setState({selected});
  }

}
