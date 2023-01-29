import React, { useState, useEffect, useCallback } from "react";
import { useContractReader } from "eth-hooks";
import { useContractWriter } from "eth-hooks";

import { ethers } from "ethers";
import {
  Button,
  List,
  Card,
  Descriptions,
  Divider,
  Drawer,
  InputNumber,
  Modal,
  notification,
  Row,
  Col,
  Select,
  Space,
  Tooltip,
  Typography,
  IconText,
  Spin,
  Checkbox,
  Avatar,
} from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";

import VirtualList from "rc-virtual-list";

import { uploadJsonToBee, downloadDataFromBee, uploadDataToBee } from "./../Swarm/BeeService";
import { useResolveEnsName } from "eth-hooks/dapps/ens";
import * as consts from "./consts";
import * as EncDec from "./../utils/EncDec.js";
import Blockies from "react-blockies";
const { Meta } = Card;

const ethUtil = require("ethereumjs-util");
const sigUtil = require("@metamask/eth-sig-util");
export async function getPublicKey(signer, account) {
  try {
    // signer = window.ethereum
    return await signer.request({
      method: "eth_getEncryptionPublicKey",
      params: [account],
    });
  } catch (e) {
    return undefined;
  }
}
export async function getECDN(signer, account, ephemeralKey) {
  try {
    // signer = window.ethereum
    return await signer.request({
      method: "eth_performECDH",
      params: [account],
    });
  } catch (e) {
    return undefined;
  }
}
export async function decryptMessage(signer, accountToDecrypt, encryptedMessage) {
  try {
    // debugger;
    // signer ?
    return await signer.request({
      method: "eth_decrypt",
      params: [encryptedMessage, accountToDecrypt],
    });
  } catch (e) {
    console.error("decryptMessage", e);
    return undefined;
  }
}
export async function encryptMessage(encryptionPublicKey /* receiver pubKey */, messageToEncrypt) {
  try {
    return ethUtil.bufferToHex(
      Buffer.from(
        JSON.stringify(
          sigUtil.encrypt({
            publicKey: encryptionPublicKey,
            data: messageToEncrypt,
            version: "x25519-xsalsa20-poly1305",
          }),
        ),
        "utf8",
      ),
    );
  } catch (e) {
    console.error("encryptMessage", e);
    return undefined;
  }
}

