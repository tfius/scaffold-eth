import React, { useState } from "react";
import { Button, Card, Typography, Modal, Input, Form, Spin, Progress, Tooltip, notification } from "antd";
import * as consts from "./consts";
import { uploadDataToBee } from "../Swarm/BeeService";
import * as layouts from "./layouts.js";

import * as EncDec from "../utils/EncDec.js";

import { DropzoneReadFileContents } from "../Swarm/DropzoneReadFileContents";
import { useEffect } from "react";

const { Meta } = Card;
const { Text } = Typography;

const isENS = (address = "") => address.endsWith(".eth") || address.endsWith(".xyz");
class ComposeNewLockerForm extends React.Component {
  formRef = React.createRef();

  constructor(props) {
    super(props);
    // console.log("ComposeNewMessageForm", props);
    this.state = {
      amount: 0,
      hash: null,
      file: null,
      attachments: [],
    };
  }
  onSend = async message => {
    //console.log("onFinish", message);
    this.props.loading(true);

    await this.props.onLockerMessage(message, this.state.attachments, this.state.recipientKey);
    this.props.loading(null);
  };

  onFileUploaded = async (hash, file) => {
    //console.log("file uploaded", hash, file);
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
    var percent = Math.round((total / (5 * 1024 * 1024)) * 100);
    const required = [{ required: true }];

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          onFinish={this.onSend}
          name="composeNewMessage"
          fields={[
            {
              name: ["sender"],
              value: this.props.address,
            },
          ]}
        >
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
            style={{ width: "80%", borderRadius: "5px", alignItems: "center", left: "10%" }}
          >
            ENCRYPT AND STORE
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

export function ComposeNewLocker({
  readContracts,
  writeContracts,
  ensProvider,
  address,
  modalControl,
  tx,
  onMessageSent,
  smailMail,
  recipient,
}) {
  const [loading, setLoading] = useState(false);
  const [sendingInProgress, setSendingInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");

  useEffect(() => {
    const retrieveSenderPubKey = async (address = false) => {
      let senderPubKey = await retrievePubKey(address); // get sender public key
    };
    retrieveSenderPubKey(address);
  }, [address]);

  const retrievePubKey = async forAddress => {
    try {
      const data = await readContracts.SwarmMail.getPublicKeys(forAddress);
      const rkey = data.key.substr(2, data.key.length - 1);
      var pk = Buffer.from(rkey, "hex").toString("base64");
      // console.log(isSender ? "sender" : "receiver", data);
      if (data.key === "0x0000000000000000000000000000000000000000000000000000000000000000") pk = null;
      return pk;
    } catch (e) {
      console.log(e);
    }
    return null;
  };

  const onLockerMessage = async (message, attachments) => {
    setSendingInProgress(true);
    try {
      var recipientKey = await retrievePubKey(address);
      var ephemeralKey = EncDec.generate_ephemeral_key_pair();

      var fileSize = 0; // bytes
      setProgressStatus("Uploading data...");
      var startTime = Date.now();
      var locations = [];
      for (var i = 0; i < attachments.length; i++) {
        var a = attachments[i];
        // encrypt attachment
        var binaryData = Array.from(new Uint8Array(a.binaryData));
        var fileObject = { binaryData: binaryData, file: a.file };
        var asString = JSON.stringify(fileObject);
        var encAttachment = JSON.stringify(EncDec.nacl_encrypt_with_key(asString, recipientKey, ephemeralKey));
        var hash = await uploadDataToBee(encAttachment, "application/octet-stream", "sm" + i);
        var size = encAttachment.length;
        fileSize += size;

        locations.push({ file: a.file, digest: hash });
        setProgress(Math.round(attachments.length > 0 ? 5 + (i / attachments.length) * 80 : 80));
      }
      var completeMessage = message;
      completeMessage.attachments = locations;
      completeMessage.sendTime = startTime;
      var endTime = Date.now();
      completeMessage.sendTime = endTime;
      // convert from uint8array to base64
      var publicKey = Buffer.from(ephemeralKey.publicKey).toString("base64");
      var secretKey = Buffer.from(ephemeralKey.secretKey).toString("base64");

      var ephKey = { publicKey, secretKey };
      completeMessage.ephemeralKey = ephKey;
      // to convert call this:
      // var decEphemeralKey = {
      //   publicKey: new Uint8Array(Buffer.from(ephKey.publicKey, "base64")),
      //   secretKey: new Uint8Array(Buffer.from(ephKey.secretKey, "base64")),
      // };

      var smail = JSON.stringify(completeMessage);

      // encrypt smail
      smail = JSON.stringify(EncDec.nacl_encrypt_with_key(smail, recipientKey, ephemeralKey));
      fileSize += JSON.stringify(smail).length;

      setProgressStatus("Uploading encrypted data ...");
      setProgress(90);
      const mailDigest = await uploadDataToBee(smail, "application/octet-stream", startTime + ".smail"); // ms-mail.json
      //console.log("mailDigest", mailDigest);

      // fileSize expects size in bytes
      var pricePerByte = 42 * 8 * 2; // 10000 mio wei per byte
      var cost = Math.floor(fileSize * pricePerByte) + "000";
      console.log("cost", cost);

      setProgressStatus("Waiting for user to sign transaction ...");

      let newTx = await tx(
        writeContracts.SwarmMail.storeLocker("0x" + mailDigest, {
          value: cost, // in wei
        }),
      );

      setProgress(95);
      setProgressStatus("Waiting for transaction to finish...");
      await newTx.wait();
      //console.log("mail sent", newTx);
      setProgress(100);

      modalControl(false); // turn off modal
      onMessageSent();
    } catch (e) {
      console.error(e);
    }
    setSendingInProgress(false);
  };
  var titleProgress = "Store encrypted data";
  if (sendingInProgress) titleProgress = "Storing data";

  return (
    <>
      <Modal
        style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
        title={
          <h3>
            {titleProgress} {loading && <Spin />}{" "}
          </h3>
        }
        footer={null}
        visible={true}
        maskClosable={false}
        onOk={() => {}}
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
        {sendingInProgress === false && <ComposeNewLockerForm loading={setLoading} onLockerMessage={onLockerMessage} />}
      </Modal>
    </>
  );
}

export default ComposeNewLocker;
