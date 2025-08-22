"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Fact } from "../types";

import FactsDataContext from "../contexts/FactsDataContext";
import useUser from "../hooks/useUser";

const InfiniteScrollLoader = ({
  children,
  data,
  setData,
  getDataFunction,
  getDataFunctionParams,
  limit,
}: {
  children: React.JSX.Element;
  data: Fact[];
  setData: React.Dispatch<React.SetStateAction<Fact[] | undefined>>;
  getDataFunction?: (
    offset: number,
    token: string,
    getDataFunctionParams?: { insightUid: string },
  ) => Promise<Fact[] | undefined>;
  getDataFunctionParams?: { insightUid: string };
  limit?: number;
}): React.JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(limit);
  const [origin, setOrigin] = useState<string>();
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const [endOfData, setEndOfData] = useState(false);
  const { token } = useUser();
  const smallerThanFirstPage = useMemo(() => {
    return limit && data.length < limit;
  }, [data.length, limit]);

  // credit: https://dev.to/surajondev/building-an-infinite-scroll-component-in-react-1ljb
  const handleScroll = useCallback(() => {
    if (
      !smallerThanFirstPage &&
      !endOfData &&
      getDataFunction &&
      document.body.scrollHeight - 300 < window.scrollY + window.innerHeight
    ) {
      setLoading(true);
    }
  }, [endOfData, getDataFunction, smallerThanFirstPage]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only need to do this once
  }, []);

  useEffect(() => {
    if (loading && token && getDataFunction && data.length == offset) {
      getDataFunction(offset, token, getDataFunctionParams).then((newData) => {
        if (newData) {
          if (!limit || newData.length < limit) {
            setEndOfData(true);
          }
          setData([...data, ...newData]);
          setOffset(offset + (limit ?? 0));
        }
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- can't depend on FUNCTIONS
  }, [data, getDataFunction, limit, loading, offset, origin, token]);

  return (
    <FactsDataContext.Provider value={{ data, setData }}>
      {children}
      {/* FIXME: "Loading..." still showing up on e.g. http://localhost:3000/insights/m4eu2p0r */}
      {loading && !endOfData && <h1>Loading...</h1>}
    </FactsDataContext.Provider>
  );
};

export default InfiniteScrollLoader;
