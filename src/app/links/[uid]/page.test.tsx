/**
 * @jest-environment node
 */
import Linkpage, { generateMetadata } from "./page";
import { getLinkFromServer, getUserFromServer } from "../../api/functions";

jest.mock("../../api/functions");
jest.mock("next/headers", () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key) => {
      if (key == "x-origin") return "http://localhost";
      if (key == "x-url") return "http://localhost/test-url";
      if (key == "x-authUser") return JSON.stringify({ user_id: "123" });
    }),
  })),
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: "test-token" })),
  })),
}));

describe("Linkpage", () => {
  it("returns the ClientSidePage after getting link and user data", async () => {
    const mockGetLinkFromServer = getLinkFromServer as jest.Mock;
    const mockLink = {
      id: "link-id",
      title: "Test Link",
    };
    mockGetLinkFromServer.mockResolvedValue(mockLink);
    const mockGetUserFromServer = getUserFromServer as jest.Mock;
    const mockUser = {
      id: "user-id",
      name: "Test User",
    };
    mockGetUserFromServer.mockResolvedValue(mockUser);

    const props = { params: Promise.resolve({ uid: "test-uid" }) };
    const response = await Linkpage(props);

    expect(response.props).toEqual({
      linkInput: mockLink,
      currentUser: mockUser,
    });
    expect(mockGetLinkFromServer).toHaveBeenCalledWith(
      "http://localhost",
      "test-uid",
    );
    expect(mockGetUserFromServer).toHaveBeenCalledWith(
      "http://localhost",
      {
        id: "123",
      },
      "test-token",
    );
  });

  it("renders no summary message when link is not found", async () => {
    (getLinkFromServer as jest.Mock).mockResolvedValue(null);

    const props = { params: Promise.resolve({ uid: "test-uid" }) };
    const response = await Linkpage(props);

    expect(response.props.children).toEqual("No link with this UID");
  });
});

describe("generateMetadata", () => {
  it("generates metadata for link", async () => {
    const link = { title: "Test Link", imageUrl: "http://test.com/image.jpg" };
    const mockGetLinkFromServer = getLinkFromServer as jest.Mock;
    mockGetLinkFromServer.mockResolvedValue(link);

    const params = { uid: "test-uid" };
    const metadata = await generateMetadata({
      params: Promise.resolve(params),
    });

    expect(metadata).toEqual({
      openGraph: {
        url: "http://localhost/test-url",
        type: "article",
        title: "Test Link",
        description: "",
        images: "http://test.com/image.jpg",
        locale: "en_US",
      },
      twitter: {
        creator: "@bobstark",
      },
    });
    expect(mockGetLinkFromServer).toHaveBeenCalledWith(
      "http://localhost",
      "test-uid",
    );
  });

  it("returns undefined metadata when link is not found", async () => {
    const mockGetLinkFromServer = getLinkFromServer as jest.Mock;
    mockGetLinkFromServer.mockResolvedValue(null);

    const params = { uid: "test-uid" };
    const metadata = await generateMetadata({
      params: Promise.resolve(params),
    });

    expect(metadata).toBeUndefined();
    expect(mockGetLinkFromServer).toHaveBeenCalledWith(
      "http://localhost",
      "test-uid",
    );
  });
});
