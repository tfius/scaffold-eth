import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://coo2.org" target="_blank" rel="noopener noreferrer">
      <PageHeader title="COO2" subTitle="Voluntary Carbon Offset DAO" style={{ cursor: "pointer" }} />
    </a>
  );
}
