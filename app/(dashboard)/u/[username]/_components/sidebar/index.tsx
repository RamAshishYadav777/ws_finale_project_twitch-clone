import React from "react";

import { Wrapper } from "./wrapper";
import { Toggle } from "./toggle";
import { Navigation } from "./navigation";

export function Sidebar({ totalDonations }: { totalDonations: number }) {
  console.log("SIDEBAR RENDERED");
  return (
    <Wrapper>
      <Toggle />
      <Navigation totalDonations={totalDonations} />
    </Wrapper>
  );
}
