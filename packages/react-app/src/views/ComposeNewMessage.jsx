import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Tooltip, Typography, Modal, Input, Form, Spin, Progress } from "antd";
import * as Consts from "./consts";
import { uploadJsonToBee, downloadDataFromBee } from "./../Swarm/BeeService";
import * as layouts from "./layouts.js";
import { downloadGateway } from "./../Swarm/BeeService";
import { DropzoneSwarmUpload } from "./../Swarm/DropzoneSwarmUpload";
import { DropzoneReadFileContents } from "./../Swarm/DropzoneReadFileContents";

const { Meta } = Card;
const { Text } = Typography;
class ComposeNewMessageForm extends React.Component {
  formRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      amount: 0,
      hash: null,
      file: null,
      attachments: [],
      recepient: "",
      isInProgress: false,
      progress: 0,
      progresStatus: "Encrypting",
    };
    //console.log("ComposeNewMessageFormFile", props);
  }
  onSend = async values => {
    console.log("onFinish", values);
    var message = values;
    message.attachments = this.state.attachments;
    console.log("message", message);
    this.props.loading(true);

    // const swarmHash = await uploadJsonToBee(values, "post.json");
    // console.log("swarmHash", swarmHash);
    // this.props.onDataSubmitedToBee(swarmHash);
    this.props.loading(null);
    this.setState({ isInProgress: false });
  };

  sendMessage = async (sender, recepient, message) => {
    this.setState({ isInProgress: true });
    this.setState({ progress: 0, progresStatus: "Packing" });
    // encrypt attachments with recepient public key
    for (var i = 0; i < message.attachments.length; i++) {
      var attachment = message.attachments[i];
      var encAttachment = await encryptMessage(attachment, recepient);
    }

    this.setState({ progress: 0, progresStatus: "Encrypting" });
    // encrypt message with recepient public key
    const encryptedMessage = await encryptMessage(message, recepient);
    this.setState({ progress: 0, progresStatus: "Sending" });
  };

  onRecepientChange = async name => {
    this.setState({ recepient: name });
  };

  onFileUploaded = async (hash, file) => {
    console.log("file uploaded", hash, file);
    this.setState({ hash: hash });
    this.setState({ file: file });
  };

  onAddFile = async (file, binaryData) => {
    var newFile = { file, binaryData: binaryData, hash: Consts.emptyHash };
    this.setState({ attachments: [...this.state.attachments, newFile] });
  };
  removeAttachment = async attachment => {
    this.setState({ attachments: this.state.attachments.filter(a => a !== attachment) });
  };

  render() {
    var total = this.state.attachments.reduce((a, b) => a + b.file.size, 0);
    var percent = (total / (5 * 1024 * 1024)) * 100;
    //console.log("ComposeNewMessageForm", this.props, this.state.attachments);
    //console.log("ComposeNewMessageForm", this.state.attachments);
    const required = [{ required: true }];
    // debugger;
    // if (this.props.address == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        {this.state.isInProgress === true && (
          <>
            {this.state.progresStatus}
            <Progress percent={this.state.progress} size="small" status="active" />
          </>
        )}
        {this.state.isInProgress === false && (
          <>
            <Form
              {...layouts.layout}
              ref={this.formRef}
              // name="control-ref"
              onFinish={this.onSend}
              name="composeNewMessage"
              fields={[
                {
                  name: ["ethaddress"],
                  value: this.props.address,
                },
              ]}
            >
              <Form.Item name="ethaddress" label="Sender">
                <Input disabled />
              </Form.Item>
              <Form.Item name="recipient" label="Recipient" rules={required}>
                <Input
                  placeholder="0x or ENS"
                  value={this.state.recepient}
                  onChange={e => this.onRecepientChange(e.target.value)}
                />
              </Form.Item>
              <Form.Item name="subject" label="Subject" rules={required}>
                <Input />
              </Form.Item>
              <Form.Item name="contents" label="Content">
                <Input.TextArea maxLength={4096} rows={10} autosize={{ minRows: "10", maxRows: "20" }} />
              </Form.Item>
              <DropzoneReadFileContents onAddFile={this.onAddFile} refObj={this} />
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "80%", borderRadius: "25px", alignItems: "center", left: "10%" }}
              >
                Send
              </Button>
            </Form>
            <div>
              <br />
              {this.state.attachments.length > 0 ? (
                <div style={{ textAlign: "center", width: "100%" }}>
                  Usage: <strong>{Math.round(percent)}%</strong>&nbsp;Total size:&nbsp;
                  <strong>{layouts.bytesToSize(total)}</strong>&nbsp;Attachments:&nbsp;
                  <strong>{this.state.attachments.length}</strong> <br /> <br />
                </div>
              ) : (
                <div style={{ textAlign: "center", width: "100%" }}>No attachments</div>
              )}

              {this.state.attachments.map(attachment => {
                return (
                  <span key={attachment.file.name + "_ff"}>
                    <span style={{ cursor: "pointer" }} onClick={() => this.removeAttachment(attachment)}>
                      ×
                    </span>
                    &nbsp;
                    <span>
                      {attachment.file.name} {layouts.bytesToSize(attachment.file.size)}
                    </span>{" "}
                    <br />
                  </span>
                );
              })}
              <br />
            </div>
          </>
        )}
      </>
    );
  }
}

