import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import FactsTable from "../FactsTable";
import useUser from "../../hooks/useUser";
import { submitComment, submitReaction } from "../../functions";
import userEvent from "@testing-library/user-event";

jest.mock("../../hooks/useUser");
jest.mock("../../functions", () => ({
  getSortFunction: jest.requireActual("../../functions").getSortFunction,
  submitComment: jest.fn(),
  submitReaction: jest.fn(),
}));

const mockFacts = [
  {
    id: 1,
    title: "Fact 1",
    updated_at: "01/01/2023",
    reactions: [],
    comments: [],
    uid: "1",
  },
  {
    id: 2,
    title: "Fact 2",
    updated_at: "01/02/2023",
    reactions: [],
    comments: [],
    uid: "2",
  },
];

describe("FactsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ loggedIn: true, token: "token" });
  });

  it("renders the table with facts", () => {
    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={jest.fn()}
        dataFilter=""
        disabledIds={[]}
        selectRows={false}
        hideHead={false}
        setDataFilter={jest.fn()}
      />,
    );

    expect(screen.getByText("Fact 1")).toBeInTheDocument();
    expect(screen.getByText("Fact 2")).toBeInTheDocument();
  });

  it("sorts the table on click between descending, ascending, and unsorted", async () => {
    const columns = [
      {
        name: "Updated",
        dataColumn: "updated_at",
        display: (fact: Fact) => (
          <span className="text-sm text-secondary font-mono">
            {fact.updated_at
              ? new Date(fact.updated_at).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })
              : "---"}
          </span>
        ),
      },
      {
        name: "Title",
        display: (fact: Fact) => (
          <a
            href={`/insights/${fact.uid}`}
            className="text-primary hover:text-primary-600 transition-colors duration-200"
          >
            {fact.title}
          </a>
        ),
      },
    ];
    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={jest.fn()}
        columns={columns}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[]}
        selectRows={false}
        hideHead={false}
      />,
    );

    // Click to sort descending
    const header = screen.getByText("Updated");
    fireEvent.click(header);

    const headerWithSortIconDesc = screen.getByText("Updated▼");
    expect(headerWithSortIconDesc).toBeVisible();

    let rows = screen.getAllByRole("row");
    // rows[0] is in <thead>
    expect(rows.length).toBe(3);
    expect(rows[1].querySelectorAll("td").length).toBe(3); // checkbox > date > title
    expect(rows[2].querySelectorAll("td").length).toBe(3); // checkbox > date > title
    await waitFor(() => {
      expect(rows[1].childNodes[1]).toHaveTextContent("01/02/2023");
      expect(rows[2].childNodes[1]).toHaveTextContent("01/01/2023");
    });

    // Click to sort ascending
    fireEvent.click(header);

    const headerWithSortIconAsc = screen.getByText("Updated▲");
    expect(headerWithSortIconAsc).toBeVisible();

    rows = screen.getAllByRole("row");
    expect(rows[1].querySelectorAll("td").length).toBe(3); // checkbox > date > title
    expect(rows[2].querySelectorAll("td").length).toBe(3); // checkbox > date > title
    expect(rows[1].childNodes[1]).toHaveTextContent("01/01/2023");
    expect(rows[2].childNodes[1]).toHaveTextContent("01/02/2023");

    // Click to unsort (original order)
    fireEvent.click(header);

    expect(header.textContent).toBe("Updated");

    rows = screen.getAllByRole("row");
    expect(rows[1].querySelectorAll("td").length).toBe(3); // checkbox > date > title
    expect(rows[2].querySelectorAll("td").length).toBe(3); // checkbox > date > title
    expect(rows[1].childNodes[1]).toHaveTextContent("01/01/2023");
    expect(rows[2].childNodes[1]).toHaveTextContent("01/02/2023");
  });

  it("filters facts based on dataFilter", async () => {
    await act(async () => {
      render(
        <FactsTable
          data={mockFacts}
          setData={jest.fn()}
          factName="insight"
          selectedFacts={[]}
          setSelectedFacts={jest.fn()}
          dataFilter="Fact 1"
          setDataFilter={jest.fn()}
          disabledIds={[]}
          selectRows={false}
          hideHead={false}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Fact 1")).toBeInTheDocument();
    });
    expect(screen.queryByText("Fact 2")).not.toBeInTheDocument();
  });

  it("resets facts to original data when dataFilter is empty", async () => {
    const setData = jest.fn();
    render(
      <FactsTable
        data={mockFacts}
        setData={setData}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={jest.fn()}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[]}
        selectRows={false}
        hideHead={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Fact 1")).toBeInTheDocument();
      expect(screen.getByText("Fact 2")).toBeInTheDocument();
    });
  });

  it("calls setSelectedFacts when a row is clicked", async () => {
    const setSelectedFacts = jest.fn();
    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={setSelectedFacts}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[]}
        selectRows={true}
        hideHead={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Fact 1")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Fact 1"));
    expect(setSelectedFacts).toHaveBeenCalledWith([mockFacts[0]]);
  });

  it("calls setSelectedFacts twice when two rows are clicked", () => {
    const setSelectedFacts = jest.fn();
    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={setSelectedFacts}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[]}
        selectRows={true}
        hideHead={false}
      />,
    );

    fireEvent.click(screen.getByText("Fact 1"));
    fireEvent.click(screen.getByText("Fact 2"));
    expect(setSelectedFacts).toHaveBeenCalledTimes(2);
    expect(setSelectedFacts).toHaveBeenNthCalledWith(1, [mockFacts[0]]);
    expect(setSelectedFacts).toHaveBeenNthCalledWith(2, [mockFacts[1]]);
  });

  it("disables rows based on disabledIds", () => {
    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={jest.fn()}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[1]}
        selectRows={false}
        hideHead={false}
      />,
    );

    expect(screen.getByText("Fact 1").closest("tr")).toHaveClass("bg-tertiary");
  });

  it("enables reacting to a fact, showing the resulting reaction to the right of the title", async () => {
    (submitReaction as jest.Mock).mockImplementationOnce(() => ({
      reaction: "😀",
    }));

    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={jest.fn()}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[]}
        selectRows={false}
        hideHead={false}
        enableFeedback={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Fact 1")).toBeInTheDocument();
    });
    const reactButton = screen.getAllByText(/😲 React/i)[0];
    fireEvent.click(reactButton);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: /Select Reaction/i }),
      ).toBeInTheDocument();
    });
    // Select "😀" from the dropdown (default is "❤️")
    const selectElement = screen.getByRole("combobox", {
      name: /Select Reaction/i,
    }) as HTMLSelectElement;
    fireEvent.change(selectElement, { target: { value: "😀" } });
    await waitFor(() => {
      expect(selectElement.value).toBe("😀");
    });
    screen.getByRole("button", { name: "Submit Reaction" }).click();

    await waitFor(() => {
      expect(submitReaction as jest.Mock).toHaveBeenCalledTimes(1);
      expect(submitReaction as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          reaction: "😀",
        }),
        "token",
      );
    });

    const titleElement = screen.getByText(/Fact 1/);
    expect(titleElement).toBeInTheDocument();

    const emojiElement = titleElement.nextSibling;
    expect(emojiElement).toBeInTheDocument();
    expect((emojiElement as HTMLElement).tagName.toLowerCase()).toBe("span");

    await waitFor(() => {
      expect(emojiElement?.textContent).toContain("😀");
    });
  });

  it("enables reacting a 2nd time to a fact, showing the resulting reaction to the right of the title in place of the 1st one", async () => {
    (submitReaction as jest.Mock).mockImplementationOnce(() => ({
      reaction: "😀",
    }));
    (submitReaction as jest.Mock).mockImplementationOnce(() => ({
      reaction: "😈",
    }));

    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={jest.fn()}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[]}
        selectRows={false}
        hideHead={false}
        enableFeedback={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Fact 1")).toBeInTheDocument();
    });
    const reactButton = screen.getAllByText(/😲 React/i)[0];
    fireEvent.click(reactButton);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: /Select Reaction/i }),
      ).toBeInTheDocument();
    });
    // Select "😀" from the dropdown (default is "❤️")
    const selectElement = screen.getByRole("combobox", {
      name: /Select Reaction/i,
    }) as HTMLSelectElement;
    fireEvent.change(selectElement, { target: { value: "😀" } });
    await waitFor(() => {
      expect(selectElement.value).toBe("😀");
    });
    screen.getByRole("button", { name: "Submit Reaction" }).click();

    await waitFor(() => {
      expect(submitReaction as jest.Mock).toHaveBeenCalledTimes(1);
      expect(submitReaction as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          reaction: "😀",
        }),
        "token",
      );
    });

    const titleElement = screen.getByText(/Fact 1/);
    expect(titleElement).toBeInTheDocument();

    const emojiElement = titleElement.nextSibling;
    expect(emojiElement).toBeInTheDocument();
    expect((emojiElement as HTMLElement).tagName.toLowerCase()).toBe("span");

    await waitFor(() => {
      expect(emojiElement?.textContent).toContain("😀");
    });

    // Simulate a second reaction

    fireEvent.click(reactButton);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: /Select Reaction/i }),
      ).toBeInTheDocument();
    });
    // select 😈
    const selectElement2 = screen.getByRole("combobox", {
      name: /Select Reaction/i,
    }) as HTMLSelectElement;
    fireEvent.change(selectElement2, { target: { value: "😈" } });
    await waitFor(() => {
      expect(selectElement2.value).toBe("😈");
    });
    screen.getByRole("button", { name: "Submit Reaction" }).click();

    await waitFor(() => {
      expect(submitReaction as jest.Mock).toHaveBeenCalledTimes(2);
      expect(submitReaction as jest.Mock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          reaction: "😈",
        }),
        "token",
      );
    });

    await waitFor(() => {
      expect(emojiElement?.textContent).toContain("😈");
      expect(emojiElement?.textContent).not.toContain("😀");
    });
  });

  it("enables commenting on a fact, showing the new comment below the comment link", async () => {
    const COMMENT_TEXT = "hi there";
    (submitComment as jest.Mock).mockImplementationOnce(() => ({
      comment: COMMENT_TEXT,
    }));

    render(
      <FactsTable
        data={mockFacts}
        setData={jest.fn()}
        factName="insight"
        selectedFacts={[]}
        setSelectedFacts={jest.fn()}
        dataFilter=""
        setDataFilter={jest.fn()}
        disabledIds={[]}
        selectRows={false}
        hideHead={false}
        enableFeedback={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Fact 1")).toBeInTheDocument();
    });
    const commentLinks = screen.getAllByText(/💬 Comment/i);
    fireEvent.click(commentLinks[0]);

    const commentInput = screen.getByRole("textbox", {
      name: /Comment Text Div/i,
    });
    // The given element does not have a value setter
    // fireEvent.change(commentInput, { target: { value: "Nice fact!" } });
    await userEvent.type(commentInput, "Nice fact!");

    const submitButton = screen.getByRole("button", {
      name: /Submit Comment/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitComment as jest.Mock).toHaveBeenCalledWith(
        {
          comment: "Nice fact!",
        },
        "token",
      );
      expect(screen.getByText("Nice fact!")).toBeInTheDocument();
    });
  });
});
