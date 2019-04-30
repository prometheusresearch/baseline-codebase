/**
 * @flow
 */

import type { ChartConfig } from "../model/types.js";

import React from "react";
import { Element } from "react-stylesheet";

import * as ui from "../ui";

type AddChartDialogueProps = {
  onAddChart: ({ type: string }) => void,
  chartConfigs: Array<ChartConfig<>>
};

export default function AddChartDialogue({
  chartConfigs,
  onAddChart
}: AddChartDialogueProps) {
  const types = chartConfigs.map(c => (
    <AddChartItem
      key={c.type}
      label={c.label}
      type={c.type}
      icon={c.icon}
      onClick={onAddChart}
    />
  ));
  return (
    <div>
      <ui.Header>Select chart type</ui.Header>
      <Element margin={20}>{types}</Element>
      <Element
        Component="a"
        href="http://www.flaticon.com/authors/freepik"
        padding={15}
        bottom={0}
        right={0}
        position="absolute"
        display="inline-block"
        color="#bbb"
        colorOnHover="#444"
        style={{ textDecoration: "none" }}
        fontWeight={200}
        fontSize="8pt"
      >
        Icons designed by Freepik at Flaticons
      </Element>
    </div>
  );
}

function AddChartItem({ label, icon, type, onClick }) {
  return (
    <Element
      display="inline-block"
      padding={{ horizontal: 15, vertical: 10 }}
      background="#fff"
      backgroundOnHover="#fafafa"
      marginBottom={10}
      marginRight={10}
      fontSize="9pt"
      fontWeight={200}
      height={90}
      width={90}
      whiteSpace="nowrap"
      textAlign="center"
      userSelect="none"
      cursor="default"
      border="1px solid #ccc"
      borderRadius={2}
      borderOnHover="1px solid #aaa"
      onClick={() => onClick({ type })}
    >
      <Element padding={5}>{icon}</Element>
      {label}
    </Element>
  );
}
