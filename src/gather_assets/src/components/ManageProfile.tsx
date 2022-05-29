import { ActorSubclass } from "@dfinity/agent";
import {
  ActionButton,
  ButtonGroup,
  Grid,
  Heading,
  Text,
} from "@adobe/react-spectrum";
import Cancel from "@spectrum-icons/workflow/Cancel";
import Delete from "@spectrum-icons/workflow/Delete";
import Edit from "@spectrum-icons/workflow/Edit";
import * as React from 'react'
import { useContext } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Profile,
  User,
  _SERVICE,
} from "../../../declarations/gather/gather.did";
import { AppContext } from "../App";
import { emptyProfile } from "../hooks";
import { pushProfile } from "../utils";
import ProfileForm from "./ProfileForm";
import { canisterId as gatherCanisterId, createActor as createGatherActor } from "../../../declarations/gather";
import { _SERVICE as _GATHER_SERVICE } from "../../../declarations/gather/gather.did";

const DetailsList = styled.dl`
  dd {
    margin-left: 0;
  }
`;

function ManageProfile() {
  const [isEditing, setIsEditing] = React.useState(false);
  const [gatherActor, setGatherActor] = React.useState<ActorSubclass<_GATHER_SERVICE>>();
  const { actor, user, setUser } = useContext(AppContext);
  const navigate = useNavigate();

  const initGatherActor = () => {
    const sActor = createGatherActor(gatherCanisterId as string);
    setGatherActor(sActor);
  };

  React.useEffect(() => {
    initGatherActor();
  }, []);

  const deleteProfile = async () => {
    if (
      confirm(
        "Are you sure you want to delete your contributor profile? This will be permanent!"
      )
    ) {
      const result = await actor?.delete();
      toast.success("Contributor profile successfully deleted");
      console.log(result);
      navigate("/");
    }
  };

  const submitCallback = (profile: Profile) => {
    setIsEditing(false);

    // Handle update async
    pushProfile(actor!, profile).then(async (user: User | undefined) => {
      if (user) {
        toast.success("User profile updated!");
        setUser(user);
        navigate('/manage');
      }
    });
  };

  const formProps = {
    submitCallback,
    actor,
    profile: user.profile ?? emptyProfile,
  };

  if (!user) {
    console.log('There is no user, so returning null for ManageProfile component');
    return null;
  }

  const { name } = user.profile;

  if (gatherActor == undefined) {
    console.log('gatherActor is undefined when trying to render ManageProfile');
    return null;
  }

  return (
    <>
      {isEditing ? (
        <section key={String(isEditing)}>
          <Heading level={2}>Editing Profile</Heading>
          <ProfileForm {...formProps} />
          <ActionButton
            onPress={(e) => {
              setIsEditing(false);
            }}
          >
            <Cancel /> <Text>Cancel</Text>
          </ActionButton>
        </section>
      ) : (
        <section key={String(isEditing)}>
          <Heading level={2}>
            Welcome back, {name}!
          </Heading>
          {/* todo: prompt to click a gathering link when appropriate */}
          {/* {feedKeys.length == 0 && <Text>No feed keys found. Please click the Videate link in the shownotes to populate.</Text>}
          <ul style={{ padding: 0 }} >
            {feedKeys.map((feedKey, index) => {
              console.log(`${index}: ${feedKey}`)
              return (
                <li key={feedKey} style={{ listStyleType: 'none', marginBottom: '1em' }} >
                  <CopyableLink serveActor={serveActor!} feedKey={feedKey} />
                </li>
              )
            })}
          </ul> */}
          <ButtonGroup>
            <ActionButton onPress={() => setIsEditing(true)}>
              <Edit />
              <Text>Edit</Text>
            </ActionButton>
            <ActionButton onPress={deleteProfile}>
              <Delete /> <Text>Delete</Text>
            </ActionButton>
          </ButtonGroup>
        </section>
      )}
    </>
  );
}

export default ManageProfile;
