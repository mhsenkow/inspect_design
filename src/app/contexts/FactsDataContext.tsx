import React, { createContext } from "react";

import { Fact } from "../types";

interface Props {
  data: Fact[] | undefined;
  setData: React.Dispatch<React.SetStateAction<Fact[] | undefined>>;
}

const FactsDataContext = createContext<Props>({ data: [], setData: () => {} });

export default FactsDataContext;
