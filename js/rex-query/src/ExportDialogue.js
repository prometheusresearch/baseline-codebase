/**
 * @flow
 */

import * as React from "react";
import { Element } from "react-stylesheet";
import * as ui from "./ui";
import type { ExportFormat } from "./model/types.js";

type Props = {
  onExport: ExportFormat => void,
  formats: Array<ExportFormat>
};

export default function ExportDialogue({ onExport, formats }: Props) {
  return (
    <div>
      <ui.Header>Select export format</ui.Header>
      <Element padding={15}>
        {formats.map(format => (
          <ExportButton
            key={format.mimetype}
            format={format}
            onClick={onExport}
          />
        ))}
      </Element>
    </div>
  );
}

function ExportButton({ format, onClick }) {
  return (
    <Element
      display="inline-block"
      padding={{ horizontal: 15, vertical: 10 }}
      background="#fff"
      backgroundOnHover="#fafafa"
      color="#888"
      marginBottom={10}
      marginRight={10}
      fontSize="9pt"
      fontWeight={400}
      height={35}
      width={90}
      whiteSpace="nowrap"
      textAlign="center"
      userSelect="none"
      cursor="default"
      border="1px solid #ccc"
      borderRadius={2}
      borderOnHover="1px solid #aaa"
      onClick={() => onClick(format)}
    >
      {format.label}
    </Element>
  );
}
