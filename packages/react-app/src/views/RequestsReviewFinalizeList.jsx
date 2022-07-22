import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import Blockies from "react-blockies";
import { ethers } from "ethers";
import * as layouts from "./layouts.js";
import { Button, Card, Tooltip, Typography, Spin, Modal, Form, Input } from "antd";
import * as Consts from "./consts";
import { uploadJsonToBee, downloadDataFromBee } from "./../Swarm/BeeService";
import ViewReviewRequestChainDetails from "./ViewReviewRequestChainDetails";
import ViewReviewRequestSwarmDetails from "./ViewReviewRequestSwarmDetails";
import ViewApprovedRequestSwarmDetails from "./ViewApprovedRequestSwarmDetails";

const { Meta } = Card;
const { Text } = Typography;

export class FormGatherFinalizeInformation extends React.Component {
  formRef = React.createRef();

  onFinish = async values => {
    console.log("onFinish", values);
    this.props.loading(true);
    const swarmHash = await uploadJsonToBee(values, "post.json");
    console.log("swarmHash", swarmHash);
    this.props.onDataSubmitedToBee(swarmHash);
    this.props.loading(null);
  };

  //console.log(onSubmit, address);
  render() {
    const required = [{ required: true }];
    if (this.props.address == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherApprovalInfo"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
          <Form.Item name="comments" label="Comments" rules={required}>
            <Input />
          </Form.Item>

          <Form.Item {...layouts.tailLayout}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}

function RequestsReviewFinalizeList({ items, onFinalize, onRejectFinalize, address }) {
  const [loading, setLoading] = useState(null);
  const [modal, _setModal] = useState(null);
  const [modalRequestDataSwarm, setModalRequestDataSwarm] = useState(null);
  const [finalizeSubmittedHash, setFinalizeSubmittedHash] = useState(null);

  useEffect(() => {}, [items]);

  const setModal = async (modal, index) => {
    if (modal == null) {
      _setModal(null);
      return;
    }

    setLoading(true);
    var data = await downloadDataFromBee(modal.requestorDataHash);
    var review = await downloadDataFromBee(modal.reviewerDataHash);

    data.itemIndex = index;
    data.reviewData = review;
    setModalRequestDataSwarm(data);
    console.log("setModalData", modal.requestorDataHash, data);
    _setModal(modal);
    setLoading(null);
  };

  const onFinalizeSubmitDataToBee = async finalizedSwarmHash => {
    setLoading(true);
    var data = modalRequestDataSwarm;
    data.finalizerDataHash = finalizedSwarmHash;
    setModalRequestDataSwarm(data);
    setLoading(null);
    setFinalizeSubmittedHash(finalizedSwarmHash);
  };

  console.log("items to be Finalized", items);

  if (modal != null) console.log("modal index", modalRequestDataSwarm.itemIndex);
  return (
    <>
      {loading && <Spin />}
      {items.map((item, i) => (
        <Card hoverable style={{ marginBottom: "3px", marginTop: "3px", width: "100%" }} key={"revreq_" + i}>
          <small>{Consts.RequestReviewDescriptions[item.state.toNumber()].text}</small>
          <br />
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
                <Text strong underline onClick={() => setModal(item, i)}>
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

      <div>
        <Modal
          title={<h2>Finalize Approved Request</h2>}
          visible={modal != null}
          footer={null}
          onOk={() => {
            //setModal(null);
          }}
          onCancel={() => {
            //setModal(null);
          }}
        >
          {modalRequestDataSwarm != null && (
            <>
              <ViewReviewRequestSwarmDetails reviewRequestSwarmData={modalRequestDataSwarm} />
              {items != undefined && items.length > 0 && modal ? (
                <ViewReviewRequestChainDetails reviewRequest={items[modalRequestDataSwarm.itemIndex]} />
              ) : null}

              <ViewApprovedRequestSwarmDetails reviewData={modalRequestDataSwarm.reviewData} />

              <FormGatherFinalizeInformation
                // onFinish={onApprove}
                modal={modal}
                index={modalRequestDataSwarm.itemIndex}
                address={address}
                onDataSubmitedToBee={onFinalizeSubmitDataToBee}
                loading={setLoading}
              />
            </>
          )}

          <Card.Meta
            description={
              <>
                {finalizeSubmittedHash != null && (
                  <>
                    <small>
                      Your finalization review was stored at {finalizeSubmittedHash} <br />{" "}
                    </small>
                    <Button
                      onClick={e => {
                        onFinalize(modal, modalRequestDataSwarm.itemIndex, finalizeSubmittedHash);
                        setModal(null, 0);
                      }}
                    >
                      Finalize
                    </Button>
                    <Button
                      onClick={e => {
                        onRejectFinalize(modal, modalRequestDataSwarm.itemIndex, finalizeSubmittedHash);
                        setModal(null, 0);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}

                <Button
                  style={{ float: "right" }}
                  className="ant-btn-primary"
                  onClick={e => {
                    setModal(null, 0);
                    setFinalizeSubmittedHash(null);
                  }}
                >
                  Close
                </Button>
              </>
            }
          />
        </Modal>
      </div>
    </>
  );
}

export default RequestsReviewFinalizeList;
