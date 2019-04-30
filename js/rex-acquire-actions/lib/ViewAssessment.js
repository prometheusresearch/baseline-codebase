/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";

import { FormEntry } from "rex-forms";
import { withFetch } from "rex-widget/data";
import * as rexui from "rex-ui";

import AssessmentError from "./AssessmentError";
import ChannelChooser from "./ChannelChooser";
import CalculationResults from "./CalculationResults";
import I18NAction from "./I18NAction";
import Title from "./Title";

export default withFetch(
  class ViewAssessment extends React.Component {
    static defaultProps = {
      icon: "file"
    };

    static renderTitle({ title, entity }, context) {
      return <Title title={title} subtitle={context[entity.name].id} />;
    }

    constructor(props) {
      super(props);
      this.state = {
        currentChannel: props.initialChannel
      };
    }

    onChannelChange = channel => {
      this.setState({
        currentChannel: channel
      });
    };

    render() {
      let { title, locale, i18nBaseUrl, widgetConfig } = this.props;
      let { displayData } = this.props.fetched;
      let { currentChannel } = this.state;

      if (displayData.updating) {
        return <rexui.PreloaderScreen />;
      }
      if (displayData.data.error) {
        return (
          <I18NAction title={title} locale={locale} i18nBaseUrl={i18nBaseUrl}>
            <AssessmentError errorCode={displayData.data.error} />
          </I18NAction>
        );
      }

      let { instrument, assessment, parameters } = displayData.data;

      let initialChannel;
      let channels = this.props.channels.filter(channel => {
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

      let results = displayData.data.calculation_results;
      var hasResults = Object.keys(results).length > 0;

      return (
        <I18NAction title={title} locale={locale} i18nBaseUrl={i18nBaseUrl}>
          {hasMultipleForms && (
            <ChannelChooser
              channels={channels}
              initialChannel={initialChannel}
              onChange={this.onChannelChange}
            />
          )}
          <FormEntry
            widgetConfig={widgetConfig}
            key={currentChannel}
            mode="view"
            instrument={instrument}
            form={form}
            assessment={assessment}
            parameters={parameters}
            apiUrls={{
              resourcePrefix: this.props.resourcePrefixUrl
            }}
          />
          {hasResults && <CalculationResults results={results} />}
        </I18NAction>
      );
    }
  },
  function({ displayData, entity, context }) {
    displayData = displayData.params({
      assessment_id: context[entity.name].id
    });
    return { displayData };
  }
);
