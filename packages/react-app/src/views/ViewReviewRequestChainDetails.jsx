import React, { useState } from "react";
import { Card } from "antd";
/* display reviewRequest on chain data in simple form */
function ViewReviewRequestChainDetails({ reviewRequest }) {
  const [details, setDetails] = useState(false);
  //console.log("reviewRequest", reviewRequest);
  return (
    <span>
      <span onClick={e => setDetails(!details)}>
        {details ? "▲ " : "▼ "}
        <span style={{ textDecoration: "underline" }}>On-Chain data details</span>
      </span>

      {details && (
        <small>
          <Card hoverable>
            Candidate: {reviewRequest.candidate}
            <br />
            StartTime:
            {new Date(reviewRequest.startTime.toNumber() * 1000).toUTCString()}
            <br />
            Requestor: {reviewRequest.requestor}
            <br />
            Requestor Data Hash: {reviewRequest.requestorDataHash}
            <br />
            Reviewer : {reviewRequest.reviewer}
            <br />
            Reviewer Data Hash: {reviewRequest.reviewerDataHash}
            <br />
            Reviewed Time:
            {new Date(reviewRequest.reviewedTime.toNumber() * 1000).toUTCString()}
            <br />
            Finalizer: {reviewRequest.finalizer}
            <br />
            Finalizer Data Hash: {reviewRequest.finalizerDataHash}
            <br />
            End Time :{new Date(reviewRequest.endTime.toNumber() * 1000).toUTCString()}
            <br />
          </Card>
        </small>
      )}
    </span>
  );
}

export default ViewReviewRequestChainDetails;
