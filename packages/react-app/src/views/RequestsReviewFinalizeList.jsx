import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import Blockies from "react-blockies";
import { ethers } from "ethers";
import { Button, Card, Tooltip, Typography } from "antd";
import * as Consts from "./consts";

const { Meta } = Card;
const { Text } = Typography;

function RequestsReviewFinalizeList({ items, onFinalize, onReject }) {
  useEffect(() => {}, [items]);
  console.log("items", items);
  return (
    <>
      {items.map((item, i) => (
        <Card hoverable style={{ marginBottom: "3px", marginTop: "3px", width: "100%" }} key={"revreq_" + i}>
          <small>{Consts.RequestReviewDescriptions[item.state.toNumber()].text}</small>
          <br />

          {/* {item.endTime.toNumber() == 0 ? <Text>Awaiting finalization<br/></Text> : null} */}

          {new Date(item.startTime.toNumber()).toUTCString()}
          <br />
          <Tooltip placement="topLeft" title={item.candidate} arrowPointAtCenter>
            <Text strong>Candidate #{i + 1}</Text>
          </Tooltip>

          <br />
          <br />
          {item.state.toNumber() == 1 ? ( // item.finalizer == "0x0000000000000000000000000000000000000000" ? (
            <>
              <Tooltip placement="topLeft" title={item.requestorDataHash} arrowPointAtCenter>
                <Text strong underline>
                  {"View Request Data"}
                </Text>
              </Tooltip>
              <br />
              <Tooltip placement="topLeft" title={item.reviewer} arrowPointAtCenter>
                <Text strong>{"Reviewed"}</Text>
                <Text> on {new Date(item.reviewedTime.toNumber()).toUTCString()}</Text>
              </Tooltip>
              <Tooltip placement="topLeft" title={item.reviewerDataHash} arrowPointAtCenter>
                <Text strong> ⓘ</Text>
              </Tooltip>
              <br />

              <Tooltip placement="topLeft" title={item.reviewerDataHash} arrowPointAtCenter>
                <Text strong underline>
                  {"View Reviewer Information"} <br />
                </Text>
              </Tooltip>
              <br />

              <Card.Meta
                description={
                  <>
                    <Button
                      onClick={e => {
                        onFinalize(item, i);
                      }}
                    >
                      Finalize
                    </Button>

                    <Button
                      onClick={e => {
                        onReject(item, i);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                }
              />
            </>
          ) : (
            <>
              <Tooltip placement="topLeft" title={item.requestor} arrowPointAtCenter>
                <Text strong>{"Requested"}</Text>
              </Tooltip>
              <Tooltip placement="topLeft" title={item.requestorDataHash} arrowPointAtCenter>
                <Text strong> ⓘ</Text>
              </Tooltip>
            </>
          )}
        </Card>
      ))}
    </>
  );
}

export default RequestsReviewFinalizeList;
