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
  Avatar,
} from "antd";
import { useResolveEnsName } from "eth-hooks/dapps/ens";
import { emptyHash } from "./consts";
import Blockies from "react-blockies";
const { Meta } = Card;

// before finger today south flavor gossip loyal domain badge supply silent shallow

export const PUBLIC_KEY_LENGTH = 132;
export const PUBLIC_KEY_PART_LENGTH = (PUBLIC_KEY_LENGTH - 4) / 2 + 2;

/**
 * web3 props can be passed from '../App.jsx' into your local view component for use
 * @param {*} yourLocalBalance balance on current network
 * @param {*} readContracts contracts from current chain already pre-loaded using ethers contract module. More here https://docs.ethers.io/v5/api/contract/contract/
 * @returns react component
 */
export function Home({ readContracts, writeContracts, tx, userSigner, address }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [key, setKey] = useState(emptyHash);
  const [publicKey, setPublicKey] = useState({ x: emptyHash, y: emptyHash });
  const [mails, setMails] = useState([]);

  async function splitPublicKey(pk) {
    const x = "0x" + pk.substring(4, PUBLIC_KEY_PART_LENGTH + 2);
    const y = "0x" + pk.substring(PUBLIC_KEY_PART_LENGTH + 2, PUBLIC_KEY_LENGTH + 2);
    return { x, y };
  }

  function joinPublicKey(x, y) {
    return "0x04" + x.substring(2) + y.substring(2);
  }
  async function getPublicKey(signer) {
    const ethAddress = await signer.getAddress();
    const message = "Sign this transaction to enable data transfer. Hash: " + ethers.utils.hashMessage(address);
    const sig = await signer.signMessage(message);
    const msgHash = ethers.utils.hashMessage(message);
    const msgHashBytes = ethers.utils.arrayify(msgHash);
    // Now you have the digest,
    const pk = ethers.utils.recoverPublicKey(msgHashBytes, sig);
    const pubKey = await splitPublicKey(pk);
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
    // todo get pub key from ENS
    const data = await readContracts.SwarmMail.getPublicKeys(address); // useContractReader(readContracts, "SwarmMail", "isAddressRegistered", [address]);
    setIsRegistered(data.registered);
    setKey(data.key);
    setPublicKey({ x: data.x, y: data.y });
    console.log("updateRegistration", data);
  });

  const updateMails = useCallback(async () => {
    const mails = await readContracts.SwarmMail.getInboxEmails(); // useContractReader(readContracts, "SwarmMail", "isAddressRegistered", [address]);
    setMails(mails);
    console.log("updateMails", mails);
  });

  // console.log(readContracts.SwarmMail);
  useEffect(() => {
    updateRegistration();
    updateMails();
  }, [readContracts]);

  // useEffect(() => {
  //   updateRegistration();
  // }, [key]);

  const registerAccount = async () => {
    const data = await getPublicKey(userSigner);
    console.log("Got Pk", data);
    //const publicKey = resPubKey.substr(2, resPubKey.length - 1);
    //Buffer.from(publicKey, "hex").toString("base64");
    const tx = await onRegister(ethers.utils.keccak256(data.pk), data.pubKey.x, data.pubKey.y);
  };

  const onRegister = async (pubKey, x, y) => {
    console.log("Registering", address, pubKey, x, y);
    let newTx = await tx(writeContracts.SwarmMail.register(pubKey, x, y));

    await newTx.wait();
    console.log("Registered", address, pubKey, x, y);

    updateRegistration();
    //setPublicKey({ x: x, y: y });
    //setKey(pubKey);
  };

  return (
    <div style={{ margin: "auto", width: "100%" }}>
      <>
        {!isRegistered && (
          <Card title={<div>Not Registred</div>}>
            <Typography>
              It appears your account is not registred yet. Please register your public key to receive encrypted data
            </Typography>
            <Button onClick={() => registerAccount(address)}>REGISTER NOW</Button>
          </Card>
        )}
      </>
      <>
        {isRegistered && (
          <>
            <span>Refresh 🗘</span>
          </>
        )}
      </>

      <>
        <List
          itemLayout="horizontal"
          dataSource={mails}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                // avatar={<Avatar src="https://joeschmoe.io/api/v1/random" />}
                avatar={<Blockies seed={item.from} />}
                title={<a href="https://ant.design">{item.title}</a>}
                description="Ant Design, a design language for background applications, is refined by Ant UED Team"
              />
            </List.Item>
          )}
        />
        {mails.map((mail, index) => {
          <>tralala</>;
        })}
      </>
    </div>
  );
}

export default Home;
