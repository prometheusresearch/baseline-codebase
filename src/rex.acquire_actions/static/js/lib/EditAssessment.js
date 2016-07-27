
/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {FormEditor} from 'rex-forms';
import {Preloader, showNotification, removeNotification, Notification} from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import {autobind} from 'rex-widget/lang';

import AssessmentError from './AssessmentError';
import ChannelChooser from './ChannelChooser';
import I18NAction from './I18NAction';
import Title from './Title';


@Fetch(function ({displayData, entity, context}) {
  displayData = displayData.params({
    assessment_id: context[entity.name].id
  });
  return {displayData};
})
export default class ViewAssessment extends React.Component {
  static defaultProps = {
    icon: 'pencil'
  };

  static renderTitle({title, entity}, context) {
    return (
      <Title
        title={title}
        subtitle={context[entity.name].id}
        />
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      currentChannel: props.initialChannel
    };
  }

  @autobind
  onChannelChange(channel) {
    this.setState({
      currentChannel: channel
    });
  }

  @autobind
  onFormComplete(formState) {
    let payload = JSON.stringify({
      assessment_id: this.props.context[this.props.entity.name].id,
      data: formState.getAssessment(),
    });

    let notification = showNotification(
      <Notification
        kind='info'
        text='Saving Assessment...'
        />
    );
    this.props.saveAssessment.data(payload).produce().then(
      (data) => {
        removeNotification(notification);
        showNotification(
          <Notification
            kind='success'
            text='The updated Assessment has been saved.'
            ttl={10000}
            />
        );
        this.props.onContext({});
      },
      (err) => {
        removeNotification(notification);
        showNotification(
          <Notification
            kind='danger'
            text={err}
            />
        );
      }
    );
  }

  render() {
    let {title, locale, i18nBaseUrl} = this.props;
    let {displayData} = this.props.fetched;
    let {currentChannel} = this.state;

    if (displayData.updating) {
      return <Preloader />;
    }
    if (displayData.data.error) {
      return (
        <I18NAction
          title={title}
          locale={locale}
          baseUrl={i18nBaseUrl}>
          <AssessmentError
            errorCode={displayData.data.error}
            />
        </I18NAction>
      );
    }

    let assessment_id = this.props.context[this.props.entity.name].id;
    let {instrument, assessment, parameters} = displayData.data;

    let initialChannel;
    let channels = this.props.channels.filter((channel) => {
      if (channel.uid === this.props.initialChannel) {
        initialChannel = channel.uid;
      }
      return displayData.data.forms[channel.uid] !== undefined;
    });
    if (!initialChannel) {
      initialChannel = channels[0].uid;
    }
    currentChannel = currentChannel || initialChannel;

    let form = displayData.data.forms[currentChannel];
    let hasMultipleForms = Object.keys(displayData.data.forms).length > 0;

    return (
      <I18NAction
        title={title}
        locale={locale}
        baseUrl={i18nBaseUrl}>
        {hasMultipleForms &&
          <ChannelChooser
            channels={channels}
            initialChannel={initialChannel}
            onChange={this.onChannelChange}
            />
        }
        <FormEditor
          key={currentChannel}
          instrument={instrument}
          form={form}
          assessment={assessment}
          parameters={parameters}
          onComplete={this.onFormComplete}
          showCalculations={this.props.showCalculations}
          apiUrls={{
            lookup: this.props.lookupApiUrl,
            calculation: `${this.props.calculationsApiUrl}/${assessment_id}`,
          }}
          />
      </I18NAction>
    );
  }
}

