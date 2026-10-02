import { useEffect, useState } from "react";
import UserContext from "./UserContext";
import axios from "axios";

function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        axios.get("http://localhost:5000/user", { withCredentials: true })
            .then((response) => {
                if (isActive) setUser(response.data.user || null);
            })
            .catch(() => {
                if (isActive) setUser(null);
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export default UserProvider;