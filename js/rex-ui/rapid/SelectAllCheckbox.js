// @flow

import * as React from "react";

import Checkbox from "@material-ui/core/Checkbox";

export default function SelectAllCheckbox<
  O: { id: string, [key: string]: mixed },
>({
  onCheckedAll,
  selected,
  data,
}: {|
  selected: Set<mixed>,
  data: Array<O>,
  onCheckedAll: (ev: UIEvent) => void,
|}) {
  let onClick = (ev: UIEvent) => ev.stopPropagation();
  return (
    <Checkbox
      onClick={onClick}
      onChange={onCheckedAll}
      checked={Boolean(selected.size)}
      indeterminate={selected.size > 0 && selected.size < data.length}
      title="Select All"
    />
  );
}
