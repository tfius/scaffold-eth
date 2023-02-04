import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
import * as EncDec from "./../utils/EncDec.js";
const { Meta } = Card;

export function Home({ readContracts, writeContracts, tx, userSigner, address, provider, smailMail, setSmailMail }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(consts.emptyHash);
  const [smail, setSmail] = useState(consts.emptyHash);
  const [notifyUserToDecryptSmailKey, setNotifyUserToDecryptSmailKey] = useState(false);

  const verifyRegistration = useCallback(async () => {
    /*if (readContracts === undefined || readContracts.SwarmMail === undefined) {
      setIsLoading(true);
      return; // todo get pub key from ENS
    }*/
    var data = {};
    try {
      data = await readContracts.SwarmMail.getPublicKeys(address);
      //console.log("got data", data);
      if (
        data.key === "0x0000000000000000000000000000000000000000000000000000000000000000" ||
        data.smail === "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        throw new Error("not registered");
      }
      setIsRegistered(data.registered);
      setKey(data.key);
    } catch (e) {
      setIsLoading(false);
      setIsRegistered(false);
      setSmailMail({ key: null, smail: null });
      return;
    }
    if (smailMail.key === null) {
      try {
        var encryptedSmailKey = await downloadSmailKeyData(data.smail); // download encrypted key
        setNotifyUserToDecryptSmailKey(true);
        var decryptedSmailKey = await decryptSmailKey(address, encryptedSmailKey); // decrypt key from metamas
        if (decryptedSmailKey !== undefined) {
          setSmailMail({ key: data.key, smail: decryptedSmailKey });
          //console.log(key, decryptedSmailKey);
        }
      } catch (err) {
        console.log("err", err);
        setSmailMail({ key: null, smail: null });
      }
    }

    setNotifyUserToDecryptSmailKey(false);
    setIsLoading(false);
  });

  useEffect(() => {
    verifyRegistration();
  }, [address]); // readContracts, writeContracts,

  const registerAccount = async () => {
    const mmKey = await EncDec.MMgetPublicKey(/*userSigner*/ window.ethereum, address);
    // console.log("mmKey", mmKey);
    // const pk = "0x" + Buffer.from(key, "base64").toString("hex");
    const newWallet = ethers.Wallet.createRandom();
    const newPrivateKey = newWallet._signingKey().privateKey;
    // const newPublicKey = newWallet._signingKey().compressedPublicKey;
    //const newCPublicKey = ethers.utils.computePublicKey(newPrivateKey, true);
    // console.log("newPrivateKey", newPrivateKey);
    //console.log("newPublicKey", newPublicKey);

    const encKey = EncDec.nacl_getEncryptionPublicKey(newPrivateKey);
    // console.log("encKey", encKey);
    const fromUrlPubKey = "0x" + Buffer.from(encKey, "base64").toString("hex");
    //console.log("fromUrlPubKey", EncDec.nacl_decodeHex(EncDec.nacl_decodePublicKey(encKey)));
    //console.log("fromUrlPubKey", fromUrlPubKey);

    // // // //////////////////////////////////////////////////////////////////////////////////////////
    // // // /// TEST nacl encrypt decrypt
    // // // var encRes = EncDec.nacl_encrypt("Hello World", encKey);
    // // // console.log("encRes", encRes);
    // // // var decRes = EncDec.nacl_decrypt(encRes, newPrivateKey.substr(2, newPrivateKey.length));
    // // // console.log("decRes", decRes);
    // // // //////////////////////////////////////////////////////////////////////////////////////////

    // console.log("newCPublicKey", newCPublicKey);
    //const compressedPublicKey = ethers.utils.compressPublicKey(newPublicKey);
    //console.log("compressedPublicKey", compressedPublicKey);
    // const base64EncodedPublicKey = ethers.utils.toUtf8String(newPublicKey.substr(2, newPublicKey.length));
    // console.log("base64EncodedPublicKey", base64EncodedPublicKey);

    // convert public key to base64
    // // // const rkey = newPublicKey.substr(3, newPublicKey.length);
    // // // const urlPubKey = EncDec.hexToBase64(rkey);
    // // // console.log("urlPubKey", urlPubKey);

    // // // const fromUrlPubKey = "0x" + Buffer.from(urlPubKey, "base64").toString("hex");
    // // // console.log("fromUrlPubKey", fromUrlPubKey);

    // // const bkey = Buffer.from(newPublicKey, "hex").toString("base64");
    // // console.log("rkey bkey", rkey, bkey);
    // // const urlPubKey = EncDec.hex2base64url(rkey);
    // // console.log("urlPubKey", urlPubKey);
    //const urlPubKey1 = EncDec.hexToBase64(rkey);
    //console.log("urlPubKey1", urlPubKey1);
    //const bkeypk = "0x" + Buffer.from(bkey, "base64").toString("hex");
    //console.log("bkeypk", bkeypk);
    //const sharedSecret = newWallet._signingKey().computeSharedSecret(newPublicKey); // computeSharedSecret
    //console.log("sharedSecret", newPublicKey, EncDec.urlEncodeHashKey(newPublicKey));

    //var password = "password";
    //var rootKey = await EncDec.createRootKey(password);
    //console.log("driveKey", rootKey);
    var encryptedKey = await EncDec.MMencryptMessage(mmKey, newPrivateKey);
    var keyLocation = await uploadSmailKey(encryptedKey); // upload necrypted key

    // console.log("encryptedKey", encryptedKey, keyLocation);
    // var encryptedSmailKey = await downloadSmailKeyData("0x" + keyLocation); // download encrypted key
    // var decryptedSmailKey = await decryptSmailKey(address, encryptedSmailKey); // decrypt key from metamas

    //var pubKey2 = EncDec.nacl_getEncryptionPublicKey(decryptedSmailKey);
    //console.log("encKey", pubKey2);
    //
    //var decryptKey = await EncDec.MMdecryptMessage(window.ethereum, address, encryptKey);
    //console.log("decryptKey", decryptKey);
    //var uploadRootKeyHash = await uploadDataToBee(encryptKey, "enc", address);
    //console.log("uploadRootKeyHash", uploadRootKeyHash);
    //var downloadRootKeyData = await downloadDataFromBee("0x" + uploadRootKeyHash);
    //var decodedRootKey = new TextDecoder("utf-8").decode(downloadRootKeyData);
    //console.log("downloadRootKey", decodedRootKey);
    //var decryptRootKey = await EncDec.MMdecryptMessage(window.ethereum, address, decodedRootKey);
    //console.log("decryptKey", decryptRootKey);

    const tx = await onRegister(fromUrlPubKey, "0x" + keyLocation); // await testMetamaskEncryption(key, address, "text to encrypt");
  };

  const uploadSmailKey = async encryptedSmailKey => {
    var hash = await uploadDataToBee(encryptedSmailKey, "application/octet-stream", address);
    //console.log("uploadSmailKey", hash);
    return hash;
  };
  const downloadSmailKeyData = async uploadSmailKeyLocation => {
    var downloadSmailKeyData = await downloadDataFromBee(uploadSmailKeyLocation);
    var smailKeyData = new TextDecoder("utf-8").decode(downloadSmailKeyData);
    //console.log("downloadSmailKeyData", smailKeyData);
    return smailKeyData;
  };
  const decryptSmailKey = async (forAddress, encryptedSmailKeyData) => {
    var decryptedSmailKey = await EncDec.MMdecryptMessage(window.ethereum, forAddress, encryptedSmailKeyData);
    //console.log("decryptedSmailKey", decryptedSmailKey);
    return decryptedSmailKey;
  };

  const onRegister = async (pubKey, smailKeyLocation) => {
    //console.log("Registering", address, pubKey, smailKeyLocation);
    let newTx = await tx(writeContracts.SwarmMail.register(pubKey, smailKeyLocation));
    await newTx.wait();
    notification.open({
      message: "Registered " + address,
      description: `Your key: ${pubKey}`,
    });
    await verifyRegistration();
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
        {isRegistered == true && smailMail.key !== null && (
          <>
            <Card>
              <h1>Welcome</h1>
              <Typography>
                It appears your account is properly registred. You can send and receive encrypted data.
              </Typography>
            </Card>
          </>
        )}
        {/* {notifyUserToDecryptSmailKey && <Card>Confirm decryption of Smail Mail in your Wallet</Card>} */}
        <Card title={notifyUserToDecryptSmailKey ? <>Confirm decryption of Smail Mail in your Wallet</> : null}>
          {isRegistered == true && smailMail.key === null && (
            <>
              <Button onClick={() => verifyRegistration()}>DECRYPT SMAIL WALLET</Button>
              <br />
              Opens MetaMask and prompts you with decrypt request. Decryption of Smail Wallet requires this step.
              <hr />
            </>
          )}
          {isRegistered == false && (
            <>
              <h1>Not Registered</h1>
              <Typography>
                It appears your account is not listed in registry yet. To receive data you must add you account and
                public key to catalogue. Please register to be able to send and receive data.
              </Typography>

              <br />
              <Button onClick={() => registerAccount(address)}>REGISTER NOW</Button>
              <br />
              <br />
            </>
          )}
          <div>
            How registration works:
            <ul>
              <li>your encryption public key is requested</li>
              <li>a new Smail Wallet will be created</li>
              <li>Wallet is encrypted with your MetaMask and uploaded to Swarm</li>
              <li>a transaction is sent to register Smail public key and Swarm Wallet</li>
              Only your MetaMask account with whom you registered can decrypt your Smail Wallet
            </ul>
          </div>
          <div>
            How sending data works:
            <ul>
              <li>Smail Wallet is retrieved and decrypted in MetaMask</li>
              <li>Recipients Public Key is needed to create Ephemeral key for each package</li>
              <li>Data is packaged and encrypted so only reciever retrieve its contents</li>
              <li>A transaction is sent to notify receiver of new data available</li>
            </ul>
            You will be asked to decrypt your Smail Wallet every time you visit this page. In order to use this page,
            your must allow decryption of SMail Wallet in your MetaMask.
            <hr />
            <strong>BEWARE AND BEHOLD</strong>
            <br />
            Always check that you are on correct domain and that you are using correct MetaMask account. Even though
            your MetaMask account's public key is not stored anywhere scammers could potentially ask you to decrypt
            Smail Wallet and gain access to your data.
          </div>
        </Card>
      </>

      <>
        <Card>
          Sending unencrypted data is supported.
          <ul>
            <li>if either sender or receiver is not a Smail registered user</li>
            <li>sender Smail Wallet can not be retrieved</li>
            <li>receiver public key can not be retrieved</li>
          </ul>
          <strong>BEWARE !!! </strong>All unencrypted data and attachements can be retrieved by anyone with the link. If
          you want to store unencrypted data you can use{" "}
          <a href="https://www.ethswarm.org/" target="_blank" rel="noopener noreferrer">
            Swarm
          </a>{" "}
          directly, or use{" "}
          <a href="https://docs.fairos.fairdatasociety.org/docs/" target="_blank" rel="noopener noreferrer">
            FairOS
          </a>{" "}
          or{" "}
          <a href="https://fdp.fairdatasociety.org/" target="_blank" rel="noopener noreferrer">
            FDP protocol
          </a>
          .
        </Card>
      </>
      <>
        <Card>
          Multiple network support, BUT:
          <ul>
            <li>Cross network sending is NOT supported. </li>
            <li>You will have to register on each network.</li>
            <li>Each Smail Wallet will be different.</li>
          </ul>
          Which means if you send on one network, receiver will get message on that network only.
          <hr />
          Networks:
          <ul>
            <li>Ethereum</li>
            <li>Xdai</li>
            <li>Arbitrum</li>
            <li>Optimism</li>
            <li>Matic</li>
            <li>Avalanche</li>
            <li>Harmony</li>
            <li>Goerli</li>
            <li>Rinkeby</li>
          </ul>
        </Card>
      </>
    </div>
  );
}

export default Home;
