/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";

import { Action, TitleBase as Title } from "rex-action";
import { ConfEntityForm } from "rex-widget/conf-form";
import { withFetch } from "rex-widget/data";
import { Notification, showNotification } from "rex-widget/ui";
import * as Stylesheet from "rex-widget/Stylesheet";
import { post } from "rex-widget/fetch";
import * as rexui from "rex-ui";

let stylesheet = Stylesheet.create({
  Tools: {
    textAlign: "center",
    marginTop: "2em"
  },

  SuccessMessage: {
    background: "#dff0d8",
    padding: "0.5em"
  }
});

export default withFetch(
  class DefinitionView extends React.Component {
    static defaultProps = {
      icon: "file"
    };

    constructor() {
      super();
      this.state = {
        created: false
      };
    }

    render() {
      let { fields, context, onClose, fetched } = this.props;
      let title = this.constructor.renderTitle(this.props, context);

      let tools;
      if (!fetched.data.updating && fetched.data.data.can_generate) {
        tools = (
          <stylesheet.Tools>
            {this.state.created ? (
              <stylesheet.SuccessMessage>
                <p>
                  You request to create a new Mart has been received. It is now
                  in the queue to be processed.
                </p>
                <p>
                  Depending on how large or complex this Mart Definition is, it
                  could take a couple minutes to an hour to create your Mart.
                </p>
                <p>
                  When it is ready for use, it will automatically show up in the
                  list of Marts available for exploration.
                </p>
              </stylesheet.SuccessMessage>
            ) : (
              <rexui.Button icon={<icons.Create />} onClick={this.onCreate}>
                Create New Mart
              </rexui.Button>
            )}
          </stylesheet.Tools>
        );
      }

      let content;
      if (fetched.data.updating) {
        content = <rexui.PreloaderScreen />;
      } else {
        content = (
          <div>
            <ConfEntityForm
              key={fetched.data.data.id}
              disableValidation
              readOnly
              entity={"Mart Definition"}
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

    onCreate = () => {
      let url = "rex.mart:/definition/" + this.props.context.mart_definition;

      post(url)
        .then(() => {
          this.setState({
            created: true
          });
          showNotification(
            <Notification
              kind={"success"}
              text={"Your request has been submitted."}
            />
          );
        })
        .catch(err => {
          err.response
            .json()
            .then(error => {
              showNotification(
                <Notification kind={"danger"} text={error.error} />
              );
            })
            .catch(() => {
              showNotification(<Notification kind={"danger"} text={err} />);
            });
        });
    };

    static renderTitle({ title }, { mart_definition }) {
      return <Title title={title} subtitle={mart_definition} />;
    }
  },
  function({ data, context }) {
    data = data.params({ definition: context.mart_definition });
    return { data };
  }
);
