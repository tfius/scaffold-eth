import { PageHeader } from "antd";
import React from "react";
import * as helpers from "./../parts/helpers";
// displays a page header

export default function Header() {
  return (
    <PageHeader
      title={<a href="https://fairdatasociety.org" target="_blank" rel="noopener noreferrer">🃏 FDS</a>}
      subTitle={<span onClick={()=>helpers.speak("Resistance")}>Resistance is never futile</span>}
      style={{ cursor: "pointer" }}
    />
  );
}
