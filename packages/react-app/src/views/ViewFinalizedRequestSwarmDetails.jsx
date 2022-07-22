import React, { useState } from "react";
import { Card } from "antd";

function ViewFinalizedRequestSwarmDetails({ finalizerData }) {
  const [details, setDetails] = useState(false);

  return (
    <span>
      {finalizerData != null ? (
        <>
          <span onClick={e => setDetails(!details)}>
            {details ? "▲ " : "▼ "}
            <span style={{ textDecoration: "underline", lineHeight: "2rem" }}>Finalized Details</span>
          </span>

          {details && (
            <small>
              <Card hoverable>
                <strong>Comments:</strong>
                {finalizerData.comments} <br />
                <strong>Finalizer Address:</strong>
                {finalizerData.ethaddress} <br />
              </Card>
            </small>
          )}
        </>
      ) : null}
    </span>
  );
}

export default ViewFinalizedRequestSwarmDetails;
