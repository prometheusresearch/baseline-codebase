/**
 * @copyright 2014-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";

import type { DiscrepancyEntry } from "../types.js";
import { InjectI18N } from "rex-i18n";

type HeaderColumnProps = {|
  label: string,
  hint?: string,
  width?: string | number,
|};

function HeaderColumn({ label, hint, width }: HeaderColumnProps) {
  return (
    <th title={hint} style={{ width, textAlign: "left" }}>
      <ReactUI.Block paddingH="small" paddingV="x-small">
        {label}
      </ReactUI.Block>
    </th>
  );
}

type HeaderProps = {|
  entries: DiscrepancyEntry[],
|};

class Header extends React.Component<HeaderProps> {
  _: any;
  render() {
    let { entries } = this.props;
    let width = `${100 / (entries.length + 1)}%`;
    let columns = entries
      .map(entry => (
        <HeaderColumn
          key={entry.uid}
          label={entry.uid}
          width={width}
          hint={this._("Entered By: %(username)s", {
            username: entry.modified_by,
          })}
        />
      ))
      .concat(
        <HeaderColumn key="_final_value" label={this._("Final Value")} />,
      );

    return (
      <thead>
        <tr>{columns}</tr>
      </thead>
    );
  }
}

export default (InjectI18N(Header): React.AbstractComponent<HeaderProps>);
