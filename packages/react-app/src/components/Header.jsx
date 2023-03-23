import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://fairdrive.io/" target="_blank" rel="noopener noreferrer">
      <PageHeader title="Smail" subTitle="" style={{ cursor: "pointer" }} />
    </a>
  );
}
