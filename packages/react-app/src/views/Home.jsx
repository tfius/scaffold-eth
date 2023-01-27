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
import { EnterOutlined, EditOutlined } from "@ant-design/icons";

import VirtualList from "rc-virtual-list";

import { uploadJsonToBee, downloadDataFromBee, uploadDataToBee } from "./../Swarm/BeeService";
import { useResolveEnsName } from "eth-hooks/dapps/ens";
import * as consts from "./consts";
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

export function Home({ readContracts, writeContracts, tx, userSigner, address }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [key, setKey] = useState(consts.emptyHash);
  const [publicKey, setPublicKey] = useState({ x: consts.emptyHash, y: consts.emptyHash });
  const [mails, setMails] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);

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
  });

  const updateMails = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return;
    const mails = await readContracts.SwarmMail.getInbox(address);
    processSMails(mails);
    console.log("got smails", mails);
  });

  const deleteMails = useCallback(async () => {
    //if (readContracts === undefined || readContracts.SwarmMail === undefined) return;
    //const mails = await readContracts.SwarmMail.getInbox(address);
    //processSMails(mails);
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
    // remove mails with same location
    for (var i = 0; i < checked.length; i++) {
      setMails(mails.filter(m => m.location !== checked[i]));
    }
  });

  useEffect(() => {
    updateRegistration();
    updateMails();
  }, [readContracts]);

  const testMetamaskEncryption = async (receiverPubKey, receiverAddress, messageString) => {
    /*
    const key = await getPublicKey(window.ethereum, address);
    // key pk in hex( 0x ) 0x form
    const pk = "0x" + Buffer.from(key, "base64").toString("hex");

    // get key from hex(0x)
    const rkey = pk.substr(2, pk.length - 1);
    const bkey = Buffer.from(rkey, "hex").toString("base64");
    console.log("Got key", key, pk, "Reverse", rkey, bkey); 

    const e = await encryptMessage(bkey, "test");
    console.log("Encrypted:", e);
    const d = await decryptMessage(window.ethereum, address, e);
    console.log("Decrypted:", d);  */

    const e = await encryptMessage(receiverPubKey, messageString);
    console.log("Encrypted:", e);
    const d = await decryptMessage(window.ethereum, receiverAddress, e);
    console.log("Decrypted:", d);
  };

  const registerAccount = async () => {
    //const data = await getPublicKeyFromSignature(userSigner);
    const key = await getPublicKey(/*userSigner*/ window.ethereum, address);
    // key pk in hex( 0x ) 0x form as required in SmarmMail contract
    const pk = "0x" + Buffer.from(key, "base64").toString("hex");
    const tx = await onRegister(pk); // await testMetamaskEncryption(key, address, "text to encrypt");
  };

  const onRegister = async (pubKey /*, x, y*/) => {
    console.log("Registering", address, pubKey /*, x, y*/);
    let newTx = await tx(writeContracts.SwarmMail.register(pubKey /*, x, y*/));
    await newTx.wait();
    notification.open({
      message: "Registered " + address,
      description: `Your key: ${pubKey}`,
    });
    await updateRegistration();
  };

  const onSignMail = async location => {
    debugger;
    let newTx = await tx(writeContracts.SwarmMail.storage(location));
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
      try {
        const smail = sMails[i];
        const data = await downloadDataFromBee(sMails[i].swarmLocation); // returns buffer
        var mail = {};
        if (smail.isEncrytion) {
          // do decryption
        } else {
          mail = mail = JSON.parse(new TextDecoder().decode(data)); //Buffer.from(data).toJSON(); // JSON.parse(data.toString());
        }
        mail.time = smail.time;
        mail.checked = false;
        mail.location = smail.swarmLocation;
        mail.sender = smail.from;
        // only add if not existing
        existingMails.findIndex(m => m.sendTime == mail.sendTime) == -1 ? setMails(mails => [mail, ...mails]) : null;
        console.log(mail);
      } catch (e) {
        console.error("processSMails", e);
      }
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

  return (
    <div style={{ margin: "auto", width: "100%" }}>
      <>
        {!isRegistered && (
          <Card title={<div>Not Registred</div>}>
            <Typography>
              It appears your account is not registred yet. Please register to receive encrypted data.
            </Typography>
            <Button onClick={() => registerAccount(address)}>REGISTER NOW</Button>
          </Card>
        )}
      </>
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

      <>
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
              <List.Item
                style={{ marginBottom: "5px", marginTop: "0px", padding: "0px" }}
                actions={[
                  // <IconText icon={EnterOutlined} tooltip="Reply" key="list-vertical-star-o" />,
                  <IconText
                    icon={EditOutlined}
                    tooltip="Sign"
                    key="list-vertical-like-o"
                    onClick={() => signEmail(mail.location)}
                  />,
                  // text="156"
                ]}
              >
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
                          <Blockies
                            className="mailIdenticon"
                            seed={mail.sender}
                            style={{ marginTop: "1rem", position: "relative" }}
                          />
                        </span>
                      </Tooltip>
                      {/* <IconText icon={EditOutlined} tooltip="Sign" key="list-vertical-like-o" />, */}
                    </>
                  }
                  title={<div style={{ marginTop: "5px" }}>{mail.subject}</div>}
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

        <div style={{ marginTop: 20 }}>
          <small>Selecting: {checked.join(", ")} </small>
        </div>
      </>
    </div>
  );
}

export default Home;
