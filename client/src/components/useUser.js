import { useContext } from "react";
import UserContext from "./UserProvider"; // import the context

export const useUser = () => useContext(UserContext);
