import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { useContractWriter } from "eth-hooks";

import { ethers } from "ethers";
import {
  Button,
  Timeline,
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
import { PUBKEY_HEX_LENGTH } from "@ethersphere/bee-js";
const { Meta } = Card;

export function Home({ readContracts, writeContracts, tx, userSigner, address, provider, smailMail, setSmailMail }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(consts.emptyHash);
  const [smail, setSmail] = useState(consts.emptyHash);
  const [notifyUserToDecryptSmailKey, setNotifyUserToDecryptSmailKey] = useState(false);
  const [timeline, setTimeline] = useState([
    { children: "Get Encryption Public Key" },
    { children: "Generating new key pair and encrypt for your account" },
    { children: "Sign transaction to register account with Smail" },
    { children: "Registered And Ready To Bond" },
    { children: "Decrypt to Bond" },
  ]);
  const [currentStep, setCurrentStep] = useState(-1);

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
      setCurrentStep(-1);
      return;
    }
    if (smailMail.key === null) {
      try {
        var encryptedSmailKey = await downloadSmailKeyData(data.smail); // download encrypted key
        setNotifyUserToDecryptSmailKey(true);
        setCurrentStep(4);
        var privateKeySmail = await decryptSmailKey(address, encryptedSmailKey); // decrypt key from metamas
        if (privateKeySmail !== undefined) {
          setSmailMail({ key: data.key, smail: privateKeySmail });
          setCurrentStep(-1);
          //console.log(key, privateKeySmail);
        } else
          notification.warning({
            message: "Warning",
            description: "Not decrypted and not bonded",
          });
        //setCurrentStep(-1);
      } catch (err) {
        console.log("err", err);
        notification.error({
          message: "Error",
          description: err.message,
        });
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
    setCurrentStep(0);
    const mmKey = await EncDec.MMgetPublicKey(/*userSigner*/ window.ethereum, address);
    console.log("mmKey", mmKey);
    if (mmKey === undefined) {
      notification.error({
        message: "Error",
        description: "User denied public key request",
      });
      return;
    }
    setCurrentStep(1);
    // console.log("mmKey", mmKey);
    // const pk = "0x" + Buffer.from(key, "base64").toString("hex");
    //
    // username, password
    // ens, soc, get seed
    // fdpWallet = fromSeed(seed)
    //

    const newWallet = ethers.Wallet.createRandom();
    const newPrivateKey = newWallet._signingKey().privateKey;
    // const newPublicKey = newWallet._signingKey().compressedPublicKey;
    //const newCPublicKey = ethers.utils.computePublicKey(newPrivateKey, true);
    // console.log("newPrivateKey", newPrivateKey);
    //console.log("newPublicKey", newPublicKey);
    //T(pubkey(x,y)) = EncryptionPubKey (bytes32)
    // base64 encoded
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

    setCurrentStep(2);
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
    // get soc location from ENS, download and decrypt key, and use it here
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
  //console.log(timeline);

  return (
    <div style={{ margin: "auto", width: "100%" }}>
      <>
        {isRegistered == true && smailMail.key !== null && (
          <Card>
            <h2>Hello</h2>
            <Typography>
              It appears your account is properly registred and bonded. You can send and receive encrypted data.
            </Typography>
          </Card>
        )}
        {/* {notifyUserToDecryptSmailKey && <Card>Confirm decryption of Smail Mail in your Wallet</Card>} */}
        <Card>
          {isRegistered == true && smailMail.key === null && (
            <>
              <h2>Confirm decryption of Smail in your Wallet</h2>
              <Button onClick={() => verifyRegistration()} type="primary">
                DECRYPT TO BOND WITH SMAIL
              </Button>
              <br />
              This will open MetaMask and prompts you with decrypt request. This step is required to bond Smail Wallet
              with your MetaMask account.
              <br />
            </>
          )}
          {isRegistered == false && (
            <>
              <h2>Not Bonded</h2>
              <Typography>
                It appears your account is not listed in catalogue yet. To receive encrypted data you must bond your
                account and public key to catalogue. Please register and bond to receive encrypted data.
              </Typography>

              <br />
              <Button onClick={() => registerAccount(address)} type="primary">
                BOND NOW
              </Button>
              <br />
              <br />
            </>
          )}
          {timeline.length > 0 && currentStep >= 0 && (
            <div>
              <br />
              <Timeline>
                {timeline.map((item, index) => (
                  <Timeline.Item key={index} color={currentStep === index ? "red" : "blue"}>
                    {item.children}
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          )}
          <div>
            <h2>How Smail works</h2>
            How registration works:
            <ul>
              <li>your public encryption key is requested with which new Smail Wallet is created</li>
              <li>Smail Wallet is encrypted with your MetaMask and uploaded to Swarm</li>
              <li>a transaction is sent to register Smail public key and Smail Wallet</li>
              Only MetaMask account that created Smail Wallet can decrypt and bond with it.
            </ul>
          </div>
          <div>
            How sending data works:
            <ul>
              <li>Recipient's Smail public Key is retrieved</li>
              <li>New Ephemeral key is created</li>
              <li>Data is packaged, encrypted and uploaded </li>
              <li>A transaction is sent to notify receiver of new data available</li>
              Your must decrypt Smail Wallet in your MetaMask and bond with it to be able to send encrypted data.
            </ul>
            You will be asked to decrypt your Smail Wallet every time you visit this page. <strong>NOTE: </strong>Only
            receiver can retrieve and decrypt its contents.
            <hr />
            <h2>BEWARE AND BEHOLD</h2>
            Always check that you are on correct domain and that you are using correct MetaMask account. Scammers could
            potentially ask you to decrypt Smail Wallet and gain access to your data.
          </div>
          <div>
            <br />
            <h2>Pricing</h2>
            When you send message you pay transaction costs and for storage fees on Swarm network. Data persistence is
            not guaranteed. Storage fees go to Smail maintainer and are used to buy Bzz tokens to store data for as long
            as possible. For how long you might ask? Answer to this question is tricky. It depends on market conditions
            as prices fluctuate when demand increases. If market is willing to pay more for storage, then postage stamps
            expire sooner and data will be garbage collected.
          </div>
          <div>
            <br />
            <h2>Privacy</h2>
            Sending unencrypted data is supported and occours when:
            <ul>
              <li>if either sender or receiver is not a registered</li>
              <li>Sender's Smail Wallet can not be retrieved or is not decrypted</li>
              <li>Receiver public key can not be retrieved</li>
              You can read and send unencrypted messages if you are connected and not bonded.
            </ul>
            <strong>BEWARE !!! </strong>All unencrypted data and attachements can be retrieved by anyone with the link.
            If you want to store unencrypted data you can use{" "}
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
          </div>
          <br />
          <h2>Consideration</h2>
          It must be noted that transaction is sent from your MetaMask account and is as such recorded on blockchain.
          Transaction metadata can be linked to your account.
          <br />
          <br />
          <h2>Networks</h2>
          Multiple network support, BUT:
          <ul>
            <li>Cross network sending is NOT supported. </li>
            <li>You will have to register on each network.</li>
            <li>Each Smail Wallet will be different.</li>
          </ul>
          Which means if you send on one network, receiver will get message on that network only.
          {/* <hr />
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
          </ul> */}
        </Card>
      </>
    </div>
  );
}

export default Home;
