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

export function FairOSConnect({
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
  const [fairOS, setFairOS] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [login, setLogin] = useState(null);
  const required = [{ required: true }];

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
      setLogin({ login, userStat });
      console.log("Login", login, userStat);
      // {
      //   "user": "demotime11",
      //   "sessionId": "anfeayKjs1LkQC9fAW1jiiX74TLcJuOECgNQPWwJuOo="
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
  async function ConnectFairOSWithWallet() {
    try {
      debugger;
      const signature = await userSigner.signMessage(username + " wants to connect with provider address " + address);
      console.log("signature", signature);
      let resp = await window.connectWallet(username, password, login.userStat.address, signature);
      // let resp = await window.connectWallet(username, password, address, signature);
      // Signature failed Failed to create user : wallet doesnot match portable account address
      // address expected is from userStat, but it should be from my wallet address
      console.log("connect wallet", resp);
      setIsConnectVisible(false);
    } catch (e) {
      notification.warning({
        message: "Signature",
        description: "Signature failed " + e.toString(),
      });
      return;
    }
  }
  async function LoginWithWallet() {
    const signature = await userSigner.signMessage(username + " wants to connect with provider address " + address);
    // need to get userStat.address from login, which is not available here, we still need to login first into fairOS to get it for what we need username password
    let resp = await window.walletLogin(address, signature);
    console.log(resp);
  }

  return (
    // <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
    <>
      {/* <Button onClick={() => ConnectFairOS()}>Connect</Button> */}
      {!isLoginVisible && login != null && <Button onClick={() => Logout()}>Logout FairOS</Button>}
      {!isLoginVisible && login == null && <Button onClick={() => Logout()}>Log in FairOS</Button>}

      {isConnectVisible && (
        <Modal
          title={<h3>Connect FairOS</h3>}
          footer={null}
          visible={isConnectVisible}
          onCancel={() => setIsConnectVisible(false)}
        >
          <Button onClick={() => ConnectFairOSWithWallet()}>Connect</Button>
        </Modal>
      )}

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
            <>Link Portable Account with your Web3 account. You will be able to unlock your account with signature.</>
          </Form>
        </Modal>
      )}
    </>
    // </div>
  );
}
