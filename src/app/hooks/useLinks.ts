"use client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Link } from "../types";
import { GetLinksResponse, GetLinksSearchParams } from "../api/links/route";

const useLinks = ({
  offset,
  limit,
  query,
}: GetLinksSearchParams): [
  Link[] | undefined,
  Dispatch<SetStateAction<Link[] | undefined>>,
] => {
  const [links, setLinks] = useState<Link[]>();

  useEffect(() => {
    if (query !== null) {
      fetch(`/api/links?offset=${offset}&limit=${limit}&query=${query}`)
        .then(async (response: Response | GetLinksResponse) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then((json) => {
          setLinks(json);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once; use queryFunction for searches
  }, []);

  return [links, setLinks];
};

export default useLinks;
