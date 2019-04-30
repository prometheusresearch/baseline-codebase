/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { useHover } from "rex-ui";
import { VBox, HBox } from "react-stylesheet";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";

export type FileValue = {
  name: string,
  href?: string
};

type Props = {|
  file: FileValue,

  onRemove?: () => void,

  onClick?: () => void
|};

/**
 * Can be called in a variety of ways to
 * upload, download, or delete an uploaded file.
 *
 * Renders a file uploaded to a storage.
 */
function File(props: Props) {
  let { file, onClick, onRemove } = props;
  let handleRemove = onRemove
    ? (e: UIEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (onRemove) {
          onRemove();
        }
      }
    : null;
  return (
    <mui.Chip
      component="a"
      href={file.href}
      icon={<icons.CloudDone />}
      label={file.name}
      onClick={onClick}
      onDelete={handleRemove}
    />
  );
}

export default File;
