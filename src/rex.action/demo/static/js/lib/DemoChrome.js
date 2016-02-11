
import React from 'react';
import Chrome from 'rex-widget-chrome/lib/Chrome';
import {SuccessButton} from 'rex-widget/ui';
import {HBox, VBox} from 'rex-widget/layout';
import {Link} from 'rex-widget';
import {autobind} from 'rex-widget/lang';

export default class DemoChrome extends React.Component {
  static defaultProps = {
    actionSource: {}
  };

  constructor(props) {
    super(props);
    this.state = {
      lastAction: null
    };
  }

  render() {
    let {content, actionSource, wizardSource, ...props} = this.props;
    actionSource = actionSource[this.state.lastAction];

    let newContent = (
      <VBox flex="1" key="source">
        <div style={{
          position: 'absolute',
          top: 5,
          right: 5,
          zIndex: 9999,
        }}>
          {wizardSource &&
            <Link href={wizardSource} target="_blank">
              <span>Wizard Source</span>
            </Link>}
          {actionSource &&
            <Link href={actionSource} target="_blank">
              <span>Action Source</span>
            </Link>}
        </div>
        {content}
      </VBox>
    );

    return (
      <Chrome key="chrome" content={newContent} {...props} />
    )
  }

  @autobind
  _onActionChanged() {
    let parts = window.location.hash.split('/');
    let action = parts[parts.length - 1].replace(/\?.*$/, '');
    this.setState({lastAction: action});
  }

  componentDidMount() {
    window.addEventListener('hashchange', this._onActionChanged);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this._onActionChanged);
  }
}