export function ComposeNewMessage({ writeContracts, address, modalControl }) {
  const [loading, setLoading] = useState(false);
  //   const [modalRequestDataSwarm, setModalRequestDataSwarm] = useState(null);
  //   const [modal, _setModal] = useState(null);
  //   const [requestData, setRequestData] = useState(null);
  //   const [reviewSubmittedHash, setReviewSubmittedHash] = useState(null);

  const onSend = async (item, i, hash) => {
    // console.log("Sending approve", item.candidate);
    // var rr = reviewsRequestList;
    // rr = rr.slice(i, 1);
    // setReviewsRequestList(rr);
    // await tx(
    //   writeContracts.COPRequestReviewRegistry.approveReview(
    //     item.candidate,
    //     "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
    //   ),
    // );
  };
  const onReject = async (item, i, hash) => {
    // console.log("Sending reject", item.candidate);
    // await tx(
    //   writeContracts.COPRequestReviewRegistry.rejectReview(
    //     item.candidate,
    //     "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
    //   ),
    // );
  };

  //   const setModal = async (modal, index) => {
  //     if (modal == null) {
  //       _setModal(null);
  //       return;
  //     }

  //     // var data = await downloadDataFromBee(modal.requestorDataHash);
  //     // data.itemIndex = index;
  //     // setModalRequestDataSwarm(data);
  //     // console.log("setModalData", modal.requestorDataHash, data);
  //     // _setModal(modal);
  //   };

  const onSendSubmitDataToBee = async approvedSwarmHash => {
    setLoading(true);
    //var data = modalRequestDataSwarm;
    //data.reviewerDataHash = approvedSwarmHash;
    //setModalRequestDataSwarm(data);
    setLoading(null);
    //setReviewSubmittedHash(approvedSwarmHash);
  };

  return (
    <>
      {/* {loading && <Spin />} */}
      <Modal
        style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
        title={<h3>New Message {loading && <Spin />} </h3>}
        footer={null}
        visible={true}
        maskClosable={false}
        onOk={() => {
          //setModal(null);
        }}
        onCancel={() => {
          modalControl(false);
        }}
      >
        <ComposeNewMessageForm
          // onFinish={onApprove}
          // modal={modal}
          //   index={modalRequestDataSwarm.itemIndex}
          address={address}
          onDataSubmitedToBee={onSendSubmitDataToBee}
          loading={setLoading}
        />
      </Modal>
    </>
  );
}

export default ComposeNewMessage;
