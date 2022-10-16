import * as React from "react";
import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { AppContext } from "../App";
import toast from "react-hot-toast";
import {
  User,
  Profile,
  Rsvp,
  RsvpResult,
  _SERVICE,
  Result,
} from "../../../declarations/gather/gather.did";
import { Actor, ActorSubclass } from "@dfinity/agent";
import {
  ActionButton,
  Checkbox,
  Form,
  Heading,
  TextArea,
  TextField,
} from "@adobe/react-spectrum";
interface Props {
  user: User;
  actor?: ActorSubclass<_SERVICE>;
}
import { emptyProfile } from "../hooks";
import {
  Gathering,
  GatheringInfo
} from "../../../declarations/gather/gather.did";
import { AgentError } from "@dfinity/agent/lib/cjs/errors";
import { Section, FormContainer, Title, Label, Input, GrowableInput, LargeButton, LargeBorder, LargeBorderWrap, ValidationError } from "./styles/styles";

const RsvpForm = (props: Props) => {
  const params = useParams();
  const gatheringId = BigInt(params.gatheringId);
  const [user, setUser] = useState(props.user);
  const [rsvp, setRsvp] = useState(null);
  const [gatheringInfo, setGatheringInfo] = useState(null);
  const { actor } = useContext(AppContext);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Rsvp>();//{ defaultValues });

  useEffect(() => {
    if (actor) {
      (async () => {
        const gatheringInfoResult = await actor.getGathering(gatheringId);
        console.log("gatheringInfoResult:");
        console.dir(gatheringInfoResult);
        if (gatheringInfoResult.length == 1) {
          setGatheringInfo(gatheringInfoResult[0].info);
          console.log("gatheringInfo for gathering " + gatheringId);
          console.dir(gatheringInfo);
        } else {
          console.error("Failed to fetch gathering " + gatheringId);
        }
      })();
    }
  }, []);

  // const handleChange = (key: string, value: string) => {
  //   const _rsvp = { ...rsvp }; // or maybe like this: Object.assign({}, this.state.profile);
  //   _rsvp[key] = value;
  //   setRsvp(_rsvp);
  //   // const newState: any = { user };
  //   // newState.profile.bio[key] = value ? [value] : [];
  //   // this.setState(newState);
  // }

  // const handleSubmit = () => {
  //   actor.rsvp(rsvp, gatheringId);
  //   // const { name } = this.state.profile.bio;
  //   // const newProfile = Object.assign({}, this.state.profile);
  //   // newProfile.bio.name = name;

  //   // this.props.submitCallback(newProfile);
  // }


  const onSubmit = (rsvp: Rsvp): void => {
    // Handle update async
    actor!.rsvp(rsvp, gatheringId).then(async (result: RsvpResult) => {
      if ("ok" in result) {
        toast.success("RSVP!");
        //navigate('/putEpisode?feedKey=' + data.key, { state: { feedKey: data.key, feed } })
        // return result.ok;
      } else {
        if ("UserNotFound" in result.err) {
          toast.error("User not found. You must create an account before submitting an RSVP.");
        } else if ("GatheringNotFound" in result.err) {
          toast.error("Gathering " + gatheringId + " not found.");
        } else if ("NotAuthorized" in result.err) {
          toast.error("Not authorized. Please log in before submitting an RSVP.");
        } else {
          toast.error("Error submitting RSVP.");
        };
        console.error(result.err);
        return;
      };
    });
  };

  return (
    <FormContainer>
      <Title>RSVP</Title>
      <form onSubmit={handleSubmit(onSubmit)}>

        <Label>
          Attending:
          <Input
            type='checkbox'
            {...register("attending", {
              required: "Response for \"Attending\" is required",
            })}
          />
          {/* <ValidationError>{errors.key?.message}</ValidationError> */}
        </Label>

        <LargeBorderWrap>
          <LargeBorder>
            <LargeButton type="submit" />
          </LargeBorder>
        </LargeBorderWrap>
      </form>
    </FormContainer>
  );
};

export default RsvpForm;





// class ProfileForm extends React.Component<Props> {
//   state = { profile: emptyProfile };

//   formRef = React.createRef();

//   constructor(props: Props) {
//     super(props);
//   }


//   render() {
//     const { name } =
//       this.state.profile.bio;

//     const handleChange = this.handleChange.bind(this);
//     const handleSubmit = this.handleSubmit.bind(this);
//     return (
//       <section>
//         <Heading level={1}>Create a Profile</Heading>
//         <Form
//           onSubmit={(e) => {
//             e.preventDefault();
//             handleSubmit();
//           }}
//         >
//           <TextField
//             label="Name"
//             name="name"
//             value={name[0] || ""}
//             onChange={(value) => handleChange("name", value)}
//           />
//           <ActionButton type="submit">Submit</ActionButton>
//         </Form>
//       </section>
//     );
//   }
// }

// export default ProfileForm;
