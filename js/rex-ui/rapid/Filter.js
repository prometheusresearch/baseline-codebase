export type FilterConfig<+T = string> =
  | T
  | {
      name: T,
      render?: AbstractComponent<{
        value: any,
        values?: Array<any>,
        onChange: (newValue: any) => void,
      }>,
    };

export type FilterSpec = {|
  render: ?ComponentType<{
    value: any,
    values?: Array<any>,
    onChange: (newValue: any) => void,
  }>,
|};

export type FilterSpecMap = Map<string, FilterSpec>;

export type FiltersConfig = Array<FilterConfig>;

export const configureFilters = (configs?: ?FiltersConfig): ?FilterSpecMap => {
  if (configs == null || configs.length === 0) {
    return null;
  }
  let SpecMap: FilterSpecMap = new Map();

  for (let config of configs) {
    if (typeof config === "string") {
      SpecMap.set(config, { render: null });
    } else if (typeof config === "object") {
      SpecMap.set(config.name, { render: config.render });
    }
  }

  return SpecMap;
};

export const NO_VALUE = "undefined";
export const SORT_FIELD = "sort";
