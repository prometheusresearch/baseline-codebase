/**
 * @copyright 2016, Prometheus Research, LLC
 */


import React from 'react';
import ReactDOM from 'react-dom';

import {Action} from 'rex-action';
import {IFrame} from 'rex-widget/ui';
import resolveURL from 'rex-widget/resolveURL';
import martFromContext from './martFromContext';
import * as rexui from 'rex-ui';


export default class HtsqlConsole extends React.Component {
  static defaultProps = {
    icon: 'eye-open'
  };

  constructor() {
    super();
    this.state = {
      loading: true
    };
  }

  render() {
    let {title, onClose, context} = this.props;

    let {query} = context;
    if (query) {
      if (!query.startsWith('/')) {
        query = '/' + query;
      }
    } else {
      query = '';
    }

    let htsqlUrl = resolveURL(
      `rex.mart:/mart/${martFromContext(context)}/shell(${query})`
    );

    return (
      <div>
        {this.state.loading &&
          <rexui.PreloaderScreen />
        }
        <IFrame
          ref={(component) => {
            if (component) {
              let iframe = ReactDOM.findDOMNode(component);
              iframe.addEventListener('load', () => {
                this.setState({
                  loading: false
                });
              });
            }
          }}
          src={htsqlUrl}
          />
      </div>
    );
  }
}

