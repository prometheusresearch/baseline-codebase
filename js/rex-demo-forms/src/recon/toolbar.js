/**
 * @copyright 2014-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";

export type Options = {|
  locale: string,
  showSolution: boolean,
|};

type ToolbarProps = {|
  availableLocales: string[],
  options: Options,
  onOptions: Options => void,
  mountPoint: string,
  recon: Object,
|};

export function Toolbar(props: ToolbarProps) {
  let { options, onOptions } = props;
  let onLocale = locale => onOptions({ ...options, locale });
  let onShowSolution = showSolution => onOptions({ ...options, showSolution });
  return (
    <ReactUI.Block padding="small">
      <ReactUI.Block inline>
        <a href={props.mountPoint + "/"}>← Go Back</a>
      </ReactUI.Block>
      {props.recon.validation_errors && (
        <ReactUI.Block inline marginLeft="medium">
          <ReactUI.ErrorText title={props.recon.validation_errors}>
            INVALID CONFIGURATION
          </ReactUI.ErrorText>
        </ReactUI.Block>
      )}
      <ReactUI.Block inline marginLeft="medium">
        <ReactUI.Block inline marginRight="x-small">
          <ReactUI.Checkbox
            title="Displays the current state of the Solution"
            label="Show Solution"
            onChange={onShowSolution}
            value={options.showSolution}
          />
        </ReactUI.Block>
        <ReactUI.Select
          value={options.locale}
          onChange={onLocale}
          title="Changes the locale the Form is rendered in"
          options={props.availableLocales.map(locale => ({
            value: locale[0],
            label: locale[1],
          }))}
        />
      </ReactUI.Block>
    </ReactUI.Block>
  );
}
