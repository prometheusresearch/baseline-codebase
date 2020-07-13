/**
 * @flow
 */

import "./matchMediaMock.js";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { MuiThemeProvider } from "@material-ui/core";

import { ThemeProvider, DEFAULT_THEME } from "../index";
import { PickRenderer } from "../Pick/PickRenderer";
import * as Field from "../Field";

describe("PickRenderer", function() {
  test("renders PickRenderer with single data item", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <PickRenderer
            flat
            square
            isTabletWidth
            loading={false}
            data={[{ id: "test-id-1" }]}
            sorts={null}
            search={null}
            filters={null}
            fields={Field.configureFields(["id"])}
            selected={new Set()}
            onSelected={() => {}}
            params={{ namespace: "test-pick-renderer" }}
            onParams={() => {}}
            limit={51}
            hasPrev={false}
            offset={0}
            onOffset={() => {}}
            hasNext={false}
            disablePagination={false}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    const rows = screen.getAllByRole("row");

    expect(rows.length).toBe(2); // header + data row

    const headerRow = rows[0];

    expect(headerRow.children.length).toBe(1);

    const pagination = screen.getByTestId("pick-pagination");

    expect(pagination).toBeInTheDocument();
  });

  test("renders PickRenderer with more data", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <PickRenderer
            flat
            square
            isTabletWidth
            loading={false}
            data={[
              { id: "id-1", name: "name-1", age: 22 },
              { id: "id-2", name: "name-2", age: 33 },
              { id: "id-3", name: "name-3", age: 44 },
            ]}
            sorts={null}
            search={null}
            filters={null}
            fields={Field.configureFields(["id", "name", "age"])}
            selected={new Set()}
            onSelected={() => {}}
            params={{ namespace: "test-pick-renderer" }}
            onParams={() => {}}
            limit={51}
            hasPrev={false}
            offset={0}
            onOffset={() => {}}
            hasNext={false}
            disablePagination={false}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    const rows = screen.getAllByRole("row");

    expect(rows.length).toBe(4);

    const headerRow = rows[0];

    expect(headerRow.children.length).toBe(3);
  });

  test("renders PickRenderer with select column", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <PickRenderer
            flat
            square
            isTabletWidth
            loading={false}
            data={[
              { id: "id-1", name: "name-1", age: 22 },
              { id: "id-2", name: "name-2", age: 33 },
              { id: "id-3", name: "name-3", age: 44 },
            ]}
            sorts={null}
            search={null}
            filters={null}
            fields={Field.configureFields(["id", "name", "age"])}
            selected={new Set()}
            onSelected={() => {}}
            params={{ namespace: "test-pick-renderer" }}
            onParams={() => {}}
            limit={51}
            hasPrev={false}
            offset={0}
            onOffset={() => {}}
            hasNext={false}
            disablePagination={false}
            onSelectMany={() => {}}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    const rows = screen.getAllByRole("row");

    expect(rows.length).toBe(4);

    const headerRow = rows[0];

    // data columns + checkbox column
    expect(headerRow.children.length).toBe(4);
  });

  test("renders PickRenderer without pagination", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <PickRenderer
            flat
            square
            isTabletWidth
            loading={false}
            data={[{ id: "test-id-1" }]}
            sorts={null}
            search={null}
            filters={null}
            fields={Field.configureFields(["id"])}
            selected={new Set()}
            onSelected={() => {}}
            params={{ namespace: "test-pick-renderer" }}
            onParams={() => {}}
            limit={51}
            hasPrev={false}
            offset={0}
            onOffset={() => {}}
            hasNext={false}
            disablePagination
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    const pagination = screen.queryByTestId("pick-pagination");

    expect(pagination).not.toBeInTheDocument();
  });
});
