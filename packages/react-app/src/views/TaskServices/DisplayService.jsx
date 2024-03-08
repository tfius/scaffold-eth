import React, { useState } from "react";
import { Button } from "antd";

export function DisplayService({ service }) {
  const [seeDetail, setSeeDetail] = useState(false);
  return (
    <div style={{ marginLeft: "2%" }}>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <p>Cost: {service.cost}</p>
      <Button onClick={() => setSeeDetail(!seeDetail)}>Details</Button>
      {seeDetail && (
        <div style={{ lineHeight: "0.5" }}>
          <p> </p>
          <p>Input: {service.input}</p>

          <p>Example: {service.example}</p>
          <p>Example Form: {service.example_form}</p>
          <p>Model: {service.model}</p>
          <p>Model Author: {service.model_author}</p>
          <p>Model Version: {service.model_version}</p>
          <p>Model License: {service.model_license}</p>
          <p>Method: {service.method}</p>
          <p>Endpoint: {service.endpoint}</p>
          <p>Response: {service.response}</p>
          <p>Output: {service.output}</p>
          <p>Output File Type: {service.output_file_type}</p>
          <p>Format: {service.format}</p>
          <p>Subtype: {service.subtype}</p>
          <p>URL: {service.url}</p>
          <p>Version: {service.version}</p>
          <p>Service Author: {service.service_author}</p>
        </div>
      )}
    </div>
  );
}
