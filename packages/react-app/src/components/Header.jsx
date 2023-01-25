import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://mail.fairdatasociety.org" target="_blank" rel="noopener noreferrer">
      <PageHeader title="SwarmMail" subTitle="" style={{ cursor: "pointer" }} />
    </a>
  );
}
