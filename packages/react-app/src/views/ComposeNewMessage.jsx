import React, { useState } from "react";
import { Button, Card, Typography, Modal, Input, Form, Spin, Progress, Tooltip, notification, Switch } from "antd";
import * as consts from "./consts";
import { uploadDataToBee } from "./../Swarm/BeeService";
import * as layouts from "./layouts.js";
import * as EncDec from "./../utils/EncDec.js";
import { DropzoneReadFileContents } from "./../Swarm/DropzoneReadFileContents";
import { useEffect } from "react";

const { Meta } = Card;
const { Text } = Typography;

const isENS = (address = "") => address.endsWith(".eth") || address.endsWith(".xyz");
class ComposeNewMessageForm extends React.Component {
  formRef = React.createRef();

  constructor(props) {
    super(props);
    // console.log("ComposeNewMessageForm", props);
    this.state = {
      amount: 0,
      hash: null,
      file: null,
      attachments: [],
      recepient: this.props.recipient,
      recipientKey: null,
      isRecipientRegistered: false,
      recipientEns: null,
      isOneWay: this.props.isOneWay,
    };

    this.onRecepientChange(this.props.recipient);
    //console.log("ComposeNewMessageForm", this.props.recipient);
  }
  onSend = async message => {
    //console.log("onFinish", message);
    this.props.loading(true);
    var possibleAddress = await this.props.ensProvider.resolveName(message.recipient);
    if (possibleAddress) {
      console.log("ensAddress", possibleAddress);
    } else {
      possibleAddress = message.recipient;
    }

    await this.props.onSendMessage(
      this.props.address,
      //message.recipient,
      possibleAddress,
      message,
      this.state.attachments,
      this.state.recipientKey,
      this.state.recipientKey !== null /*&& this.props.senderPkRegister.registered*/, // if sender is not registered we can still send encrypted data
      this.state.isOneWay,
    );
    this.props.loading(null);
    this.setState({ isInProgress: false });
  };

