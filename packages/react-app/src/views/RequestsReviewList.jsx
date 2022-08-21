import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Tooltip, Typography, Modal, Input, Form, Spin } from "antd";
import * as Consts from "./consts";
import { uploadJsonToBee, downloadDataFromBee } from "./../Swarm/BeeService";
import * as layouts from "./layouts.js";
import ViewReviewRequestChainDetails from "./ViewReviewRequestChainDetails";
import ViewReviewRequestSwarmDetails from "./ViewReviewRequestSwarmDetails";

const { Meta } = Card;
const { Text } = Typography;
export class FormGatherApprovalInformation extends React.Component {
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

function RequestsReviewList({ items, onApprove, onReject, address }) {
  const [loading, setLoading] = useState(null);
  const [modal, _setModal] = useState(null);
  const [modalRequestDataSwarm, setModalRequestDataSwarm] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [reviewSubmittedHash, setReviewSubmittedHash] = useState(null);

  const setModal = async (modal, index) => {
    if (modal == null) {
      _setModal(null);
      return;
    }

    var data = await downloadDataFromBee(modal.requestorDataHash);
    data.itemIndex = index;
    setModalRequestDataSwarm(data);
    console.log("setModalData", modal.requestorDataHash, data);
    _setModal(modal);
  };

  useEffect(
    async items => {
      setRequestData(items);
    },
    [items],
  );

  const onApproveSubmitDataToBee = async approvedSwarmHash => {
    setLoading(true);
    var data = modalRequestDataSwarm;
    data.reviewerDataHash = approvedSwarmHash;
    setModalRequestDataSwarm(data);
    setLoading(null);
    setReviewSubmittedHash(approvedSwarmHash);
  };

  console.log("items to be approved", items);

  return (
    <>
      {loading && <Spin />}
      {items.map((item, i) => (
        <Card hoverable style={{ marginBottom: "5px", marginTop: "3px", width: "100%" }} key={"revreq_" + i}>
          <small>{Consts.RequestReviewDescriptions[item.state.toNumber()].text}</small>
          <br />
          {item.reviewedTime.toNumber() == 0 ? (
            <Text>
              Waiting for review
              <br />
            </Text>
          ) : null}

          {new Date(item.startTime.toNumber()).toUTCString()}
          <br />
          <Tooltip placement="topLeft" title={item.candidate} arrowPointAtCenter>
            <Text strong>Candidate #{i + 1}</Text>
          </Tooltip>
          <br />
          {/* {item.endTime.toNumber() != 0 ? (
             <>new Date(item.endTime.toNumber()).toUTCString()}</>
          ) : (
            <Text>In progress</Text>
          )} */}

          {/* user needs to update this request review   */}
          {item.state.toNumber() == 3 ? (
            <>
              Approver Rejected <br />{" "}
            </>
          ) : null}
          {/* user and approver nees to update this request */}
          {item.state.toNumber() == 4 ? (
            <>
              Finalization Rejected <br />
              <Card.Meta
                description={
                  <>
                    <Button
                      onClick={e => {
                        onApprove(item, i);
                      }}
                    >
                      Approve
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
          ) : null}
          <br />
          {item.state.toNumber() == 0 ? (
            <>
              <Tooltip placement="topLeft" title={item.requestorDataHash} arrowPointAtCenter>
                <Text strong underline onClick={() => setModal(item, i)}>
                  {"View Application"}
                </Text>
                <br />
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip placement="topLeft" title={item.reviewer} arrowPointAtCenter>
                <Text strong>{"Reviewed"}</Text>
                <Text> on {new Date(item.reviewedTime.toNumber()).toUTCString()}</Text>
              </Tooltip>
              <Tooltip placement="topLeft" title={item.reviewerDataHash} arrowPointAtCenter>
                <Text strong> ⓘ</Text>
              </Tooltip>
              <br />

              <Tooltip placement="topLeft" title={item.requestor} arrowPointAtCenter>
                <Text strong>{"View Request Data"}</Text>
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
          title={<h2>View Request Review Application</h2>}
          visible={modal != null}
          footer={null}
          onOk={() => {
            //setModal(null);
          }}
          onCancel={() => {
            setModal(null, 0);
          }}
        >
          {modalRequestDataSwarm != null && (
            <>
              <ViewReviewRequestSwarmDetails reviewRequestSwarmData={modalRequestDataSwarm} />
              {items != undefined && items.length > 0 ? (
                <ViewReviewRequestChainDetails reviewRequest={items[0]} />
              ) : null}
              <FormGatherApprovalInformation
                // onFinish={onApprove}
                modal={modal}
                index={modalRequestDataSwarm.itemIndex}
                address={address}
                onDataSubmitedToBee={onApproveSubmitDataToBee}
                loading={setLoading}
              />
            </>
          )}

          <Card.Meta
            description={
              <>
                {reviewSubmittedHash != null && (
                  <>
                    <small>
                      Your review was stored at {reviewSubmittedHash} <br />{" "}
                    </small>
                    <Button
                      onClick={e => {
                        onApprove(modal, modalRequestDataSwarm.itemIndex, reviewSubmittedHash);
                        setModal(null, 0);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={e => {
                        onReject(modal, modalRequestDataSwarm.itemIndex, reviewSubmittedHash);
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
                    setReviewSubmittedHash(null);
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

export default RequestsReviewList;
