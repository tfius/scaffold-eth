import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Tooltip, Typography, Modal, Input, Form, Spin, Progress } from "antd";
import * as Consts from "./consts";
import { uploadJsonToBee, downloadDataFromBee } from "./../Swarm/BeeService";
import * as layouts from "./layouts.js";

import { ethers } from "ethers";
import { downloadGateway } from "./../Swarm/BeeService";
import { DropzoneSwarmUpload } from "./../Swarm/DropzoneSwarmUpload";
import { DropzoneReadFileContents } from "./../Swarm/DropzoneReadFileContents";
import { deriveDriveKey, deriveFileKey, fileDecrypt, fileEncrypt } from "./../utils/w3crypto";

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
  onSend = async message => {
    console.log("onFinish", message);
    //var message = values;
    //message.attachments = this.state.attachments;
    //console.log("message", message);
    this.props.loading(true);

    await this.props.onSendMessage(this.state.address, message.recipient, message, this.state.attachments);

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

    this.setState({ progress: 0, progresStatus: "Encrypting" }); // encrypt message with recepient public key
    const encryptedMessage = await encryptMessage(message, recepient);
    this.setState({ progress: 0, progresStatus: "Sending" });
  };

  onRecepientChange = async name => {
    this.setState({ recepient: name });
    this.props.onRetrieveRecipientPubKey(name, false);
  };

  onFileUploaded = async (hash, file) => {
    console.log("file uploaded", hash, file);
    this.setState({ hash: hash });
    this.setState({ file: file });
  };

  addAttachment = async (file, binaryData) => {
    var newFile = { file, binaryData: binaryData, hash: Consts.emptyHash };
    this.setState({ attachments: [...this.state.attachments, newFile] });
  };
  removeAttachment = async attachment => {
    this.setState({ attachments: this.state.attachments.filter(a => a !== attachment) });
  };

  render() {
    var total = this.state.attachments.reduce((a, b) => a + b.file.size, 0);
    var percent = (total / (5 * 1024 * 1024)) * 100;
    const required = [{ required: true }];

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
              <DropzoneReadFileContents onAddFile={this.addAttachment} refObj={this} />
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

export function ComposeNewMessage({ readContracts, writeContracts, address, modalControl }) {
  const [loading, setLoading] = useState(false);
  const [senderPubKey, setSenderPubKey] = useState(false);
  const [receiverPubKey, setReceiverPubKey] = useState(false);
  const onSendSubmitDataToBee = async approvedSwarmHash => {
    setLoading(true);
    //var data = modalRequestDataSwarm;
    //data.reviewerDataHash = approvedSwarmHash;
    //setModalRequestDataSwarm(data);
    setLoading(null);
    //setReviewSubmittedHash(approvedSwarmHash);
  };

  const retrievePubKey = async (forAddress, isSender = false) => {
    try {
      const data = await readContracts.SwarmMail.getPublicKeys(address); // useContractReader(readContracts, "SwarmMail", "isAddressRegistered", [address]);
      if (isSender) setSenderPubKey({ x: data.x, y: data.y });
      else setReceiverPubKey({ x: data.x, y: data.y });

      console.log(isSender ? "sender" : "receiver", isSender, data);
      return data;
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  const onSendMessage = async (senderAddress, recipientAddress, message, attachements) => {
    let senderPubKey = await retrievePubKey(senderAddress, true); // get sender public key
    let receiverPubKey = await retrievePubKey(recipientAddress, false); // get receiver public key

    debugger;
    let emailUuid = uuidv4();
    console.log("emailUuid", emailUuid);

    const emailKey = await deriveFileKey(driveKey, emailUuid);
    // encrypt email key by receive user public key
    const encryptSendKey = encryptEmailKey(senderPublicKey, Buffer.from(emailKey, "base64"));
    const encryptReceiveKey = encryptEmailKey(receiverPubKey, Buffer.from(emailKey, "base64"));

    for (var i = 0; i < message.attachments.length; i++) {
      var attachment = message.attachments[i];
      var encAttachment = await encryptMessage(attachment, recepient);
    }

    // const swarmHash = await uploadJsonToBee(values, "post.json");
    // console.log("swarmHash", swarmHash);
    // this.props.onDataSubmitedToBee(swarmHash);
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
          onRetrieveRecipientPubKey={retrievePubKey}
          onSendMessage={onSendMessage}
        />
      </Modal>
    </>
  );
}

export default ComposeNewMessage;
