import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Tooltip, Typography, Modal, Input, Form, Spin, Progress } from "antd";
import * as consts from "./consts";
import { uploadJsonToBee, downloadDataFromBee, uploadDataToBee } from "./../Swarm/BeeService";
import * as layouts from "./layouts.js";

import { utils, ethers } from "ethers";

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
    };
  }
  onSend = async message => {
    console.log("onFinish", message);
    this.props.loading(true);
    await this.props.onSendMessage(this.props.address, message.recipient, message, this.state.attachments);
    this.props.loading(null);
    this.setState({ isInProgress: false });
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
    var newFile = { file, binaryData: binaryData, hash: consts.emptyHash };
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
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onSend}
          name="composeNewMessage"
          fields={[
            {
              name: ["sender"],
              value: this.props.address,
            },
          ]}
        >
          <Form.Item name="sender" label="Sender">
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
          <DropzoneReadFileContents refObj={this} onAdd={this.addAttachment} />
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

          {this.state.attachments.map((attachment, i) => {
            return (
              <span key={attachment.file.name + "_ff_" + i}>
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
    );
  }
}

const { v4: uuidv4 } = require("uuid");
const ascii85 = require("ascii85");
import { encrypt } from "@metamask/eth-sig-util";

function joinPublicKey(x, y) {
  return "0x04" + x.substring(2) + y.substring(2);
}
// email send & receive
// publicKey: base64, data: Buffer|string : return Buffer
function encryptEmailKey(publicKey, data) {
  // Returned object contains 4 properties: version, ephemPublicKey, nonce, ciphertext
  // Each contains data encoded using base64, version is always the same string
  const enc = encrypt({
    publicKey: publicKey,
    data: ascii85.encode(data).toString(),
    version: "x25519-xsalsa20-poly1305",
  });
  // We want to store the data in smart contract, therefore we concatenate them
  // into single Buffer
  const buf = Buffer.concat([
    Buffer.from(enc.ephemPublicKey, "base64"),
    Buffer.from(enc.nonce, "base64"),
    Buffer.from(enc.ciphertext, "base64"),
  ]);
  // In smart contract we are using `bytes[112]` variable (fixed size byte array)
  // you might need to use `bytes` type for dynamic sized array
  // We are also using ethers.js which requires type `number[]` when passing data
  // for argument of type `bytes` to the smart contract function
  // Next line just converts the buffer to `number[]` required by contract function
  // THIS LINE IS USED IN OUR ORIGINAL CODE:
  // return buf.toJSON().data;

  // Return just the Buffer to make the function directly compatible with decryptData function
  return buf;
}

export function ComposeNewMessage({ readContracts, writeContracts, address, modalControl, tx }) {
  const [loading, setLoading] = useState(false);
  const [sendingInProgress, setSendingInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [senderPubKey, setSenderPubKey] = useState(consts.emptyHash);
  const [receiverPubKey, setReceiverPubKey] = useState(consts.emptyHash);
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
      const rkey = data.key.substr(2, data.key.length - 1);
      const pk = Buffer.from(rkey, "hex").toString("base64");

      if (isSender) setSenderPubKey(pk);
      else setReceiverPubKey(pk);

      console.log(isSender ? "sender" : "receiver", isSender, data);
      return pk;
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  const onSendMessage = async (senderAddress, recipientAddress, message, attachments) => {
    setSendingInProgress(true);
    try {
      let senderPubKey = await retrievePubKey(senderAddress, true); // get sender public key
      setProgress(1);
      let receiverPubKey = await retrievePubKey(recipientAddress, false); // get receiver public key
      setProgress(2);

      //debugger;
      let emailUuid = uuidv4();
      console.log("emailUuid", emailUuid);

      let driveKey = senderPubKey; // this is not ok

      const emailKey = await deriveDriveKey(driveKey, emailUuid); //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      setProgress(3);

      const encryptSendKey = encryptEmailKey(senderPubKey, Buffer.from(emailKey, "base64"));
      setProgress(4);
      const encryptReceiveKey = encryptEmailKey(receiverPubKey, Buffer.from(emailKey, "base64"));
      setProgress(5);

      setProgressStatus("Uploading attachments...");
      var startTime = Date.now();
      var locations = [];
      for (var i = 0; i < attachments.length; i++) {
        var a = attachments[i];
        //var encAttachment = await encryptMessage(attachment, recepient);
        var hash = await uploadDataToBee(a.binaryData, a.file.type, a.file.name);
        locations.push({ file: a.file, digest: hash });
        setProgress(Math.round(attachments.length > 0 ? 5 + (i / attachments.length) * 80 : 80));
      }

      var completeMessage = message;
      completeMessage.attachments = locations;
      completeMessage.sendTime = startTime;

      var endTime = Date.now();
      completeMessage.sendTime = endTime;
      var smail = JSON.stringify(completeMessage);

      //const mailDigest = await uploadJsonToBee(values, date.getTime() + "_mail.json"); // ms-mail.json
      setProgressStatus("Uploading email...");
      setProgress(90);
      const mailDigest = await uploadDataToBee(smail, "application/octet-stream", startTime + ".smail"); // ms-mail.json
      console.log("mailDigest", mailDigest);

      /// this.props.onDataSubmitedToBee(swarmHash);

      var cost = "0.001";

      setProgressStatus("Waiting for user to sign transaction ...");
      let newTx = await tx(
        writeContracts.SwarmMail.sendEmail(recipientAddress, false, "0x" + mailDigest, {
          value: utils.parseEther(cost),
        }),
      );
      setProgress(95);
      setProgressStatus("Waiting for transaction to finish...");
      await newTx.wait();
      console.log("mail sent", newTx);
      setProgress(100);
      modalControl(false); // turn off modal
    } catch (e) {
      console.error(e);
    }
    setSendingInProgress(false);
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
        {sendingInProgress === true && (
          <>
            {progressStatus}
            <Progress percent={progress} size="small" status="active" />
          </>
        )}
        {sendingInProgress === false && (
          <ComposeNewMessageForm
            address={address}
            onDataSubmitedToBee={onSendSubmitDataToBee}
            loading={setLoading}
            onRetrieveRecipientPubKey={retrievePubKey}
            onSendMessage={onSendMessage}
          />
        )}
      </Modal>
    </>
  );
}

export default ComposeNewMessage;
