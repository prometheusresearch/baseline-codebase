/**
 * @copyright 2014-present, Prometheus Research, LLC
 * @flow
 */

import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as React from "react";

import { TopNav } from "../menu";
import { Toolbar, type Options } from "./toolbar";
import Workspace from "./workspace";

type ReconProps = {|
  demos: string,
  recons: string,
  recon: Object,
  mountPoint: string,
  apiUrls: Object,
  i18nUrl: string,
  initialLocale: string,
  availableLocales: string[],
|};

export default function Recon(props: ReconProps) {
  if (props.recon.validation_errors) {
    console.log("ERRORS", props.recon.validation_errors);
  }
  let [options, setOptions] = React.useState<Options>({
    showSolution: false,
    locale: props.initialLocale,
  });
  return (
    <div>
      <TopNav
        mountPoint={props.mountPoint}
        demos={props.demos}
        recons={props.recons}
      />
      <ReactUI.Block
        maxWidth={1024}
        padding="medium"
        marginH="auto"
        marginV={0}
      >
        <Toolbar
          mountPoint={props.mountPoint}
          options={options}
          onOptions={setOptions}
          availableLocales={props.availableLocales}
          recon={props.recon}
        />
        <Workspace
          mountPoint={props.mountPoint}
          apiUrls={props.apiUrls}
          i18nUrl={props.i18nUrl}
          options={options}
          recon={props.recon}
        />
      </ReactUI.Block>
    </div>
  );
}
