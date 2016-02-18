/**
 * @copyright 2016, Prometheus Research, LLC
 */


import React from 'react';
import ReactDOM from 'react-dom';

import {Action} from 'rex-action';
import {IFrame} from 'rex-widget/ui';
import {Preloader} from 'rex-widget/ui';


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
    let {title, onClose, apiBaseUrl} = this.props;
    let htsqlUrl = apiBaseUrl + 'mart/' + this.props.context.mart + '/shell()';

    return (
      <div>
        {this.state.loading &&
          <Preloader />
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

