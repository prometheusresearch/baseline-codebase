/**
 * @copyright 2014-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import { Reconciler } from "rex-forms";
import { Provider } from "rex-i18n";
import type { Options } from "./toolbar.js";
import JsonViewer from "../jsonviewer";

type WorkspaceProps = {|
  mountPoint: string,
  apiUrls: Object,
  i18nUrl: string,
  recon: Object,
  options: Options,
|};

export default function Workspace(props: WorkspaceProps) {
  let [solution, setSolution] = React.useState(null);
  let onComplete = reconState => {
    console.log("complete", reconState);
    setSolution(reconState.solution);
  };

  let onChange = reconState => {
    console.log("change", reconState);
    setSolution(reconState.solution);
  };

  let Component: any = Reconciler;

  if (props.recon.id === "custom_widget") {
    Component = require("../CustomWidgetDemo").default;
  }

  return (
    <div style={{ display: "flex" }}>
      <Provider locale={props.options.locale} baseUrl={props.i18nUrl}>
        <Component
          // eslint-disable-next-line
          Form={Reconciler}
          instrument={props.recon.instrument}
          // eslint-disable-next-line
          form={props.recon.form}
          parameters={props.recon.parameters}
          discrepancies={props.recon.discrepancies}
          entries={props.recon.entries}
          onComplete={onComplete}
          onChange={onChange}
          apiUrls={props.apiUrls}
        />
      </Provider>
      {props.options.showSolution && (
        <div style={{ fontSize: "80%", minWidth: 200, padding: 16 }}>
          <JsonViewer object={solution} />
        </div>
      )}
    </div>
  );
}
