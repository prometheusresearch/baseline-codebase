
import React from 'react';
import {Action} from 'rex-action';
import {Link} from 'rex-widget';
import {Preloader, SuccessButton} from 'rex-widget/ui';
import {HBox, VBox} from 'rex-widget/layout';
import {Fetch} from 'rex-widget/data';
import autobind from 'autobind-decorator';

@Fetch(function fetchGreeting(propsAndDataParams) {
  let {sayHello, name} = propsAndDataParams;
  return {
    greeting: sayHello.params({name: name || ''})
  }
})
export default class Trivial extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: ''
    };
  }

  render() {
    let {title, onClose,
         description, helpLink, siteRoot} = this.props;
    let {greeting} = this.props.fetched;
    return (
      <Action title={title} onClose={onClose}>
        <div dangerouslySetInnerHTML={{__html: description}} />
        <HBox flex="1">
          <Link href={siteRoot} style={{margin: 5}}>
            <span>Home</span>
          </Link>
          <Link target="_blank" href={helpLink} style={{margin: 5}}>
            <span>Help</span>
          </Link>
        </HBox>
        <VBox flex="1">
          <HBox>
          {greeting.updating ? <Preloader/> : greeting.data.greeting}
          </HBox>
          <HBox>
            <input
              value={this.state.name}
              onChange={(e) => this.setState({name: e.target.value})}
              />
            <SuccessButton onClick={this.onSayHello}>Say Hello</SuccessButton>
          </HBox>
        </VBox>
      </Action>
    );
  }

  @autobind
  onSayHello() {
    this.props.setDataParams(this.state);
    this.setState({name: ''});
  }
}
