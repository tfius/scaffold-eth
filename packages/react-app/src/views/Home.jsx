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
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(consts.emptyHash);

  const updateRegistration = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) {
      setIsLoading(true);
      return; // todo get pub key from ENS
    }
    const data = await readContracts.SwarmMail.getPublicKeys(address);
    setIsRegistered(data.registered);
    setKey(data.key);
    setIsLoading(false);
  });

  useEffect(() => {
    updateRegistration();
  }, [address]); // readContracts, writeContracts,

  const registerAccount = async () => {
    const key = await getPublicKey(/*userSigner*/ window.ethereum, address);
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

  if (isLoading) {
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
          <Card>
            {/* title={<div>Not Registered</div>} */}
            <h1>Not Registered</h1>
            <Typography>
              It appears your account is not listed in registry yet. To receive data you must add you account and public
              key to catalogue. Please register to be able to send and receive data.
            </Typography>
            <Button onClick={() => registerAccount(address)}>REGISTER NOW</Button>
          </Card>
        )}
      </>
      <>
        {isRegistered && (
          <Card>
            <h1>Welcome</h1>
            <Typography>It appears your account is properly registred. You can send and receive data.</Typography>
          </Card>
        )}
      </>
    </div>
  );
}

export default Home;
