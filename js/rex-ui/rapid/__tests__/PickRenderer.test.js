/**
 * @flow
 */

import "./matchMediaMock.js";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MuiThemeProvider } from "@material-ui/core";

import { ThemeProvider, DEFAULT_THEME } from "../index";
import type { Params, PickSelection, SortSpec } from "../Pick/Pick";
import { PickRenderer } from "../Pick/PickRenderer";
import { RenderSearch } from "../Pick/PickSearchToolbar.js";
import * as Action from "../Action";
import * as Field from "../Field";
import * as Filter from "../Filter";
import { SelectFilter } from "../Pick/PickFilterToolbar";

function TestPickRenderer<O: { id: string, [key: string]: mixed }>({
  data,
  actions,
  fields,
  filters,
  sorts,
  search,
  limit = 51,
  hasNext = false,
  hasPrev = false,
  disablePagination = false,
  onSelected: onSelectedFunc,
  onOffset: onOffsetFunc,
  initialParams = {},
  onParams: onParamsFunc,
  onSelect,
  onSelectMany,
}: {|
  +data: Array<O>,
  +actions?: Action.ActionConfig<any, PickSelection<O>>[],
  +fields: Array<Field.FieldSpec>,
  +filters?: ?Filter.FilterSpecMap,
  +sorts?: SortSpec<string>,
  +search?: Filter.FilterSpec,
  +limit?: number,
  +hasNext?: boolean,
  +hasPrev?: boolean,
  +disablePagination?: boolean,
  +onSelected?: (selected: Set<mixed>) => void,
  +onOffset?: (offset: number) => void,
  +initialParams?: Params,
  +onParams?: Function,
  +onSelect?: Function,
  +onSelectMany?: Function,
|}) {
  const [selected, setSelected] = React.useState(new Set());
  const [params, setParams] = React.useState<Params>(initialParams);
  const [offset, setOffset] = React.useState<number>(0);
  const onSelected = selected => {
    setSelected(selected);
    onSelectedFunc && onSelectedFunc(selected);
  };
  const onOffset = offset => {
    setOffset(offset);
    onOffsetFunc && onOffsetFunc(offset);
  };
  const onParams = params => {
    setParams(params);
    onParamsFunc && onParamsFunc();
  };
  console.log(selected);
  return (
    <ThemeProvider theme={DEFAULT_THEME}>
      <MuiThemeProvider theme={DEFAULT_THEME}>
        <PickRenderer
          data={data}
          actions={actions}
          fields={fields}
          filters={filters}
          sorts={sorts}
          search={search}
          selected={selected}
          onSelected={onSelected}
          params={params}
          onParams={onParams}
          limit={limit}
          offset={offset}
          onOffset={onOffset}
          hasPrev={hasPrev}
          hasNext={hasNext}
          disablePagination={disablePagination}
          onSelect={onSelect}
          onSelectMany={onSelectMany}
          flat
          square
          isTabletWidth
          loading={false}
        />
      </MuiThemeProvider>
    </ThemeProvider>
  );
}

const isMuiChecked = (element: HTMLElement) =>
  [].some.call(element.parentElement?.parentElement?.classList, c =>
    /MuiCheckbox-checked-\d+/.test(c),
  );

