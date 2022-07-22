import React, { useState } from "react";
import { Card } from "antd";

function ViewReviewRequestSwarmDetails({ reviewRequestSwarmData }) {
  const [details, setDetails] = useState(false);

  return (
    <span>
      {reviewRequestSwarmData != null ? (
        <>
          <span onClick={e => setDetails(!details)}>
            {details ? "▲ " : "▼ "}
            <span style={{ textDecoration: "underline", lineHeight: "2rem" }}>Request Details</span>
          </span>

          {details && (
            <small>
              <Card hoverable>
                <strong>Name:</strong>
                {reviewRequestSwarmData.first} {reviewRequestSwarmData.last} <br />
                <strong>Organization:</strong>
                {reviewRequestSwarmData.organization} <br />
                <strong>Address 1:</strong>
                {reviewRequestSwarmData.address1} <br />
                <strong>Address 1:</strong>
                {reviewRequestSwarmData.address2} <br />
                <strong>City:</strong>
                {reviewRequestSwarmData.city} <br />
                <strong>Country:</strong>
                {reviewRequestSwarmData.country} <br />
                <strong>Post Code:</strong>
                {reviewRequestSwarmData.postcode} <br />
                <strong>Phone:</strong>
                {reviewRequestSwarmData.phone} <br />
                <strong>Email:</strong>
                {reviewRequestSwarmData.email} <br />
                <strong>Address:</strong>
                {reviewRequestSwarmData.ethaddress} <br />
              </Card>
            </small>
          )}
        </>
      ) : null}
    </span>
  );
}

export default ViewReviewRequestSwarmDetails;
