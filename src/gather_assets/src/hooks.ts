import { ActorSubclass } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { useState, useEffect } from "react";
import { canisterId, createActor } from "../../declarations/gather";
import { Profile, User, _SERVICE } from "../../declarations/gather/gather.did";
import { useNavigate } from "react-router-dom";

type UseAuthClientProps = {};
export function useAuthClient(props?: UseAuthClientProps) {
  const [authClient, setAuthClient] = useState<AuthClient>();
  const [actor, setActor] = useState<ActorSubclass<_SERVICE>>();
  const [user, setUser] = useState<User>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  const ii_url = process.env.II_URL?.replace("{origin}", window.location.origin);

  const login = async () => {
    const alreadyAuthenticated = await authClient?.isAuthenticated();
    console.log("alreadyAuthenticated: " + alreadyAuthenticated);
    if (alreadyAuthenticated) {
      setIsAuthenticated(true);
      navigate('/loading');
    } else {
      authClient?.login({
        identityProvider: ii_url,
        onSuccess: () => {
          setIsAuthenticated(true);
          navigate('/loading');
        },
      });
    }
  };

  const initActor = () => {
    const actor = createActor(canisterId as string, {
      agentOptions: {
        identity: authClient?.getIdentity(),
      },
    });
    console.log('Setting actor');
    setActor(actor);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActor(undefined);
    setUser(undefined);
    authClient?.logout({ returnTo: "/" });
  };

  useEffect(() => {
    if (authClient == null) {
      AuthClient.create().then(async (client) => {
        setAuthClient(client);
      });
    }
  }, []);

  useEffect(() => {
    if (authClient != null) {
      (async () => {
        const authenticated = await authClient?.isAuthenticated();
        if (authenticated) {
          setIsAuthenticated(true);
        }
      })();
    }
  }, [authClient]);

  useEffect(() => {
    if (isAuthenticated) initActor();
  }, [isAuthenticated]);

  return {
    authClient,
    setAuthClient,
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    actor,
    user,
    setUser,
  };
}

export const emptyProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  picture: "",
  gatherings_created: [],
  gatherings_responded: [],
};
