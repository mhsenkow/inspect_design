import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import FactsListView from "../FactsListView";
import FactsDataContext from "../../contexts/FactsDataContext";
import useUser from "../../hooks/useUser";
import { Fact } from "../../types";

jest.mock("../../hooks/useUser");

const mockFacts = [
  {
    id: 1,
    uid: "1",
    is_public: false,
    citations: [],
    title: "Fact 1",
    comments: [],
    reactions: [],
  },
  {
    id: 2,
    uid: "2",
    is_public: true,
    citations: [],
    title: "Fact 2",
    comments: [],
    reactions: [],
  },
];

const mockHandleOnClick = jest.fn();
const mockServerFunction = jest.fn();

const mockUnselectedActions = [
  {
    className: "unselected-action",
    text: "Unselected Action",
    handleOnClick: mockHandleOnClick,
    serverFunction: mockServerFunction,
    enabled: true,
  },
];

const mockSelectedActions = [
  {
    className: "selected-action",
    text: "Selected Action",
    handleOnClick: mockHandleOnClick,
    serverFunction: mockServerFunction,
    enabled: true,
  },
];

const mockColumns = [
  {
    name: "Public",
    display: (fact: Fact) => <span>{fact.is_public.toString()}</span>,
  },
];

describe("FactsListView", () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({
      token: "test-token",
      loggedIn: true,
    });
  });

  it("renders without crashing", () => {
    render(
      <FactsDataContext.Provider
        value={{ data: mockFacts, setData: jest.fn() }}
      >
        <FactsListView
          factName="testFact"
          setServerFunctionInput={jest.fn()}
          selectedFacts={[]}
          setSelectedFacts={jest.fn()}
          unselectedActions={mockUnselectedActions}
          selectedActions={mockSelectedActions}
          columns={mockColumns}
          setActiveServerFunction={jest.fn()}
          activeServerFunction={{ function: jest.fn() }}
        />
      </FactsDataContext.Provider>,
    );

    mockUnselectedActions.forEach((a) =>
      expect(screen.getByText(a.text)).toBeInTheDocument(),
    );
  });

  it("calls handleOnClick and activeServerFunction for unselected action", async () => {
    mockServerFunction.mockResolvedValue([{ action: 0, facts: [] }]);
    let activeServerFunction;
    const mockSetActiveServerFunction = jest.fn().mockImplementation((func) => {
      activeServerFunction = func;
    });

    const { rerender } = render(
      <FactsDataContext.Provider
        value={{ data: mockFacts, setData: jest.fn() }}
      >
        <FactsListView
          factName="testFact"
          serverFunctionInput={{}}
          setServerFunctionInput={jest.fn()}
          selectedFacts={[]}
          setSelectedFacts={jest.fn()}
          unselectedActions={mockUnselectedActions}
          selectedActions={mockSelectedActions}
          columns={mockColumns}
          setActiveServerFunction={mockSetActiveServerFunction}
          activeServerFunction={activeServerFunction}
        />
      </FactsDataContext.Provider>,
    );

    fireEvent.click(screen.getByText("Unselected Action"));

    expect(mockHandleOnClick).toHaveBeenCalledTimes(1);
    expect(mockSetActiveServerFunction).toHaveBeenCalledWith({
      function: mockServerFunction,
    });

    rerender(
      <FactsDataContext.Provider
        value={{ data: mockFacts, setData: jest.fn() }}
      >
        <FactsListView
          factName="testFact"
          serverFunctionInput={{}}
          setServerFunctionInput={jest.fn()}
          selectedFacts={[]}
          setSelectedFacts={jest.fn()}
          unselectedActions={mockUnselectedActions}
          selectedActions={mockSelectedActions}
          columns={mockColumns}
          setActiveServerFunction={mockSetActiveServerFunction}
          activeServerFunction={activeServerFunction}
        />
      </FactsDataContext.Provider>,
    );

    await waitFor(() => expect(mockServerFunction).toHaveBeenCalledTimes(1));
    expect(mockSetActiveServerFunction).toHaveBeenCalledWith({
      function: mockServerFunction,
    });
    expect(mockSetActiveServerFunction).toHaveBeenCalledWith(undefined);
  });

  it("calls handleOnClick for selected action", async () => {
    mockServerFunction.mockResolvedValue([{ action: 0, facts: [] }]);
    let activeServerFunction;
    const mockSetActiveServerFunction = jest.fn().mockImplementation((func) => {
      activeServerFunction = func;
    });
    const selectedFacts = [mockFacts[0]];

    const { rerender } = render(
      <FactsDataContext.Provider
        value={{ data: mockFacts, setData: jest.fn() }}
      >
        <FactsListView
          factName="testFact"
          serverFunctionInput={{}}
          setServerFunctionInput={jest.fn()}
          selectedFacts={selectedFacts}
          setSelectedFacts={jest.fn()}
          unselectedActions={mockUnselectedActions}
          selectedActions={mockSelectedActions}
          columns={mockColumns}
          setActiveServerFunction={mockSetActiveServerFunction}
          activeServerFunction={activeServerFunction}
        />
      </FactsDataContext.Provider>,
    );

    const firstTable = document.getElementsByTagName("table")[0];
    const tbody = firstTable.getElementsByTagName("tbody")[0];
    const firstRow = tbody.getElementsByTagName("tr")[0];
    const checkbox = firstRow.children[0].children[0];
    expect(checkbox.tagName.toLowerCase()).toBe("input");
    await expect(checkbox).toHaveAttribute("type", "checkbox");
    expect((checkbox as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByText("Selected Action"));
    expect(mockHandleOnClick).toHaveBeenCalledWith([mockFacts[0]]);

    expect(mockSetActiveServerFunction).toHaveBeenCalledWith({
      function: mockServerFunction,
    });

    rerender(
      <FactsDataContext.Provider
        value={{ data: mockFacts, setData: jest.fn() }}
      >
        <FactsListView
          factName="testFact"
          serverFunctionInput={{}}
          setServerFunctionInput={jest.fn()}
          selectedFacts={selectedFacts}
          setSelectedFacts={jest.fn()}
          unselectedActions={mockUnselectedActions}
          selectedActions={mockSelectedActions}
          columns={mockColumns}
          setActiveServerFunction={mockSetActiveServerFunction}
          activeServerFunction={activeServerFunction}
        />
      </FactsDataContext.Provider>,
    );

    await waitFor(() => expect(mockServerFunction).toHaveBeenCalled());
  });

  it("displays facts in the table", () => {
    render(
      <FactsDataContext.Provider
        value={{ data: mockFacts, setData: jest.fn() }}
      >
        <FactsListView
          factName="testFact"
          setServerFunctionInput={jest.fn()}
          selectedFacts={[]}
          setSelectedFacts={jest.fn()}
          unselectedActions={mockUnselectedActions}
          selectedActions={mockSelectedActions}
          columns={mockColumns}
          setActiveServerFunction={jest.fn()}
          activeServerFunction={{ function: jest.fn() }}
        />
      </FactsDataContext.Provider>,
    );

    expect(screen.getByText("false")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });
});
