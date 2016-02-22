/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {ConfigurableEntityForm} from 'rex-widget/form';
import {Fetch} from 'rex-widget/data';
import {Preloader, Button, Notification, showNotification} from 'rex-widget/ui';
import * as Stylesheet from 'rex-widget/stylesheet';
import {autobind} from 'rex-widget/lang';
import {post} from 'rex-widget/lib/fetch';

import Title from './Title';


let stylesheet = Stylesheet.create({
  Tools: {
    textAlign: 'center',
    marginTop: '2em'
  },

  SuccessMessage: {
    background: '#dff0d8',
    padding: '0.5em'
  }
});


@Fetch(function ({data, context}) {
  data = data.params({definition: context.mart_definition});
  return {data};
})
export default class DefinitionView extends React.Component {
  static defaultProps = {
    icon: 'file'
  };

  constructor() {
    super();
    this.state = {
      created: false
    };
  }

  render() {
    let {fields, context, onClose, fetched} = this.props;
    let title = this.constructor.renderTitle(this.props, context);

    let tools;
    if (!fetched.data.updating && fetched.data.data.can_generate) {
      tools = (
        <stylesheet.Tools>
          {this.state.created ?
            <stylesheet.SuccessMessage>
              <p>You request to create a new Mart has been received. It is now in the queue to be processed.</p>
              <p>Depending on how large or complex this Mart Definition is, it could take a couple minutes to an hour to create your Mart.</p>
              <p>When it is ready for use, it will automatically show up in the list of Marts available for exploration.</p>
            </stylesheet.SuccessMessage>
            : <Button
              icon='pencil'
              onClick={this.onCreate}>
              Create New Mart
            </Button>
          }
        </stylesheet.Tools>
      );
    }

    let content;
    if (fetched.data.updating) {
      content = <Preloader />;

    } else {
      content = (
        <div>
          <ConfigurableEntityForm
            key={fetched.data.data.id}
            readOnly
            entity={'Mart Definition'}
            value={fetched.data.data}
            fields={fields}
            />
          {tools}
        </div>
      );
    }

    return (
      <Action title={title} onClose={onClose}>
        {content}
      </Action>
    );
  }

  @autobind
  onCreate() {
    let url = 'rex.mart:/definition/' + this.props.context.mart_definition;

    post(url).then(() => {
      this.setState({
        created: true
      });
      showNotification(
        <Notification
          kind={'success'}
          text={'Your request has been submitted.'}
          />
      );
    }).catch((err) => {
      err.response.json().then((error) => {
        showNotification(
          <Notification
            kind={'danger'}
            text={error.error}
            />
        );
      }).catch(() => {
        showNotification(
          <Notification
            kind={'danger'}
            text={err}
            />
        );
      });
    });
  }

  static renderTitle({title}, {mart_definition}) {
    return (
      <Title
        title={title}
        subtitle={mart_definition}
        />
    );
  }
}

