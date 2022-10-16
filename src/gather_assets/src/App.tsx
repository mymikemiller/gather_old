import * as React from "react";
import {
  Provider,
  defaultTheme,
  Flex,
  ActionButton,
} from "@adobe/react-spectrum";
import styled from "styled-components";
import NotAuthenticated from "./components/NotAuthenticated";
import Home from "./components/Home";
import RsvpForm from "./components/RsvpForm";
import { _SERVICE, Profile, User } from "../../declarations/gather/gather.did";
import toast, { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  Outlet,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import CreateUser from "./components/CreateUser";
import ManageProfile from "./components/ManageProfile";
import Loading from "./components/Loading";
import { emptyProfile, useAuthClient } from "./hooks";
import { AuthClient } from "@dfinity/auth-client";
import { ActorSubclass } from "@dfinity/agent";
import { useEffect } from "react";
import { compareProfiles } from "./utils";

const Header = styled.header`
  position: relative;
  padding: 1rem;
  display: flex;
  justify-content: center;
  h1 {
    margin-top: 0;
  }
  #logout {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
  }
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
`;

export const AppContext = React.createContext<{
  authClient?: AuthClient;
  setAuthClient?: React.Dispatch<AuthClient>;
  isAuthenticated?: boolean;
  setIsAuthenticated?: React.Dispatch<React.SetStateAction<boolean>>;
  login: () => void;
  logout: () => void;
  actor?: ActorSubclass<_SERVICE>;
  user?: User;
  setUser: React.Dispatch<User>;
}>({
  login: () => { },
  logout: () => { },
  user: undefined,
  setUser: () => { },
});

const App = () => {
  const {
    authClient,
    setAuthClient,
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    actor,
    user,
    setUser
  } = useAuthClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // At the page we first land on, record the URL the user was attempting to
  // load so we can navigate to it once we're logged in
  useEffect(() => {
    console.log("Storing landing path: " + location.pathname);
    localStorage.setItem("landingPath", location.pathname + location.search);
  }, []);

  useEffect(() => {
    console.log("user changed");
    if (user && actor) {
      console.log("user and actor set");
      if (compareProfiles(user.profile, emptyProfile)) {
        // Authenticated but no profile
        console.log("empty profile, navigating to create");
        navigate('/create');
      }

      // We saved the landing URL when we first loaded, so navigate there now
      // that we're logged in and have a profile
      returnToLandingPage();
    } else {
      console.log("no user or no actor");
      console.log(user);
      console.log(actor);
    };
  }, [user]);

  const returnToLandingPage = () => {
    const landingPath = localStorage.getItem("landingPath");
    if (landingPath) {
      console.log("navigating to landingPath " + landingPath);
      navigate(landingPath);
    } else {
      console.log("landingPath not found");
      navigate("/");
    };
  };

  useEffect(() => {
    console.log("actor changed");
    if (actor) {
      // We have an actor to work with, now fetch the user
      (async () => {
        var landingPath = localStorage.getItem("landingPath");
        if (landingPath) {
          console.log("landingPath: " + landingPath);
          var userResult = await actor.readUser();

          if ("ok" in userResult) {
            console.log("userResult ok, setting user");
            console.dir(userResult.ok);
            // Found user in IC. 
            setUser(userResult.ok); // This causes the user useEffect above, which will redirect us appropriately
          } else {
            console.log("userResult not ok");
            if ("NotAuthorized" in userResult.err) {
              // Clear local delegation and log in
              toast.error("Your session expired. Please reauthenticate.");
              logout();
            } else if ("NotFound" in userResult.err) {
              // User has deleted account
              if (user) {
                toast.error("User profile not found. Please try creating again.");
              }
              // Authenticated but no profile
              setUser(undefined);
              navigate('/create');
            } else {
              toast.error("Error: " + Object.keys(userResult.err)[0]);
            }
          }
        } else {
          console.log("landingPath null");
        }
      })();
    } else {
      console.log("actor null");
    }
  }, [actor]);

  if (!authClient) return null;

  console.log("App is returning html. user is " + user);

  return (
    <>
      <Toaster
        toastOptions={{
          duration: 5000,
          position: "bottom-center",
        }}
      />
      <ErrorBoundary>
        <AppContext.Provider
          value={{
            authClient,
            setAuthClient,
            isAuthenticated,
            setIsAuthenticated,
            login,
            logout,
            actor,
            user,
            setUser
          }}
        >
          <Provider theme={defaultTheme}>
            <Header>
              {!user ? (
                <></>
              ) : (
                <Routes>
                  <Route path="/loading" element={
                    <span />
                  } />
                  <Route path="*" element={
                    <ActionButton id="logout" onPress={logout}>
                      Log out
                    </ActionButton>
                  } />
                </Routes>
              )}
              < h2 > Gather</h2>
            </Header>
            <Main>
              <Flex maxWidth={700} margin="2rem auto" id="main-container">
                {!isAuthenticated ? (
                  <Flex direction="column">
                    <Home />
                    <NotAuthenticated />
                  </Flex>
                ) : (
                  <Routes>
                    <Route path="/" element={
                      <Header>Welcome to Gather. Please wait...</Header>
                    } />
                    <Route path="gathering" element={<Outlet />}>
                      <Route path=":gatheringId" element={<RsvpForm actor={actor!} user={user!} />} />
                      {/* <Route path=":gatheringId/edit" element={<EditGathering />} /> */}
                      {/* <Route path="new" element={<NewGatheringForm />} /> */}
                    </Route>
                    <Route path="/loading" element={<Loading />} />
                    <Route path="/manage" element={<ManageProfile />} />
                    <Route path="/create" element={<CreateUser />} />
                  </Routes>
                )}
              </Flex>
            </Main>
          </Provider>
        </AppContext.Provider>
      </ErrorBoundary>
    </>
  );
};

export default App;
