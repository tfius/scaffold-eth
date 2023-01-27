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
  Spin,
  Checkbox,
  Avatar,
} from "antd";

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
  useEffect(() => {
    updateRegistration();
    updateMails();
  }, [readContracts]);

  const registerAccount = async () => {
    //const data = await getPublicKeyFromSignature(userSigner);
    const key = await getPublicKey(/*userSigner*/ window.ethereum, address);
    // key pk in hex( 0x ) 0x form as required in SmarmMail contract
    const pk = "0x" + Buffer.from(key, "base64").toString("hex");
    const tx = await onRegister(pk); // await testMetamaskEncryption(key, address, "text to encrypt");
  };
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
  const processSMails = async sMails => {
    setIsLoading(true);
    var existingMails = mails;
    for (let i = 0; i < sMails.length; i++) {
      try {
        const smail = sMails[i];
        const data = await downloadDataFromBee(sMails[i].swarmLocation);
        var mail = {};
        if (smail.isEncrytion) {
          // do decryption
        } else {
          mail = data;
        }
        mail.time = smail.time;
        mail.checked = false;
        mail.location = smail.swarmLocation;
        mail.sender = smail.from;
        // only add if not existing
        existingMails.findIndex(m => m.sendTime == mail.sendTime) == -1 ? setMails(mails => [mail, ...mails]) : null;
      } catch (e) {
        console.error("processSMails", e);
      }
    }
    setIsLoading(false);
    console.log("processedMails", mails);
  };

  const onCheckAllChange = e => {
    setChecked(e.target.checked ? mails.map(mail => mail.time) : []);
    setCheckAll(e.target.checked);
  };

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
          <List
            itemLayout="horizontal"
            dataSource={mails}
            renderItem={mail => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <>
                      <Checkbox value={mail.time} style={{ margin: "0rem 1rem 0rem 0rem" }} />
                      <Blockies seed={mail.sender} style={{ padding: "1rem" }} />
                    </>
                  }
                  title={<>{mail.subject}</>}
                  description={<div style={{ height: "2.5rem", overflow: "hidden" }}>{mail.contents}</div>}
                />
              </List.Item>
            )}
          />
        </Checkbox.Group>

        <div style={{ marginTop: 20 }}>
          <b>Selecting:</b> {checked.join(", ")}
        </div>
      </>
    </div>
  );
}

export default Home;
