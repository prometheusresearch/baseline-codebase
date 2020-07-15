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
import { RenderSearch } from "../Pick/PickSearchToolbar.js";
import * as Field from "../Field";
import * as Filter from "../Filter";
import { SelectFilter } from "../Pick/PickFilterToolbar";

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

    // pick search should be not be rendered
    expect(
      screen.queryByRole("textbox", { name: "site-search" }),
    ).not.toBeInTheDocument();

    // filter toolbar should be rendered with empty filters
    expect(screen.getByTestId("pick-filter-toolbar")).toBeInTheDocument();
    expect(screen.queryByLabelText(/filter-.+/i)).not.toBeInTheDocument();

    // pagination should be rendered with buttons disabled
    expect(screen.getByTestId("pick-pagination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "previous" })).toBeDisabled();
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

  test("renders PickRenderer with search, filters and pagination", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <PickRenderer
            flat
            square
            isTabletWidth
            loading={false}
            data={[{ id: "test-id-1", name: "test-name", status: "checked" }]}
            sorts={null}
            search={{
              name: "search",
              render: RenderSearch,
            }}
            filters={Filter.configureFilters([
              {
                name: "status",
                render(props) {
                  let options = [
                    { label: "Checked", value: "checked" },
                    {
                      label: "Unchecked",
                      value: "unchecked",
                    },
                  ];
                  return <SelectFilter {...props} options={options} />;
                },
              },
            ])}
            fields={Field.configureFields(["id", "name", "status"])}
            selected={new Set()}
            onSelected={() => {}}
            params={{
              namespace: "test-pick-renderer",
              status: "checked",
              search: "search-text",
            }}
            onParams={() => {}}
            limit={51}
            offset={0}
            onOffset={() => {}}
            hasPrev={true}
            hasNext={true}
            disablePagination={false}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // search should be rendered with initial value
    expect(screen.getByRole("textbox", { name: "site-search" })).toHaveValue(
      "search-text",
    );

    // filter toolbar should be rendered with status filter and initial option selected
    expect(screen.getByTestId("pick-filter-toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("filter-status")).toBeInTheDocument();
    expect(screen.getByText("Checked")).toBeInTheDocument();

    // pagination shoudl be rendered with buttons enabled
    expect(screen.getByTestId("pick-pagination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "next" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "previous" })).not.toBeDisabled();

    screen.debug();
  });
});
