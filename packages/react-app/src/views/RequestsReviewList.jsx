import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Tooltip, Typography, Modal, Input, Form } from "antd";
import * as Consts from "./consts";
import { downloadDataFromBee } from "./../Swarm/BeeService";

const { Meta } = Card;
const { Text } = Typography;

const layout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 15,
  },
};

export class FormGatherApprovalInformation extends React.Component {
  formRef = React.createRef();

  onFinish = async values => {
    console.log("onFinish", values);
    // const swarmHash = await uploadJsonToBee(values, "post.json");
    // console.log("swarmHash", swarmHash);
    // this.props.onSubmit(swarmHash);
  };

  render() {
    const required = [{ required: true }];
    console.log(this.props);

    if (this.props.address == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <hr />
        <Form
          {...layout}
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
        </Form>
      </>
    );
  }
}

function RequestsReviewList({ items, onApprove, onReject, address }) {
  const [modal, _setModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [requestData, setRequestData] = useState(null);

  const setModal = async (modal, index) => {
    if (modal == null) {
      _setModal(null);
      return;
    }

    var data = await downloadDataFromBee(modal.requestorDataHash);
    data.itemIndex = index;
    setModalData(data);
    console.log("setModalData", modal.requestorDataHash, data);
    _setModal(modal);
  };

  useEffect(
    async items => {
      setRequestData(items);
    },
    [items],
  );

  console.log("items", items);

  return (
    <>
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
              {/* <br />
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
              /> */}
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

      <Modal
        title={<h2>View Application</h2>}
        visible={modal != null}
        footer={null}
        onOk={() => {
          //setModal(null);
        }}
        onCancel={() => {
          //setModal(null);
        }}
      >
        {modalData != null ? (
          <>
            <>
              <strong>Name:</strong> {modalData.first} {modalData.last} <br />
              <strong>Organization:</strong> {modalData.organization} <br />
              <strong>Address 1:</strong> {modalData.address1} <br />
              <strong>Address 1:</strong> {modalData.address2} <br />
              <strong>City:</strong> {modalData.city} <br />
              <strong>Country:</strong> {modalData.country} <br />
              <strong>Post Code:</strong>
              {modalData.postcode} <br />
              <strong>Phone:</strong> {modalData.phone} <br />
              <strong>Email:</strong> {modalData.email} <br />
              <strong>Eth Address:</strong> {modalData.ethaddress} <br />
            </>
            <br />
            {items != undefined && items.length > 0 ? (
              <div>
                {items[0].candidate}
                {items[0].startTime.toNumber()}
                {items[0].requestor}
                {items[0].requestorDataHash}
                {items[0].reviewer}
                {items[0].reviewerDataHash}
                {items[0].reviewedTime.toNumber()}
                {items[0].finalizer}
                {items[0].finalizerDataHash}
                {items[0].endTime.toNumber()}
              </div>
            ) : null}
            <FormGatherApprovalInformation
              // onFinish={onApprove}
              modal={modal}
              index={modalData.itemIndex}
              address={address}
            />
          </>
        ) : null}

        <Card.Meta
          description={
            <div>
              <br />
              <Button
                onClick={e => {
                  onApprove(modal, modalData.itemIndex);
                  setModal(null, 0);
                }}
              >
                Approve
              </Button>
              <Button
                onClick={e => {
                  onReject(modal, modalData.itemIndex);
                  setModal(null, 0);
                }}
              >
                Reject
              </Button>

              <Button
                style={{ float: "right" }}
                className="ant-btn-primary"
                onClick={e => {
                  setModal(null, 0);
                }}
              >
                Close
              </Button>
            </div>
          }
        />
      </Modal>
    </>
  );
}

export default RequestsReviewList;
