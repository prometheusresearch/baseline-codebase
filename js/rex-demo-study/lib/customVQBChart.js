import * as React from "react";
import * as vqbTypes from "rex-query/src/model/types";
import { ChartProps } from "rex-query/src/chart/ChartConfigs";

type CustomChart = {
  type: "custom",
  valueColumn: ?string,
  labelColumn: ?string
};

class CustomChartEditor extends React.Component<ChartProps<CustomChart>> {
  render() {
    const {
      // a set of options extracted from query suitable for labels
      optionsForLabel,
      // a set of options extracted from query suitable for numeric measures
      // (something you can plot)
      optionsForMeasure,
      // fetched dataset
      data,
      // query structure (in case you need it)
      query
    } = this.props;
    return <div>I'm a custom chart editor! Implement me.</div>;
  }
}

function CustomChartIcon() {
  return (
    <svg
      x="0px"
      y="0px"
      viewBox="0 0 376 376"
      style={{ width: 40, height: 40, enableBackground: "new 0 0 376 376" }}
    >
      <g />
    </svg>
  );
}

const customChart: vqbTypes.ChartConfig<"custom", CustomChart> = {
  type: "custom",
  label: "Custom",
  icon: <CustomChartIcon />,

  /**
   * Component which presents the chart.
   */
  chartEditor: CustomChartEditor,

  /**
   * This method defines how to create a chart spec from a query.
   */
  getInitialChart(query: vqbTypes.QueryPipeline): CustomChart {
    return {
      type: "custom",
      valueColumn: null,
      labelColumn: null
    };
  },

  /**
   * Generate chart title automatically from query.
   *
   * This will be used only untill chart title is set manually by the user.
   */
  getChartTitle(chart: CustomChart, query: vqbTypes.QueryPipeline): string {
    return "Custom Chart";
  },

  /**
   * Return a set of attributes used by chart.
   *
   * This will make sure those attributes are fetched.
   */
  getUsedAttributes(chart: CustomChart): Set<string> {
    const attributes = new Set();
    if (chart.labelColumn != null) {
      attributes.add(chart.labelColumn);
    }
    if (chart.valueColumn != null) {
      attributes.add(chart.valueColumn);
    }
    return attributes;
  }
};

export default customChart;
