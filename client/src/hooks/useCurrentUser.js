import { useState, useEffect } from "react";
import { fetchData } from "../components/utils"; // your helper to call backend

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const data = await fetchData("api/v1/user/user");
        if (data) setCurrentUser(data);
      } catch (err) {
        console.log(err);
      }
    };
    getUser();
  }, []);

  return currentUser;
};
