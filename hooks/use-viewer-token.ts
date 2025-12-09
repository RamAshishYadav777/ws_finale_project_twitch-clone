import { toast } from "sonner";
import { useEffect, useState } from "react";
import { JwtPayload, jwtDecode } from "jwt-decode";

import { createViewerToken } from "@/actions/token";

export const useViewerToken = (hostIdentity: string) => {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");

  useEffect(() => {
    let active = true;
    setToken("");
    setName("");
    setIdentity("");

    const createToken = async () => {
      try {
        const viewerToken = await createViewerToken(hostIdentity);

        if (active) {
          setToken(viewerToken);

          const decodedToken = jwtDecode(viewerToken) as JwtPayload & {
            name?: string;
          };

          const name = decodedToken?.name;
          const identity = decodedToken.jti;

          if (identity) {
            setIdentity(identity);
          }

          if (name) {
            setName(name);
          }
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    };

    createToken();

    return () => {
      active = false;
    };
  }, [hostIdentity]);

  return {
    token,
    name,
    identity,
  };
};
