/**
 * @flow
 */

export type PieChart = {
  type: 'pie',
  labelColumn: ?string,
  valueColumn: ?string,
  color: {[label: string]: string},
};

export type Line = {
  label?: ?string,
  valueColumn: ?string,
  color: string,
};

export type LineChart = {
  type: 'line',
  label?: ?string,
  labelColumn: ?string,
  lineList: Array<Line>,
};

export type Area = {
  label?: ?string,
  valueColumn: ?string,
  color: string,
};

export type AreaChart = {
  type: 'area',
  label?: ?string,
  labelColumn: ?string,
  areaList: Array<Area>,
};

export type Bar = {
  label?: ?string,
  valueColumn: ?string,
  color: string,
};

export type BarChart = {
  type: 'bar',
  label?: ?string,
  labelColumn: ?string,
  stacked: 'horizontal' | 'vertical',
  barList: Array<Bar>,
};

export type ScatterChart = {
  type: 'scatter',
  xColumn: ?string,
  xLabel: ?string,
  yColumn: ?string,
  yLabel: ?string,
};

export type ChartType = 'pie' | 'line' | 'bar' | 'scatter' | 'area';

export type Chart = PieChart | LineChart | BarChart | ScatterChart | AreaChart;

export type ChartBaseProps<C: Chart> = {
  /**
   * Chart to plot.
   */
  chart: C,

  /**
   * Chart label.
   */
  label: string,

  /**
   * Callback when chart label is being updated.
   */
  onLabel: string => *,

  /**
   * Dataset for charting.
   */
  data: ?Array<any>,

  /**
   * Indicates if data is updating. In case it is set to `true` chart should
   * render a preloader of some sort.
   */
  dataIsUpdating: boolean,
};

export type ChartEditorBaseProps<C: Chart> = {
  /**
   * Chart to plot.
   */
  chart: C,

  /**
   * Callback when chart is being updated.
   */
  onChart: C => *,

  /**
   * Chart label.
   */
  label: string,

  /**
   * Callback when chart label is being updated.
   */
  onLabel: string => *,

  /**
   * Dataset for charting.
   */
  data: ?Array<any>,

  /**
   * Indicates if data is updating. In case it is set to `true` chart should
   * render a preloader of some sort.
   */
  dataIsUpdating: boolean,
};
