/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";

import { FormEditor, FormEntry } from "rex-forms";
import {
  showNotification,
  removeNotification,
  Notification
} from "rex-widget/ui";
import * as rexui from "rex-ui";
import { withFetch, DataSet, forceRefreshData } from "rex-widget/data";
import { DataTableBase } from "rex-widget/datatable";
import { VBox, HBox } from "@prometheusresearch/react-box";

import I18NAction from "./I18NAction";
import EntryError from "./EntryError";
import Title from "./Title";

export default withFetch(
  class EnterData extends React.Component {
    static defaultProps = {
      icon: "pencil"
    };

    static renderTitle({ title, entity }, context) {
      return <Title title={title} subtitle={context[entity.name].id} />;
    }

    constructor(props) {
      super(props);
      this.state = {
        mode: "SELECTION"
      };
    }

    getTaskID() {
      return this.props.context[this.props.entity.name].id;
    }

    onSelectEntry = (entryId, entry) => {
      if (entry.status === "in-progress") {
        this.onContinueEntry(entryId);
      } else {
        this.onViewEntry(entryId);
      }
    };

    onContinueEntry = (entryId, mode = "EDIT") => {
      this.setState({
        mode: "WAITING"
      });

      let payload = JSON.stringify({
        task_id: this.getTaskID(),
        entry_id: entryId
      });

      this.props.retrieveEntry
        .data(payload)
        .produce()
        .then(
          data => {
            this.setState({
              mode: mode,
              ...data
            });
          },

          err => {
            showNotification(<Notification kind="danger" text={String(err)} />);
          }
        );
    };

    onNewEntry = () => {
      this.onContinueEntry("NEW");
    };

    onViewEntry = entryId => {
      this.onContinueEntry(entryId, "VIEW");
    };

    onFormSave = formState => {
      let payload = JSON.stringify({
        task_id: this.getTaskID(),
        entry_id: this.state.entry.uid,
        data: formState.getAssessment(),
        complete: false
      });

      this.props.saveEntry
        .data(payload)
        .produce()
        .then(
          data => {
            // Nothing, I guess.
          },
          err => {
            showNotification(<Notification kind="danger" text={String(err)} />);
          }
        );
    };

    onFormComplete = formState => {
      let payload = JSON.stringify({
        task_id: this.getTaskID(),
        entry_id: this.state.entry.uid,
        data: formState.getAssessment(),
        complete: true
      });

      let notification = showNotification(
        <Notification kind="info" text="Saving Entry..." />
      );
      this.props.saveEntry
        .data(payload)
        .produce()
        .then(
          data => {
            this.setState({
              mode: "WAITING"
            });

            let previousEntity = this.props.context[this.props.entity.name];
            this.props.data
              .produceEntity({ "*": previousEntity.id })
              .then(newEntity => {
                removeNotification(notification);
                showNotification(
                  <Notification
                    kind="success"
                    text="Your Entry has been saved."
                  />,
                  7000
                );
                this.props.onEntityUpdate(previousEntity, newEntity);
                this.onReturnEntries();
              });
          },
          err => {
            removeNotification(notification);
            showNotification(<Notification kind="danger" text={String(err)} />);
          }
        );
    };

    onReturnEntries = () => {
      forceRefreshData();
      this.setState({
        mode: "SELECTION"
      });
    };

    render() {
      let { title, locale, i18nBaseUrl, widgetConfig } = this.props;
      let { entrySelection } = this.props.fetched;
      let { mode } = this.state;
      let content, tools;

      if (this.state.error) {
        content = <EntryError errorCode={this.state.error} />;
      } else if (mode === "WAITING") {
        content = <rexui.PreloaderScreen />;
      } else if (mode === "SELECTION") {
        if (entrySelection.updating) {
          content = <rexui.PreloaderScreen />;
        } else {
          let numRequiredEntries = entrySelection.data.num_required_entries;
          let data = DataSet.fromData(
            entrySelection.data.entries.map(entry => {
              let newEntry = { ...entry };
              newEntry.id = newEntry.uid;
              return newEntry;
            })
          );
          let columns = this.props.entryFields;
          content = [];

          let canMakeNew = data.length < numRequiredEntries;
          let pendingEntries = entrySelection.data.entries.filter(
            entry => entry.status === "in-progress"
          );
          if (pendingEntries.length) {
            let entry = pendingEntries[0];
            tools = (
              <HBox>
                <rexui.SuccessButton
                  size="small"
                  style={{ marginRight: 5 }}
                  onClick={this.onContinueEntry.bind(this, entry.uid, "EDIT")}
                >
                  {`Continue Working on Entry #${entry.ordinal}`}
                </rexui.SuccessButton>
                {this.props.allowConcurrentEntries && canMakeNew && (
                  <rexui.SuccessButton size="small" onClick={this.onNewEntry}>
                    Start New Entry
                  </rexui.SuccessButton>
                )}
              </HBox>
            );
          } else if (canMakeNew) {
            tools = (
              <HBox>
                <rexui.SuccessButton size="small" onClick={this.onNewEntry}>
                  Start New Entry
                </rexui.SuccessButton>
              </HBox>
            );
          }

          if (canMakeNew) {
            content.push(
              <HBox key="numRequired" padding={20}>
                {`This Task requires ${numRequiredEntries} Entries for completion.`}
              </HBox>
            );
          }

          content.push(
            <DataTableBase
              key="entries"
              allowReselect
              data={data}
              columns={columns}
              onSelect={this.onSelectEntry}
            />
          );
        }
      } else if (mode === "EDIT") {
        let {
          instrument,
          form,
          assessment,
          parameters,
          has_calculations,
          task
        } = this.state;

        content = (
          <VBox padding={20} flex={1} overflow="auto">
            <FormEditor
              widgetConfig={widgetConfig}
              instrument={instrument}
              form={form}
              assessment={assessment}
              parameters={parameters}
              autoSaveInterval={this.props.autosaveInterval}
              onSave={this.onFormSave}
              onComplete={this.onFormComplete}
              showCalculations={has_calculations && this.props.showCalculations}
              apiUrls={{
                resourcePrefix: this.props.resourcePrefixUrl,
                lookup: this.props.lookupField.path,
                calculation: `${this.props.executeCalculations.path}?task_id=${
                  task.uid
                }`
              }}
            />
          </VBox>
        );

        tools = (
          <HBox>
            <rexui.SuccessButton size="small" onClick={this.onReturnEntries}>
              Return to Entries
            </rexui.SuccessButton>
          </HBox>
        );
      } else if (mode === "VIEW") {
        let { instrument, form, assessment, parameters } = this.state;

        content = (
          <VBox padding={20} flex={1} overflow="auto">
            <FormEntry
              widgetConfig={widgetConfig}
              mode="view"
              instrument={instrument}
              form={form}
              assessment={assessment}
              parameters={parameters}
            />
          </VBox>
        );

        tools = (
          <HBox>
            <rexui.SuccessButton size="small" onClick={this.onReturnEntries}>
              Return to Entries
            </rexui.SuccessButton>
          </HBox>
        );
      }

      return (
        <I18NAction
          noContentWrapper
          title={title}
          locale={locale}
          extraToolbar={tools}
          i18nBaseUrl={i18nBaseUrl}
        >
          {content}
        </I18NAction>
      );
    }
  },
  function({ entrySelection, entity, context }) {
    entrySelection = entrySelection.params({
      task_id: context[entity.name].id
    });
    return { entrySelection };
  }
);
