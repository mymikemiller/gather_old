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

  // At the page we first land on, record the gathering id from the search
  // params so we know which gathering to load after login
  useEffect(() => {
    const gatheringId = searchParams.get("gathering");
    if (gatheringId) {
      localStorage.setItem('incomingGatheringId', gatheringId);
    } else {
      localStorage.removeItem('incomingGatheringId');
    }
  }, []);

  useEffect(() => {
    if (user && actor) {
      const incomingGatheringId = localStorage.getItem('incomingGatheringId');
      if (incomingGatheringId) {
        // Load the proper rsvp page
        navigate('/gathering/' + incomingGatheringId);
        localStorage.removeItem("incomingGatheringId");
      };
    };
  }, [user]);

  useEffect(() => {
    if (actor) {
      console.log('actor was set');
      actor.readUser().then((result) => {
        if ("ok" in result) {
          console.log('found a user');
          // Found user profile in IC. Load Home Page.
          setUser(result.ok);
          if (compareProfiles(result.ok.profile, emptyProfile)) {
            // Authenticated but no profile
            console.log('user matches empty profile');
            navigate('/create');
          } else {
            console.log('user does not match empty profile, so loading manage');
            // Logged in with profile
            navigate('/manage');
          }
        } else {
          if ("NotAuthorized" in result.err) {
            // Clear local delegation and log in
            toast.error("Your session expired. Please reauthenticate.");
            logout();
          } else if ("UserNotFound" in result.err) {
            // User has deleted account
            console.log("User has deleted account");
            if (user) {
              console.log("Yes user");
              toast.error("User profile not found. Please try creating again.");
            }
            console.log("setting user to undefined and going to create");
            // Authenticated but no profile
            setUser(undefined);
            navigate('/create');
          } else {
            toast.error("Error: " + Object.keys(result.err)[0]);
          }
        }
      });
    }
  }, [actor]);

  if (!authClient) return null;

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
              <Routes>
                <Route path="/" element={
                  <span />
                } />
                <Route path="/loading" element={
                  <span />
                } />
                <Route path="/manage" element={
                  <ActionButton id="logout" onPress={logout}>
                    Log out
                  </ActionButton>
                } />
                <Route path="/create" element={
                  <ActionButton id="logout" onPress={logout}>
                    Log out
                  </ActionButton>
                } />
                <Route path="/gathering" element={
                  <ActionButton id="logout" onPress={logout}>
                    Log out
                  </ActionButton>
                } />
                <Route path="/gathering/:gatheringId" element={
                  <ActionButton id="logout" onPress={logout}>
                    Log out
                  </ActionButton>
                } />
              </Routes>
              <h2>Gather</h2>
            </Header>
            <Main>
              <Flex maxWidth={700} margin="2rem auto" id="main-container">
                <Routes>
                  <Route path="/" element={
                    <Flex direction="column">
                      <Home />
                      <NotAuthenticated />
                    </Flex>
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
              </Flex>
            </Main>
          </Provider>
        </AppContext.Provider>
      </ErrorBoundary>
    </>
  );
};

export default App;
