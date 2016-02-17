
import React from 'react';
import Chrome from 'rex-widget-chrome/lib/Chrome';
import * as ui from 'rex-widget/ui';
import {HBox, VBox} from 'rex-widget/layout';
import {Link} from 'rex-widget';
import {autobind} from 'rex-widget/lang';


function LaunchButton({url, text, attachLeft = false, attachRight = false}) {
  return (!url ? <noscript/> :
    <ui.Button
      size="small"
      attach={{left: attachLeft, right: attachRight}}
      onClick={(e) => {
        window.open(url);
        e.preventDefault();
        e.stopPropagation();
      }}>
      <Link href={url} target="_blank">
        <span>{text}</span>
      </Link>
    </ui.Button>
  );
}

function SourceLauncher({inspectUrl, wizardSource, actionSource}) {
  return (
    <div style={{
      position: 'absolute',
      top: 5,
      right: 5,
      zIndex: 9999,
    }}>
      <LaunchButton
        key="1"
        url={inspectUrl}
        attachRight={wizardSource || actionSource}
        text="Inspect"
        />
      <LaunchButton
        key="2"
        url={wizardSource}
        attachLeft={inspectUrl}
        attachRight={actionSource}
        text="Wizard Source"
        />
      <LaunchButton
        key="3"
        url={actionSource}
        attachLeft={inspectUrl || wizardSource}
        text="Action Source"
        />
    </div>
  );
}


export default class DemoChrome extends React.Component {
  static defaultProps = {
    actionSource: {}
  };

  constructor(props) {
    super(props);
    this.state = {
      lastAction: this.extractLastAction()
    };
  }

  render() {
    let {content, inspectUrl, actionSource, wizardSource,
         ...props} = this.props;
    actionSource = actionSource[this.state.lastAction];

    let newContent = (
      <VBox flex="1" key="source">
        <SourceLauncher
          inspectUrl={inspectUrl}
          wizardSource={wizardSource}
          actionSource={actionSource}
          />
        {content}
      </VBox>
    );

    return (
      <Chrome key="chrome" content={newContent} {...props} />
    )
  }

  extractLastAction() {
    let parts = (window.location.hash || '').split('/');
    return parts[parts.length - 1].replace(/\?.*$/, '');
  }

  @autobind
  _onActionChanged() {
    this.setState({
      lastAction: this.extractLastAction()
    });
  }

  componentDidMount() {
    window.addEventListener('hashchange', this._onActionChanged);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this._onActionChanged);
  }
}
