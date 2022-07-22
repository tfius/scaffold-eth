import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { ethers } from "ethers";

import { useDropzone } from "react-dropzone";
import { FormGatherPersonalInformation } from "./FormGatherPersonalInformation";
import { downloadDataFromBee } from "./../Swarm/BeeService";

import { Button, Card, Row, Col, Spin, Tooltip } from "antd";
const { Meta } = Card;

import * as Consts from "./consts";

function InReview({ reviewCount }) {
  return (
    <Card title="In Review">
      <Card.Meta
        title="Your request is in processing"
        description="Please wait until your request is reviewed. This can take days."
      />

      <br />

      <Card.Meta title={"Reviews in queue:" + reviewCount} description="" />
    </Card>
  );
}
function Reviewed({ writeContracts, readContracts, address, tx, localProvider }) {
  return (
    <Card title="Reviewed">
      <Card.Meta
        title="Your request was processed successfully"
        description="Waiting for validators to process your request and issue you tokens"
      />
    </Card>
  );
}

function Requests({ writeContracts, readContracts, address, tx, localProvider }) {
  const contractName = "COPRequestReviewRegistry";
  const [loading, setLoading] = useState(false);

  const [requestState, setRequestState] = useState();
  const [requestInfo, setRequestInfo] = useState();
  const [rejectionDataList, setRejectionDataList] = useState([]);

  const isReviewed = useContractReader(readContracts, contractName, "isAddressReviewed", [address]);
  const isInReview = useContractReader(readContracts, contractName, "isInReview", [address]);
  const isFinalized = useContractReader(readContracts, contractName, "isInFinalization", [address]);
  // const reviewRequestCount = useContractReader(readContracts, contractName, "getReviewRequestsCount");
  const reviewRequest = useContractReader(readContracts, contractName, "getReviewRequest", [address]);
  const rejectionsHashes = useContractReader(readContracts, contractName, "getRejectionReasons", [address]);

  useEffect(() => {
    console.log("inReview", isInReview, "Reviewed", isReviewed, "Finalized", isFinalized);
  }, [isInReview, isReviewed, isFinalized]);

  useEffect(() => {
    if (reviewRequest == undefined) return;
    var stateDesc = "";
    var stateInfo = "";
    // // 0 request, 1 approved, 2 finalized, 3 approver rejected, 3 finalization rejected
    switch (reviewRequest.state.toNumber()) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      default:
        stateDesc = "Unknown";
        stateInfo = "There seems to be a problem with your request";
        break;
    }
    stateDesc = Consts.RequestReviewDescriptions[reviewRequest.state.toNumber()].text;
    stateInfo = Consts.RequestReviewDescriptions[reviewRequest.state.toNumber()].description;

    setRequestState(stateDesc);
    setRequestInfo(stateInfo);
    console.log("reviewRequest", reviewRequest);
  }, [reviewRequest]);

  const onPersonalInformationEntered = async swarmHashOfJson => {
    setLoading(true);
    console.log("Sending tx");
    await tx(
      writeContracts.COPRequestReviewRegistry.requestReview(
        address,
        "0x" + swarmHashOfJson, //"0x0000000000000000000000000000000000000000000000000000000000000000",
      ),
    );
    setLoading(false);
  };

  const revokeReviewedAddress = async swarmHashOfJson => {
    setLoading(true);
    console.log("Sending tx");
    await tx(writeContracts.COPRequestReviewRegistry.revokeReviewedAddress(address));
    setLoading(false);
  };

  const updateRejectionReasons = useCallback(async () => {
    //if (rejectionsHashes == undefined) return;
    var list = [];
    setLoading(true);

    console.log("updateRejectionReasons", rejectionsHashes);

    for (var i = 0; i < rejectionsHashes.length; i++) {
      try {
        var rejectionData = await downloadDataFromBee(rejectionsHashes[i]);
        list.push(rejectionData);
      } catch (e) {
        console.error(e);
      }
    }
    setRejectionDataList(list);
    console.log("updateRejectionReasons List", list);
    setLoading(false);
  });

  useEffect(() => {
    updateRejectionReasons();
  }, [rejectionsHashes]);

  const gather = isReviewed == false && isInReview == false && isFinalized == false; // no request yet
  const inReview = isReviewed == false && isInReview == true && isFinalized == false; // in review, waiting for update/reject
  const finalized = isReviewed == false && isInReview == false && isFinalized == true; //  in finalization waiting for completition
  const reviewed = isReviewed == true && isInReview == false && isFinalized == false; // address has been reviewed and is ready for issuance
  const waitingForFinalization = isReviewed == false && isInReview == true && isFinalized == true; //  in finalization waiting for completition

  // if(isInReview) setProgressState(1);

  return (
    <div style={{ margin: "auto", width: "90vw" }}>
      {loading ? <Spin /> : null}
      <>
        {gather ? <FormGatherPersonalInformation address={address} onSubmit={onPersonalInformationEntered} /> : null}
        {/* display request status only if request was sent    */}
        {!gather && reviewRequest != undefined ? (
          <>
            <Card title="Your Review Request State">
              <h2>
                Status:&nbsp; {Consts.RequestReviewDescriptions[reviewRequest.state.toNumber()].text} <br />
              </h2>
              {inReview ? "In Waiting For Review Queue" : null}
              {finalized ? "In Finalization Queue" : null}
              {waitingForFinalization ? "Waiting for finalization" : null}
              {reviewed ? "Reviewed and ready for Issuance process" : null}

              <br />
              <br />
              <Card.Meta title={requestState} description={requestInfo} />
              <br />

              {reviewed ? (
                <>
                  <Card.Meta
                    title="Revoke Your Request"
                    description={
                      <>
                        Additionally you can revoke your address from Request Registry and start new process
                        <Button
                          onClick={e => {
                            revokeReviewedAddress(address);
                          }}
                        >
                          Revoke
                        </Button>
                      </>
                    }
                  />
                </>
              ) : null}
            </Card>
          </>
        ) : null}
        <Card title="Rejections">
          {rejectionDataList.map((rejectionItem, index) => (
            <Card.Meta
              key={index}
              description={
                <>
                  <Tooltip title={"Reviewed by: " + rejectionItem.ethaddress}>
                    <>
                      {index}: {rejectionItem.comments}
                    </>
                  </Tooltip>
                </>
              }
            ></Card.Meta>
          ))}
        </Card>
        {/* <Card.Meta title={"Reviews in queue:" + reviewCount} description="" /> */}

        {/*
          {inReview ? <InReview reviewCount={reviewCount.toNumber()}/> : null }
          {finalized ? <Card title="Finalized"/> : null }
          {reviewed ? <Card title="Reviewed"/> : null }
          {waitingForFinalization ? <Card title="Waiting for finalization"/> : null } */}
        {/* <Card hoverable title="Requests"> */}
        {/* </Card.Meta> */}
        {/* <Card.Meta title="Meta Title" description="Meta description" /> */}
        {/* </Card> */}
      </>
    </div>
  );
}

export default Requests;
