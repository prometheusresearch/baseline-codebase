/**
 * @flow
 */

import * as React from "react";
import { withFetch } from "rex-widget/data";

function fetchData({ data, filterState = [] }) {
  return {
    data: data.data(JSON.stringify({ filters: filterState }))
  };
}

function unwrapData(data) {
  return data == null ? null : data[Object.keys(data)[0]];
}

/**
 * A very simplistic custom chart implemented as horizontal bar chart using HTML
 * DOM elements. You'd probably want to use a library of your choice here.
 */
export default withFetch(({ config, fetched: { data } }) => {
  if (data.data == null || data.updating) {
    return <div>Loading...</div>;
  } else {
    data = unwrapData(data.data);
    const bars = data.map(item => {
      const value = item[config.value.key];
      const label = item[config.label.key];
      return (
        <div
          key={value}
          style={{
            padding: 10,
            marginBottom: 5,
            width: value * 2,
            backgroundColor: "blue",
            color: "white"
          }}
        >
          {label} ({value})
        </div>
      );
    });
    return <div style={{ padding: 10 }}>{bars}</div>;
  }
}, fetchData);
