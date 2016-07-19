/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {style} from '@prometheusresearch/react-ui/stylesheet';

import {InjectI18N} from 'rex-i18n';


@InjectI18N
export default class CalculationResults extends React.Component {
  static propTypes = {
    results: React.PropTypes.object,
    onClose: React.PropTypes.func
  };

  static stylesheet = {
    Root: style('div', {
      position: 'absolute',
      bottom: 0,
      right: 0,
      maxWidth: '25%',
      zIndex: 100
    }),
    Title: ReactUI.Text,
    Content: style('div', {
      overflowX: 'auto'
    }),
    Key: style('td', {
      fontWeight: 'bold',
      padding: '5px'
    }),
    Value: style('td', {
      padding: '5px'
    }),
    Button: ReactUI.Button,
    Message: (props) => {
      return (
        <ReactUI.Block padding="10px">
          <ReactUI.Text {...props} />
        </ReactUI.Block>
      );
    }
  };

  render() {
    let {
      Root,
      Content,
      Title,
      Button,
      Key,
      Value,
      Message
    } = this.constructor.stylesheet;

    let results;
    if (this.props.results) {
      let keys = Object.keys(this.props.results);
      if (keys.length) {
        results = (
          <table>
            <tbody>
              {keys.sort().map((key) => {
                let value = this.props.results[key];
                if (value === null) {
                  value = 'null';
                } else {
                  value = value.toString();
                }

                return (
                  <tr key={key}>
                    <Key>{key}</Key>
                    <Value>{value}</Value>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      } else {
        results = (
          <Message>{this._('This Form has no calculations.')}</Message>
        );
      }
    } else {
      results = (
        <Message>{this._('Executing calculations...')}</Message>
      );
    }

    return (
      <Root>
        <ReactUI.Card
          header={<Title>{this._('Calculation Results')}</Title>}
          footer={
            <ReactUI.Block textAlign="center">
              <Button onClick={this.props.onClose}>
                {this._('Close')}
              </Button>
            </ReactUI.Block>
          }>
          <Content>
            {results}
          </Content>
        </ReactUI.Card>
      </Root>
    );
  }
}

