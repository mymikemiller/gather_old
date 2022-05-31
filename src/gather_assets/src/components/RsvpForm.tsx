import * as React from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import {
  Gathering
} from "../../../declarations/gather/gather.did";

function RsvpForm() {
  const { gatheringId } = useParams();

  return (
    <>
      <h1>GatheringId: {gatheringId}</h1>
    </>
  );
}

export default RsvpForm;
