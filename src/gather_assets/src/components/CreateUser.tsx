import * as React from 'react'
import {
  Profile,
  _SERVICE,
} from "../../../declarations/gather/gather.did";
import ProfileForm from "./ProfileForm";
import toast from "react-hot-toast";
import { emptyProfile } from "../hooks";
import { useContext } from "react";
import { AppContext } from "../App";
import { useNavigate } from "react-router-dom";

const CreateUser = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, isAuthenticated, actor, user, setUser } =
    useContext(AppContext);

  function handleCreationError() {
    setIsAuthenticated?.(false);
    setUser?.(undefined);
    toast.error("There was a problem creating your profile");
  }

  const submitCallback = async (profile: Profile) => {
    // Handle creation and verification async
    actor?.createUser(profile).then(async (createResponse) => {
      if ("ok" in createResponse) {
        const userResponse = await actor.readUser();
        if ("ok" in userResponse) {
          setUser(userResponse.ok);
          navigate('/manage');
        } else {
          console.error(userResponse.err);
          handleCreationError();
        }
      } else {
        handleCreationError();
        console.log("there was an error in profile creation:");
        console.error(createResponse.err);
      }
    });
  };

  return (
    <ProfileForm
      submitCallback={submitCallback}
      actor={actor}
      profile={emptyProfile}
    />
  );
};

export default CreateUser;
