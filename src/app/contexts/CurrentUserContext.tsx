import { createContext } from "react";

import { User } from "../types";

const CurrentUserContext = createContext<User | null>(null);

export default CurrentUserContext;
