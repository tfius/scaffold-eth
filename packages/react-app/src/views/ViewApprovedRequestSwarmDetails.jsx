import React, { useState } from "react";
import { Card } from "antd";

function ViewApprovedRequestSwarmDetails({ reviewData }) {
  const [details, setDetails] = useState(false);

  return (
    <span>
      {reviewData != null ? (
        <>
          <span onClick={e => setDetails(!details)}>
            {details ? "▲ " : "▼ "}
            <span style={{ textDecoration: "underline", lineHeight: "2rem" }}>Review Details</span>
          </span>

          {details && (
            <small>
              <Card hoverable>
                <strong>Comments:</strong>
                {reviewData.comments} <br />
                <strong>Reviewer Address:</strong>
                {reviewData.ethaddress} <br />
              </Card>
            </small>
          )}
        </>
      ) : null}
    </span>
  );
}

export default ViewApprovedRequestSwarmDetails;
