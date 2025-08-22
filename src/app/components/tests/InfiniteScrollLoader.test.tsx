import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import InfiniteScrollLoader from "../InfiniteScrollLoader";
import useUser from "../../hooks/useUser";
import { Fact } from "../../types";

jest.mock("../../hooks/useUser");

describe("InfiniteScrollLoader", () => {
  const mockData = [
    { id: 1, title: "Fact 1" },
    { id: 2, title: "Fact 2" },
  ] as Fact[];
  let newMockData: any;
  const mockSetData = jest.fn();
  const mockGetDataFunction = jest.fn();
  const limit = 2;
  const consoleError = console.error;

  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ token: "test-token" });
    console.error = (...args: string[]) => {
      if (!args.join("").includes("act")) {
        consoleError(args);
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <InfiniteScrollLoader
        data={mockData}
        setData={mockSetData}
        getDataFunction={mockGetDataFunction}
        limit={limit}
      >
        <div>Child Component</div>
      </InfiniteScrollLoader>,
    );
    expect(screen.getByText("Child Component")).toBeInTheDocument();
  });

  it("loads more data when scrolled to bottom", async () => {
    const newRow = { id: 3, title: "Fact 3" };
    mockGetDataFunction.mockResolvedValueOnce([newRow]);
    mockSetData.mockImplementation((value) => (newMockData = value));

    render(
      <InfiniteScrollLoader
        data={mockData}
        setData={mockSetData}
        getDataFunction={mockGetDataFunction}
        limit={limit}
      >
        <div>Child Component</div>
      </InfiniteScrollLoader>,
    );

    window.scrollY = document.body.scrollHeight - window.innerHeight + 1;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(mockGetDataFunction).toHaveBeenCalledTimes(1);
    });
    expect(newMockData).toEqual([...mockData, newRow]);
    expect(mockSetData).toHaveBeenCalledWith(newMockData);
  });

  it("does not load more data if end of data is reached", async () => {
    mockGetDataFunction.mockResolvedValueOnce([]);

    render(
      <InfiniteScrollLoader
        data={mockData}
        setData={mockSetData}
        getDataFunction={mockGetDataFunction}
        limit={limit}
      >
        <div>Child Component</div>
      </InfiniteScrollLoader>,
    );

    window.scrollY = document.body.scrollHeight - window.innerHeight + 1;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => expect(mockGetDataFunction).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
    );
  });

  it("does not show loading indicator if the data length is smaller than one page", async () => {
    render(
      <InfiniteScrollLoader
        data={[mockData[0]]}
        setData={mockSetData}
        getDataFunction={mockGetDataFunction}
        limit={limit}
      >
        <div>Child Component</div>
      </InfiniteScrollLoader>,
    );

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();

    window.scrollY = document.body.scrollHeight - window.innerHeight + 1;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => expect(mockGetDataFunction).toHaveBeenCalledTimes(0));
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("shows loading indicator while loading more data", async () => {
    mockGetDataFunction.mockResolvedValueOnce([{ id: 3, title: "Fact 3" }]);

    render(
      <InfiniteScrollLoader
        data={mockData}
        setData={mockSetData}
        getDataFunction={mockGetDataFunction}
        limit={limit}
      >
        <div>Child Component</div>
      </InfiniteScrollLoader>,
    );

    window.scrollY = document.body.scrollHeight - window.innerHeight + 1;
    window.dispatchEvent(new Event("scroll"));
    expect(await screen.findByText("Loading...")).toBeInTheDocument();

    await waitFor(() => expect(mockGetDataFunction).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
    );
  });
});