  onRecepientChange = async name => {
    //console.log("onRecepientChange", name);
    let ensAddress = null;
    let inputNameOrAddress = name;
    if (isENS(name)) {
      try {
        const possibleAddress = await this.props.ensProvider.resolveName(name);
        if (possibleAddress) {
          inputNameOrAddress = possibleAddress;
          console.log("ensAddress", possibleAddress);
          this.setState({ recipientEns: possibleAddress });
          this.setState({ recepient: possibleAddress });
          notification.open({
            message: `${name} ENS resolved`,
            description: `${possibleAddress}`,
          });
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    } else this.setState({ recipientEns: null });

    this.setState({ recepient: inputNameOrAddress });
    var { pk, registered } = await this.props.onRetrieveRecipientPubKey(inputNameOrAddress, false);
    this.setState({ recipientKey: pk });
    this.setState({ isRecipientRegistered: registered });
    //console.log("onRecepientChange", name, registered);
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
  onOneWayChange(value) {
    console.log(`switch to ${value}`);
    this.setState({ isOneWay: value });
    if (value === true) {
      notification.info({
        message: "One-way message",
        description: "You will not be able to read message. It's encrypted for the recipient only. Cheaper.",
      });
    } else {
      notification.info({
        message: "Two-way message",
        description: "Listed in 'Sent'. You will be able to retrieve and read it. More expensive.",
      });
    }
  }

  render() {
    let fields = [
      {
        name: ["sender"],
        value: this.props.address,
      },
    ];

    // if (this.props.recipient !== "") {
    //   fields.push({
    //     name: ["recipient"],
    //     initialValue: this.props.recipient,
    //   });
    // }

    var total = this.state.attachments.reduce((a, b) => a + b.file.size, 0);
    var percent = Math.round((total / (5 * 1024 * 1024)) * 100);
    const required = [{ required: true }];

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onSend}
          name="composeNewMessage"
          fields={fields}
          initialValues={{
            sender: this.props.sender,
            recipient: this.props.recipient,
          }}
        >
          <Form.Item name="sender" label="Sender">
            <Input disabled />
          </Form.Item>
          {/* {this.state.recipientEns && (
            <div style={{ textAlign: "center" }}>
              <small>Resolved to: {this.state.recipientEns}</small>
            </div>
          )} */}
          <Form.Item name="recipient" label="Recipient" rules={required}>
            <Input
              //defaultValue={this.state.recipient}
              //initialValue={this.state.recipient}
              placeholder="0x address or ENS"
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
            style={{ width: "80%", borderRadius: "5px", alignItems: "center", left: "10%" }}
          >
            {this.state.recipientKey === null || this.props.senderPkRegister.registered === false
              ? "SEND"
              : "ENCRYPT AND SEND"}
          </Button>
          <Form.Item label="" name="isOneWay">
            <div style={{ textAlign: "center", width: "100%", marginLeft: "30%" }}>
              TWO-WAY &nbsp;
              <Switch checked={this.state.isOneWay} onChange={e => this.onOneWayChange(e)} />
              &nbsp; ONE-WAY
            </div>
          </Form.Item>

          <div style={{ textAlign: "center", width: "100%", color: "#AA3333" }}>
            <Tooltip title="Sender and Recipient must both be registered to send secure encrypted messages">
              <span>
                {this.props.senderPkRegister.registered === false && (
                  <>
                    Sender not registered.
                    <br />
                  </>
                )}
                {this.state.isRecipientRegistered === false && <>Recipient not registered.</>}
              </span>
            </Tooltip>
          </div>
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

export function ComposeNewMessage({
  readContracts,
  writeContracts,
  ensProvider,
  address,
  modalControl,
  tx,
  onMessageSent,
  smailMail,
  recipient,
  isOneWay,
}) {
  const [loading, setLoading] = useState(false);
  const [sendingInProgress, setSendingInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [senderPkRegister, setSenderPkRegister] = useState(consts.emptyHash);
  const [receiverPkRegister, setReceiverPkRegister] = useState(consts.emptyHash);
  // const [senderENS, setSenderENS] = useState(null);
  // const [receiverENS, setReceiverENS] = useState(null);

  //let senderENS = null;
  //let receiverENS = null;

  // const onSendSubmitDataToBee = async approvedSwarmHash => {
  //   setLoading(true);
  //   //var data = modalRequestDataSwarm;
  //   //data.reviewerDataHash = approvedSwarmHash;
  //   //setModalRequestDataSwarm(data);
  //   setLoading(null);
  //   //setReviewSubmittedHash(approvedSwarmHash);
  // };

  useEffect(() => {
    const retrieveSenderPubKey = async (address = false) => {
      let senderPubKey = await retrievePubKey(address, true); // get sender public key
      //console.log("senderPubKey", senderPubKey);

      //const ens = useLookupAddress(ensProvider, address);
      //const ensSplit = ens && ens.split(".");
      //const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";
      //if (validEnsCheck) setSenderENS(ens);
    };
    retrieveSenderPubKey(address);
  }, [address]);

  const retrievePubKey = async (forAddress, isSender = false) => {
    try {
      const data = await readContracts.SwarmMail.getPublicKeys(forAddress); // useContractReader(readContracts, "SwarmMail", "isAddressRegistered", [address]);
      const rkey = data.pubKey.substr(2, data.pubKey.length - 1);
      var pk = Buffer.from(rkey, "hex").toString("base64");
      var pkRegister = { pk: pk, registered: data.registered };
      // console.log("pk", pk);
      if (isSender) {
        if (smailMail.smailPrivateKey === null) {
          var notDecrypted = { pk: null, registered: false };
          setSenderPkRegister(notDecrypted);
          // not decrypted
          return notDecrypted;
        }
        setSenderPkRegister(pkRegister);
      } else setReceiverPkRegister(pkRegister);
      // console.log(isSender ? "sender" : "receiver", data);
      if (data.pubKey === "0x0000000000000000000000000000000000000000000000000000000000000000") pk = null;

      return { pk: pk, registered: data.registered };
    } catch (e) {
      console.error(e);
    }
    return { pk: null, registered: false };
  };

  const onSendMessage = async (
    senderAddress,
    recipientAddress,
    message,
    attachments,
    recipientKey,
    isEncrypted,
    sendOneWayEmail,
  ) => {
    setSendingInProgress(true);
    try {
      //let senderPubKey = await retrievePubKey(senderAddress, true); // get sender public key
      //setProgress(1);
      //let receiverPubKey = await retrievePubKey(recipientAddress, false); // get receiver public key
      //setProgress(2);

      /*
      let emailUuid = uuidv4();
      console.log("emailUuid", emailUuid);
      let driveKey = senderPubKey; // this is not ok
      const emailKey = await deriveDriveKey(driveKey, emailUuid); //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      setProgress(3);
      const encryptSendKey = encryptEmailKey(senderPubKey, Buffer.from(emailKey, "base64"));
      setProgress(4);
      const encryptReceiveKey = encryptEmailKey(receiverPubKey, Buffer.from(emailKey, "base64"));
      setProgress(5);
      */
      //var isEncrypted = recipientKey !== null;
      var fileSize = 0; // bytes
      //console.log("isEncrypted", isEncrypted);
      var sharedSecretKey = null;
      if (isEncrypted) {
        sharedSecretKey = await EncDec.calculateSharedKey(
          smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length),
          recipientKey,
        );
      }

      setProgressStatus("Uploading attachments...");
      var startTime = Date.now();
      var locations = [];
      for (var i = 0; i < attachments.length; i++) {
        var a = attachments[i];
        // encrypt attachment
        //var encAttachment = await encryptMessage(attachment, recepient);
        var hash = consts.emptyHash;
        if (isEncrypted) {
          //console.log(a, JSON.stringify(a));
          var binaryData = Array.from(new Uint8Array(a.binaryData));
          var fileObject = { binaryData: binaryData, file: a.file };
          var asString = JSON.stringify(fileObject);
          var encAttachment = { length: 0 };
          if (sendOneWayEmail) {
            encAttachment = JSON.stringify(EncDec.nacl_encrypt(asString, recipientKey));
          } else {
            encAttachment = JSON.stringify(EncDec.nacl_encrypt_with_key(asString, recipientKey, sharedSecretKey));
          }
          hash = await uploadDataToBee(encAttachment, "application/octet-stream", "sm" + i);
          var size = encAttachment.length;
          fileSize += size;
        } else {
          hash = await uploadDataToBee(a.binaryData, a.file.type, a.file.name);
          fileSize += a.binaryData.byteLength;
        }
        locations.push({ file: a.file, digest: hash });
        setProgress(Math.round(attachments.length > 0 ? 5 + (i / attachments.length) * 80 : 80));
      }
      //return;

      var completeMessage = message;
      completeMessage.attachments = locations;
      completeMessage.sendTime = startTime;
      completeMessage.noise = EncDec.generateNoise();

      var endTime = Date.now();
      completeMessage.sendTime = endTime;
      var smail = JSON.stringify(completeMessage);

      // encrypt smail
      if (isEncrypted) {
        if (sendOneWayEmail) {
          smail = JSON.stringify(EncDec.nacl_encrypt(smail, recipientKey));
        } else {
          smail = JSON.stringify(EncDec.nacl_encrypt_with_key(smail, recipientKey, sharedSecretKey));
        }
        //console.log("enc smail", smail);
        fileSize += JSON.stringify(smail).length;
      }

      setProgressStatus("Uploading email...");
      setProgress(90);
      const mailDigest = await uploadDataToBee(smail, "application/octet-stream", startTime + ".smail"); // ms-mail.json
      //console.log("mailDigest", mailDigest);

      // fileSize expects size in bytes
      var pricePerByte = 42 * 8 * 2; // 10000 mio wei per byte
      var cost = Math.floor(fileSize * pricePerByte) + "000000";
      //console.log("cost", cost);
      //var cost = "0.001";

      setProgressStatus("Waiting for user to sign transaction ...");
      var newTx;
      // sendOneWayEmail
      //debugger;

      if (sendOneWayEmail) {
        newTx = await tx(
          writeContracts.SwarmMail.sendOneWayEmail(recipientAddress, isEncrypted, "0x" + mailDigest, {
            value: cost, // in wei
            //value: utils.parseEther(cost),
          }),
        );
      } else {
        newTx = await tx(
          writeContracts.SwarmMail.sendEmail(recipientAddress, isEncrypted, "0x" + mailDigest, {
            value: cost, // in wei
            //value: utils.parseEther(cost),
          }),
        );
      }

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
  var titleProgress = "New message";
  if (sendingInProgress) titleProgress = "Sending message";

  return (
    <>
      {/* {loading && <Spin />} */}
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
        {sendingInProgress === false && (
          <ComposeNewMessageForm
            address={address}
            loading={setLoading}
            onRetrieveRecipientPubKey={retrievePubKey}
            onSendMessage={onSendMessage}
            recipient={recipient}
            ensProvider={ensProvider}
            senderPkRegister={senderPkRegister}
            isOneWay={isOneWay}
            // senderENS={senderENS}
            // receiverENS={receiverENS}
          />
        )}
      </Modal>
    </>
  );
}

export default ComposeNewMessage;
