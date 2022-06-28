import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import {
  User,
  Profile,
  Rsvp,
  _SERVICE,
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
  Gathering
} from "../../../declarations/gather/gather.did";
import { AgentError } from "@dfinity/agent/lib/cjs/errors";

const RsvpForm = (props: Props) => {
  const { _gatheringId } = useParams();
  const gatheringId = BigInt(_gatheringId);
  const [user, setUser] = useState(props.user);
  const [rsvp, setRsvp] = useState(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE>>(props.actor);

  useEffect(() => {
    // if (props.user) {
    //   setState({ user: props.user });
    // }
  }, []);

  const handleChange = (key: string, value: string) => {
    const _rsvp = { ...rsvp }; // or maybe like this: Object.assign({}, this.state.profile);
    _rsvp[key] = value;
    setRsvp(_rsvp);
    // const newState: any = { user };
    // newState.profile.bio[key] = value ? [value] : [];
    // this.setState(newState);
  }

  const handleSubmit = () => {
    actor.rsvp(rsvp, gatheringId);
    // const { name } = this.state.profile.bio;
    // const newProfile = Object.assign({}, this.state.profile);
    // newProfile.bio.name = name;

    // this.props.submitCallback(newProfile);
  }

  return (
    // <>
    //   <h1>GatheringId: {gatheringId}</h1>
    // </>


    <section>
      <Heading level={1}><>GatheringId: {gatheringId}</></Heading>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}>


        <input type="checkbox" id="attending" name="attending" value="attending">
          <label htmlFor="attending">Attending</label>
        </input>

        {/* <TextField
          label="Name"
          name="name"
          value={name[0] || ""}
          onChange={(value) => handleChange("name", value)}
        /> */}
        <ActionButton type="submit">Submit</ActionButton>
      </Form>
    </section>
  );
}

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
