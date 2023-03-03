import React, { useState, useEffect, useCallback } from "react";

import { ethers } from "ethers";
import {
  Button,
  List,
  Card,
  Modal,
  notification,
  Tooltip,
  Typography,
  Spin,
  Checkbox,
  Form,
  Input,
  Select,
  Skeleton,
  Row,
  Menu,
  Col,
} from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";

import { downloadDataFromBee, downloadJsonFromBee } from "../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { AddressSimple } from "../components";

import { uploadJsonToBee, uploadDataToBee } from "../Swarm/BeeService";
import { categoriesTree, categoryList } from "./categories";

export function FairOSWasmConnect({
  selectedBeeNetwork,
  targetNetwork,
  BEENETWORKS,
  batchId,
  readContracts,
  writeContracts,
  tx,
  userSigner,
  address,
  smailMail,
  mainnetProvider,
}) {
  const [isLoginVisible, setIsLoginVisible] = useState(true);
  const [isConnectVisible, setIsConnectVisible] = useState(false);
  const [isPortableAddressVisible, setIsPortableAddressVisible] = useState(false);
  const [fairOS, setFairOS] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [login, setLogin] = useState(null);
  const [podList, setPodList] = useState([]);
  const required = [{ required: true }];

  async function OpenLoginDialog() {
    setLogin(null);
    setIsLoginVisible(true);
    setIsConnectVisible(false);
    await window.userLogout();
  }

  async function ConnectFairOS() {
    const beeNet = BEENETWORKS[selectedBeeNetwork];
    console.log("wasmConnect", selectedBeeNetwork, targetNetwork, batchId);

    let resp = await window.connect(
      beeNet.endpoint, // "http://localhost:1633", // bee endpoint
      batchId, //"51987f7304b419d8aa184d35d46b3cfeb1b00986ad937b3151c7ade699c81338", // stampId
      beeNet.rpc, //"http://localhost:9545", // rpc
      "testnet", //targetNetwork.name, //"play or testnet", // network
      targetNetwork.rpcUrl, // "http://localhost:9545", // contract.rpc
      readContracts.SwarmMail.address, //"0x21a59654176f2689d12E828B77a783072CD26680", // swarm mail contract address
    );
    console.log("ConnectFairOS", resp);
    setFairOS(resp);
  }
  async function Login(values) {
    setLogin(null);
    setLoginError("");
    if (!fairOS) {
      await ConnectFairOS();
    }
    try {
      var login = await window.login(values.username, values.password);

      var userStat = await window.userStat(login.sessionId);
      var loginObj = { user: login.user, sessionId: login.sessionId, address: userStat.address };
      setLogin(loginObj);
      console.log("Login", login, userStat, loginObj);
      // {
      //   "user": "demotime11",
      //   "sessionId": "anfeayKjs1LkQC9fAW1jiiX74TLcJuOECgNQPWwJuOo="
      // }
      // {
      //   "userName": "demotime11",
      //   "address": "0x8702B672afAcAC4e4EFE45FC8411513e7C9243Ab"
      // }
      setIsLoginVisible(false);
      notification.info({
        message: "Login",
        description: "Login successfull",
      });
      setIsConnectVisible(true);
    } catch (e) {
      console.log("Login error", e);
      setLoginError(e);
    }
  }
  async function Logout() {
    setLogin(null);
    setIsLoginVisible(true);
    await window.userLogout();
  }
  const setPortableAddress = useCallback(async (walletAddress, portableAddress) => {
    var newTx = await tx(writeContracts.SwarmMail.setPortableAddress(portableAddress));
    await newTx.wait();
  });
  async function ConnectFairOSWithWallet() {
    try {
      //debugger;
      const signature = await userSigner.signMessage(username + " will connect with " + address);
      console.log("signature", signature);
      //let resp = await window.connectWallet(username, password, login.userStat.address, signature);
      let resp = await window.connectWallet(username, password, login.address, signature);
      // address expected is from userStat, but it should be from my wallet address, can fail with Signature failed to create user : wallet doesnot match portable account address
      console.log("connect wallet", resp);
      setIsConnectVisible(false);
    } catch (e) {
      notification.warning({
        message: "Signature",
        description: "Signature failed " + e.toString(),
      });
      //return;
    }

    await SetPortableAccount();
  }
  async function SetPortableAccount() {
    setIsPortableAddressVisible(true);
    var newTx = await setPortableAddress(address, login.address);
    setIsPortableAddressVisible(false);
    setIsConnectVisible(false);
  }
  async function LoginWithWallet() {
    const portableAddress = await readContracts.SwarmMail.getPortableAddress(address);
    const signature = await userSigner.signMessage(username + "  will connect with " + address);
    console.log(portableAddress, "signature", signature);
    // need to get userStat.address from login, which is not available here, we still need to login first into fairOS to get it for what we need username password
    let resp = await window.walletLogin(portableAddress, signature);
    console.log("loginWithWallet", resp);
  }
  async function PodList() {
    let resp2 = await window.podList(resp.sessionId);
    setPodList(resp2);
    console.log("podList", resp2);
  }

  return (
    // <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
    <>
      {/* <Button onClick={() => ConnectFairOS()}>Connect</Button> */}
      {!isLoginVisible && login != null && <Button onClick={() => Logout()}>Logout FairOS</Button>}
      {!isLoginVisible && login == null && <Button onClick={() => OpenLoginDialog()}>Login FairOS</Button>}

      {isPortableAddressVisible && (
        <Modal
          title={<h3>Set Portable Address</h3>}
          footer={null}
          visible={isPortableAddressVisible}
          onCancel={() => setIsPortableAddressVisible(false)}
        >
          <>
            Signature OK. <br />
            <hr />
            To access <strong>{username}</strong> through Smail a mapping <br />
            from: {address}
            <br />
            to:&nbsp;&nbsp;&nbsp;&nbsp; {login.address} <br />
            is needed. <br />
            Please confirm the transaction in your wallet.
          </>
          <br />
          <Spin />
        </Modal>
      )}

      {/* Connect FairOS with wallet modal window */}
      {isConnectVisible && (
        <Modal
          title={<h3>Connect Portable Account FairOS </h3>}
          footer={null}
          visible={isConnectVisible}
          onCancel={() => setIsConnectVisible(false)}
        >
          <>
            To register your <strong>{address}</strong> <br /> with <strong>{username}</strong> a signature is needed.{" "}
            <hr />
            This does not bond your address with Smail, only enables you to login into your FairOS account through
            Smail.
          </>
          <br />
          <br />
          <Button onClick={() => ConnectFairOSWithWallet()}>Connect</Button>
        </Modal>
      )}
      {/* FairOS Login modal window */}
      {isLoginVisible && (
        <Modal
          style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
          title={<h3>FairOS login</h3>}
          footer={null}
          visible={isLoginVisible}
          //maskClosable={false}
          onOk={() => {
            //setModal(null);
          }}
          onCancel={() => {
            setIsLoginVisible(false);
          }}
        >
          <Form onFinish={Login}>
            <Form.Item name="username" label="username">
              <Input
                defaultValue={username}
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </Form.Item>
            <Form.Item name="password" label="Password">
              <Input
                defaultValue={password}
                placeholder="password"
                value={password}
                type="password"
                onChange={e => setPassword(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Login with password
              </Button>
              &nbsp;
              <Button onClick={() => LoginWithWallet()}>Login with provider</Button>
            </Form.Item>

            <div style={{ color: "red" }}>{loginError}</div>
            <>
              Login with your Portable Account.
              <br />
              You will be able to connect your portable account with Smail and later unlock your account with signature
              from your wallet.
            </>
          </Form>
        </Modal>
      )}
    </>
    // </div>
  );
}