export function Inbox({ readContracts, writeContracts, tx, userSigner, address, messageCount, smailMail, setReplyTo }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [key, setKey] = useState(consts.emptyHash);
  const [publicKey, setPublicKey] = useState({ x: consts.emptyHash, y: consts.emptyHash });
  const [mails, setMails] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const [messageCountTrigger, setMessageCountTrigger] = useState(0);

  // get publick key from signer
  async function getPublicKeyFromSignature(signer) {
    const ethAddress = await signer.getAddress();
    const message = "Sign this transaction to enable data transfer. Hash: " + ethers.utils.hashMessage(address);
    const sig = await signer.signMessage(message);
    const msgHash = ethers.utils.hashMessage(message);
    const msgHashBytes = ethers.utils.arrayify(msgHash);
    // Now you have the digest,
    const pk = ethers.utils.recoverPublicKey(msgHashBytes, sig);
    const pubKey = await consts.splitPublicKey(pk);
    const addr = ethers.utils.recoverAddress(msgHashBytes, sig);
    // console.log("Got PK", pk, addr);
    const recoveredAddress = ethers.utils.computeAddress(ethers.utils.arrayify(pk));
    // Throwing here
    if (recoveredAddress != ethAddress) {
      throw Error(`Address recovered do not match, original ${ethAddress} versus computed ${recoveredAddress}`);
      console.log("error", recoveredAddress, ethAddress);
    }
    return { pk, pubKey };
  }

  const updateRegistration = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return; // todo get pub key from ENS
    const data = await readContracts.SwarmMail.getPublicKeys(address);
    setIsRegistered(data.registered);
    setKey(data.key);
    if (isRegistered === false && data.registered) updateMails();
  });
  var updatingMails = false;
  const updateMails = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return;
    if (updatingMails) return;
    updatingMails = true;
    const mails = await readContracts.SwarmMail.getInbox(address);
    processSMails(mails);
    console.log("got smails", mails);
    updatingMails = false;
  });

  const deleteMails = useCallback(async () => {
    if (checked.length === 0) {
      notification.error({
        message: "No mails selected",
        description: "Please select mails to delete",
      });
      return;
    }
    console.log("got smails", checked);
    var newTx = await tx(writeContracts.SwarmMail.removeEmails(1, checked));
    await newTx.wait();
    for (var i = 0; i < checked.length; i++) {
      setMails(mails.filter(m => m.location !== checked[i])); // remove mails with same location
    }
  });

  useEffect(() => {
    updateRegistration();
  }, [address]);

  useEffect(() => {
    console.log("messageCount", messageCount, messageCountTrigger);
    if (messageCount > messageCountTrigger && !updatingMails) updateMails();

    setMessageCountTrigger(messageCount);
  }, [messageCount]);

  const onSignMail = async mail => {
    let newTx = await tx(writeContracts.SwarmMail.signEmail(mail.location));
    await newTx.wait();
    notification.open({
      message: "You signed " + location,
      description: `Your key: ${pubKey}`,
    });
  };
  const processSMails = async sMails => {
    setIsLoading(true);
    var existingMails = mails;
    for (let i = 0; i < sMails.length; i++) {
      var s = sMails[i];
      var mail = { attachments: [] };
      const data = await downloadDataFromBee(s.swarmLocation); // returns buffer

      // see if mail is encrypted
      if (s.isEncryption === true) {
        console.log("data", data, smailMail);
        try {
          var d = JSON.parse(new TextDecoder().decode(data));
          //console.log("d", d);
          var decRes = EncDec.nacl_decrypt(d, smailMail.smail.substr(2, smailMail.smail.length));
          mail = JSON.parse(decRes);
          //console.log("decRes", decRes);
        } catch (e) {
          console.error("decrypt", e);
          continue;
        }
      } else {
        // do this for non encrypted mails
        try {
          mail = JSON.parse(new TextDecoder().decode(data)); //Buffer.from(data).toJSON(); // JSON.parse(data.toString());
        } catch (e) {
          console.error("processSMails", e);
        }
      }
      mail.time = s.time;
      mail.checked = false;
      mail.location = s.swarmLocation;
      mail.sender = s.from;
      mail.signed = s.signed;
      // only add if not existing
      existingMails.findIndex(m => m.sendTime == mail.sendTime) == -1 ? setMails(mails => [mail, ...mails]) : null;
      console.log(mail);
    }
    setIsLoading(false);
    //console.log("processedMails", mails);
  };

  const onCheckAllChange = e => {
    setChecked(e.target.checked ? mails.map(mail => mail.location) : []);
    setCheckAll(e.target.checked);
  };
  const appendData = () => {
    /*fetch(fakeDataUrl)
      .then((res) => res.json())
      .then((body) => {
        setData(data.concat(body.results));
        message.success(`${body.results.length} more items loaded!`);
      });*/
  };
  const onScroll = e => {
    if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === ContainerHeight) {
      appendData();
    }
  };
  const IconText = ({ icon, tooltip, text }: { icon: React.FC, text: string }) => (
    <Tooltip title={tooltip}>
      {React.createElement(icon)}
      {text}
    </Tooltip>
  );

  if (address === undefined) {
    return (
      <div style={{ top: "50%", left: "50%", position: "absolute" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ margin: "auto", width: "100%" }}>
      <>
        {!isRegistered && (
          <Card title={<div>Not Registred</div>}>
            <Typography>
              It appears your account is not registred yet. Please register to receive encrypted data.
            </Typography>
          </Card>
        )}
      </>

      <>
        <>
          <>
            {isRegistered && (
              <>
                <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll} /> &nbsp;
                <Button onClick={() => updateMails()}>🗘</Button>
                <Button onClick={() => deleteMails()}>🗑</Button>&nbsp;
                {isLoading && <Spin />}
              </>
            )}
          </>
          <Checkbox.Group
            style={{ width: "100%" }}
            value={checked}
            onChange={checkedValues => {
              setChecked(checkedValues);
            }}
          >
            {/* // TODO https://ant.design/components/list */}
            <List
              itemLayout="horizontal"
              dataSource={mails}
              renderItem={mail => (
                <List.Item style={{ marginBottom: "5px", marginTop: "0px", padding: "0px" }}>
                  <List.Item.Meta
                    style={{
                      background: !mail.isEncryption ? "#1890ff05" : "#00000011",
                      borderRadius: "5px",
                      paddingBottom: "5px",
                      paddingTop: "5px",
                      paddingRight: "5px",
                    }}
                    avatar={
                      <>
                        <Checkbox value={mail.location} style={{ margin: "0rem 1rem 0rem 0rem" }} />
                        <Tooltip title={mail.sender}>
                          <span>
                            <Blockies className="mailIdenticon" seed={mail.sender} />
                          </span>
                        </Tooltip>
                        {/* <IconText icon={EditOutlined} tooltip="Sign" key="list-vertical-like-o" />, */}
                      </>
                    }
                    title={
                      <div
                        style={{
                          marginTop: "1px",
                          maxHeight: "1.3rem",
                          width: "98%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <strong>{mail.subject}</strong>
                        <span style={{ margin: "15px", cursor: "pointer" }} onClick={() => setReplyTo(mail.sender)}>
                          <IconText icon={ArrowLeftOutlined} tooltip="Reply" key="list-vertical-reply-o" />
                        </span>
                        {mail.signed === true ? (
                          <span style={{ float: "right", right: "0px" }}>
                            <IconText
                              icon={EditOutlined}
                              tooltip="You signed statement of acknowledgment for this message"
                              key="list-vertical-signed-o"
                            />
                          </span>
                        ) : (
                          <span
                            onClick={e => onSignMail(mail)}
                            style={{ float: "right", right: "0px", top: "0px", cursor: "pointer" }}
                          >
                            <IconText
                              icon={EnterOutlined}
                              tooltip="Sign statement of acknowledgment"
                              key="list-vertical-sign-o"
                            />
                          </span>
                        )}
                      </div>
                    }
                    description={
                      <>
                        <div style={{ maxHeight: "2.7rem", overflow: "hidden" }}>{mail.contents}</div>
                        <div>
                          {mail.attachments.length > 0 && (
                            <>
                              {mail.attachments.map((a, i) => (
                                <Tooltip
                                  title={
                                    <>
                                      {a.file.path} <br /> <small>{a.file.type}</small>
                                    </>
                                  }
                                  key={a.digest}
                                >
                                  <span
                                    style={{
                                      cursor: "pointer",
                                      display: "inline-block",
                                      border: "1px solid #00000055",
                                      borderRadius: "5px",
                                      paddingLeft: "0.2rem",
                                      width: "100px",
                                      overflow: "hidden",
                                      textAlign: "center",
                                      textOverflow: "ellipsis",
                                      overflowWrap: "anywhere",
                                      fontSize: "0.7rem",
                                      marginRight: "20px",
                                      marginTop: "3px",
                                      maxHeight: "1.1rem",
                                      background: "#88888888",
                                    }}
                                  >
                                    {a.file.path}
                                  </span>
                                </Tooltip>
                              ))}
                            </>
                          )}
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Checkbox.Group>
        </>
      </>
      <>
        <div style={{ marginTop: 20 }}>
          <small>Selecting: {checked.join(", ")} </small>
        </div>
      </>
    </div>
  );
}

export default Inbox;


// const testMetamaskEncryption = async (receiverPubKey, receiverAddress, messageString) => {
    
//     // const key = await getPublicKey(window.ethereum, address);
//     // // key pk in hex( 0x ) 0x form
//     // const pk = "0x" + Buffer.from(key, "base64").toString("hex");

//     // // get key from hex(0x)
//     // const rkey = pk.substr(2, pk.length - 1);
//     // const bkey = Buffer.from(rkey, "hex").toString("base64");
//     // console.log("Got key", key, pk, "Reverse", rkey, bkey); 

//     // const e = await encryptMessage(bkey, "test");
//     // console.log("Encrypted:", e);
//     // const d = await decryptMessage(window.ethereum, address, e);
//     // console.log("Decrypted:", d);  

//     const e = await encryptMessage(receiverPubKey, messageString);
//     console.log("Encrypted:", e);
//     const d = await decryptMessage(window.ethereum, receiverAddress, e);
//     console.log("Decrypted:", d);
//   };