describe("PickRenderer", function() {
  test("renders PickRenderer with single data item without pagination", () => {
    const data = [{ id: "test-id-1" }];
    const fields = Field.configureFields(["id"]);
    render(<TestPickRenderer data={data} fields={fields} disablePagination />);

    const rows = screen.getAllByRole("row");

    expect(rows).toHaveLength(2); // header + data row

    const headerRow = rows[0];

    expect(headerRow.children).toHaveLength(1);

    // pick search should be not be rendered
    expect(
      screen.queryByRole("textbox", { name: "site-search" }),
    ).not.toBeInTheDocument();

    // filter toolbar should be rendered with empty filters
    expect(screen.getByTestId("pick-filter-toolbar")).toBeInTheDocument();
    expect(screen.queryByLabelText(/filter-.+/i)).not.toBeInTheDocument();

    expect(screen.queryByTestId("pick-pagination")).not.toBeInTheDocument();
  });

  test("renders PickRenderer with more data with pagination", () => {
    const data = [
      { id: "id-1", name: "name-1", age: 22 },
      { id: "id-2", name: "name-2", age: 33 },
      { id: "id-3", name: "name-3", age: 44 },
    ];
    const fields = Field.configureFields(["id", "name", "age"]);
    render(<TestPickRenderer data={data} fields={fields} />);

    const rows = screen.getAllByRole("row");

    expect(rows).toHaveLength(4);

    const headerRow = rows[0];

    expect(headerRow.children).toHaveLength(3);

    // pagination should be rendered with buttons disabled
    expect(screen.getByTestId("pick-pagination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "previous" })).toBeDisabled();
  });

  test("renders PickRenderer with select column", () => {
    const data = [
      { id: "id-1", name: "name-1", age: 22 },
      { id: "id-2", name: "name-2", age: 33 },
      { id: "id-3", name: "name-3", age: 44 },
    ];
    const fields = Field.configureFields(["id", "name", "age"]);
    const onSelectMany = jest.fn();
    render(
      <TestPickRenderer
        data={data}
        fields={fields}
        onSelectMany={onSelectMany}
      />,
    );

    const rows = screen.getAllByRole("row");

    expect(rows).toHaveLength(4);

    const headerRow = rows[0];

    // data columns + checkbox column
    expect(headerRow.children).toHaveLength(4);
  });

  test("renders PickRenderer with search, filters and pagination", () => {
    const actionFn = jest.fn();
    const actions = [
      {
        name: "test-action",
        kind: "primary",
        title: "Test action",
        run: actionFn,
      },
    ];
    const data = [{ id: "test-id-1", name: "test-name", status: "checked" }];
    const params = {
      status: "checked",
      search: "search-text",
    };
    render(
      <TestPickRenderer
        data={data}
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
        initialParams={params}
        hasPrev={true}
        hasNext={true}
        actions={actions}
      />,
    );

    // search should be rendered with initial value
    expect(screen.getByRole("textbox", { name: "site-search" })).toHaveValue(
      "search-text",
    );

    // filter toolbar should be rendered with status filter and initial option selected
    expect(screen.getByTestId("pick-filter-toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("filter-status")).toHaveValue("checked");
    expect(screen.getByText("Checked")).toBeInTheDocument();

    // pagination shoudl be rendered with buttons enabled
    expect(screen.getByTestId("pick-pagination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "next" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "previous" })).not.toBeDisabled();

    // list should contain 1 action
    const actionButtons = screen.getAllByRole("button", { name: /^test/i });
    expect(actionButtons).toHaveLength(1);
    expect(actionButtons[0]).toHaveTextContent("Test action");

    // click on action button should call the action function
    userEvent.click(actionButtons[0]);
    expect(actionFn).toHaveBeenCalledWith({
      data: {
        type: "selected",
        rows: [],
      },
      params,
    });
  });

  test("renders PickRenderer with single row selection", () => {
    const onSelect = jest.fn();
    const onSelectMany = jest.fn();
    const onSelected = jest.fn();

    const item1 = { id: "test-id-1" };
    const item2 = { id: "test-id-2" };
    const data = [item1, item2];

    render(
      <TestPickRenderer
        data={data}
        fields={Field.configureFields(["id"])}
        onSelect={onSelect}
        onSelectMany={onSelectMany}
        onSelected={onSelected}
      />,
    );

    // should call onSelect on row click and not call other functions
    const row = screen.getByText("test-id-1");
    userEvent.click(row);

    expect(onSelect).toHaveBeenCalledWith(item1);

    expect(onSelectMany).not.toHaveBeenCalledWith();
    expect(onSelected).not.toHaveBeenCalled();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    const [checkAll, checkRow] = checkboxes;
    expect(isMuiChecked(checkAll)).not.toBe(true);
    expect(isMuiChecked(checkRow)).not.toBe(true);
  });

  test("renders PickRenderer with multiple row selection", () => {
    const onSelectMany = jest.fn();

    const item1 = { id: "test-id-1" };
    const item2 = { id: "test-id-2" };
    const data = [item1, item2];

    const selected = new Set();
    const onSelected = jest.fn();

    render(
      <TestPickRenderer
        data={data}
        fields={Field.configureFields(["id"])}
        onSelectMany={onSelectMany}
        onSelected={onSelected}
        disablePagination
      />,
    );

    const [headerRow, row1, row2] = screen.getAllByRole("row");
    const [checkAll, check1, check2] = screen.getAllByRole("checkbox");

    // should call onSelect on row click and not call other functions
    userEvent.click(row1);

    expect(onSelectMany).toHaveBeenCalledWith([item1]);
    expect(onSelected).toHaveBeenCalledWith(selected.add(item1.id));

    expect(checkAll).toHaveAttribute("data-indeterminate", "true");
    expect(isMuiChecked(check1)).toBe(true);
    expect(isMuiChecked(check2)).toBe(false);
  });
});
