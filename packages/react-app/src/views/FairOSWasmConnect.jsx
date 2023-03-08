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
import * as layouts from "./layouts.js";

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
  setFairOSPods,
  setSessionId,
}) {
  const [listingFee, setListingFee] = useState(ethers.utils.parseEther("0.0001"));

  const [isFairOSVisible, setIsFairOSVisible] = useState(true); // displays FairOS dialog
  const [isLoginVisible, setIsLoginVisible] = useState(false); // displays login dialog
  const [isConnectVisible, setIsConnectVisible] = useState(false); // displays connect dialog
  const [isPortableAddressVisible, setIsPortableAddressVisible] = useState(false); // display wait TX for connect dialog
  const [isListingVisible, setIsListingVisible] = useState(false);
  const [isPodLoading, setIsPodLoading] = useState(false);

  const [fairOS, setFairOS] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [portableAddress, setPortableAddress] = useState(null);

  const [loginError, setLoginError] = useState("");
  const [login, setLogin] = useState(null);
  const [podList, setPodList] = useState({ pods: [], sharedPods: [] });

  const [selectedPodName, setSelectedPodName] = useState(null);
  const [selectedPodAddress, setSelectedPodAddress] = useState(null);

  const required = [{ required: true }];

  async function getPortableAddress(forAddress) {
    return await readContracts.SwarmMail.getPortableAddress(forAddress);
  }

  const refreshPortableAddress = useCallback(async forAddress => {
    const fdpAddress = await getPortableAddress(address);
    if (fdpAddress === "0x0000000000000000000000000000000000000000") fdpAddress = null;
    setPortableAddress(fdpAddress);
    console.log("on load portableAddress", fdpAddress);
    return fdpAddress;
  });

  useEffect(async () => {
    if (readContracts != undefined && address != undefined) {
      refreshPortableAddress(address);
      var listFee = await readContracts.SwarmMail.minListingFee();
      setListingFee(listFee.toString());
    }
  }, [readContracts, address, portableAddress]);

  async function OpenFairOSDialog() {
    refreshPortableAddress(address);
    setIsFairOSVisible(true);
    setIsLoginVisible(false);
    setIsConnectVisible(false);
    //setLogin(null);
  }
  async function OpenLoginDialog() {
    //setLogin(null);
    //setIsFairOSVisible(true);
    setIsLoginVisible(true);
    setIsConnectVisible(false);
  }

  async function Logout() {
    setLogin(null);
    OpenFairOSDialog();
    setPodList({ pods: [], sharedPods: [] });
    if (login.sessionId) await window.userLogout(login.sessionId);
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
      var resp = await window.login(values.username, values.password);
      var userStat = await window.userStat(resp.sessionId);
      var loginObj = { user: resp.user, sessionId: resp.sessionId, address: userStat.address };
      setLogin(loginObj);
      console.log("Login", resp, userStat, loginObj);
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
        message: loginObj.user + " Logged In FairOS",
        description: "Login successfull",
      });
      setIsConnectVisible(true);
    } catch (e) {
      console.log("Login error", e);
      setLoginError(e);
    }
  }

  const setPortableAddressTx = useCallback(async (walletAddress, portableAddress) => {
    var newTx = await tx(writeContracts.SwarmMail.setPortableAddress(portableAddress));
    await newTx.wait();
  });
  async function ConnectFairOSWithWallet() {
    try {
      const signature = await userSigner.signMessage(login.address + " will connect with " + address);
      console.log("signature 1", login.address, signature, address);
      let resp = await window.connectWallet(username, password, login.address, signature);
      // address expected is from userStat, but it should be from my wallet address, can fail with Signature failed to create user : wallet doesnot match portable account address
      console.log("connect wallet", resp);
      setIsConnectVisible(false);
    } catch (e) {
      notification.warning({
        message: "Signature",
        description: "Signature failed " + e.toString(),
      });
    }
    await SetPortableAccount();
  }
  async function SetPortableAccount() {
    setIsPortableAddressVisible(true);
    var newTx = await setPortableAddressTx(address, login.address);
    setIsPortableAddressVisible(false);
    setIsConnectVisible(false);
  }
  async function LoginWithWallet() {
    const portableFDPAddress = await getPortableAddress(address);
    const signature = await userSigner.signMessage(portableFDPAddress + " will connect with " + address);
    if (!fairOS) {
      await ConnectFairOS();
    }
    console.log("signature 2", portableFDPAddress, signature, address);
    // need to get userStat.address from login, which is not available here, we still need to login first into fairOS to get it for what we need username password
    let resp = await window.walletLogin(portableFDPAddress, signature);
    var userStat = await window.userStat(resp.sessionId);
    var hash = await window.getNameHash(resp.sessionId, portableFDPAddress);

    var loginObj = {
      user: resp.user,
      sessionId: resp.sessionId,
      address: userStat.address,
      portableAddress: portableFDPAddress,
      nameHash: hash.namehash,
    };
    setLogin(loginObj);
    if (loginObj.address.toString() !== loginObj.portableAddress.toString()) {
      notification.error({
        message: loginObj.user + " Mapping invalid",
        description: loginObj.address + " INVALID " + loginObj.portableAddress,
      });
    }

    console.log("loginWithWallet", loginObj);
    setIsLoginVisible(false);
    notification.info({
      message: loginObj.user + " Logged In",
      description: "Logged " + loginObj.address + " -> in through wallet " + address,
    });

    setSessionId(loginObj.sessionId);
    await PodList(loginObj.sessionId);
  }
  async function PodList(sessionId) {
    setIsPodLoading(true);
    let resp2 = await window.podList(sessionId);
    console.log("podList", resp2);
    setPodList(resp2);
    setIsPodLoading(false);
    setFairOSPods(resp2.pods);
  }

  async function ListPod(podName) {
    //console.log("podStat", login, podName);
    setIsPodLoading(true);
    try {
      let podStat = await window.podStat(login.sessionId, podName);
      console.log("podStat", login.sessionId, podName, podOpen, podStat);

      setSelectedPodAddress(podStat.address);
      setSelectedPodName(podName);
      setIsListingVisible(true);
    } catch (e) {}

    setIsPodLoading(false);
  }
  const listSubTx = useCallback(async (fdpSellerNameHash, data, price, category, podAddress) => {
    try {
      var dataLocation = await uploadDataToBee(JSON.stringify(data), "application/json", Date.now() + ".sub.json");
      console.log("dataLocation", dataLocation);
      var newTx = await tx(
        writeContracts.SwarmMail.listSub(
          "0x" + fdpSellerNameHash,
          "0x" + dataLocation,
          price,
          category,
          "0x" + podAddress,
          {
            value: listingFee,
          },
        ),
      );
      await newTx.wait();
      setIsListingVisible(false);
      notification.info({
        message: "Listing completed",
        description: "Listing " + dataLocation,
      });
    } catch (e) {
      console.log(e);
      notification.error({
        message: "Error listing subscription",
        description: "You can only list one subscription for a pod.",
      });
    }
  });
  /// getNameHash(address)
  /// encryptedKeyLocation = encryptSubscription (sessionId: string, podName: string, subscriberNameHash: string): Promise<reference>
  /// podName: string, subscriberNameHash: string
  ///
  /// openSubscribedPodFromReference (sessionId: string, reference: string, sellerNameHash: string): Promise<string>
  /// getSubscriptions (sessionId: string, start: number, limit: number): Promise<subscriptions>
  /// decrypt(contents(encryptedKeyLocation), buyerNameHash)

  /// getSubscribablePodInfo - get pod info for a pod that is subscribable

  return (
    // <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
    <>
      {/* <Button onClick={() => ConnectFairOS()}>Connect</Button> */}
      {/* {!isLoginVisible && login != null && <Button onClick={() => Logout()}>Logout FairOS</Button>} */}
      {/* {!isLoginVisible && login == null && ( */}
      <Button type="primary" onClick={() => OpenFairOSDialog()}>
        FairOS
      </Button>
      {/* )} */}

      {/* Main FairOS dialog */}
      {isFairOSVisible && (
        <Modal
          title={<h3>FairOS </h3>}
          footer={null}
          maskClosable={false}
          visible={isFairOSVisible}
          onCancel={() => setIsFairOSVisible(false)}
        >
          {login != null && (
            <>
              {isPodLoading ? (
                <>
                  <Spin />
                  &nbsp;&nbsp;Please wait...
                </>
              ) : (
                <>
                  {podList.pods.length > 0 && (
                    <>
                      List your pod to sell subscriptions to it.
                      <h3>Available Pods</h3>
                      <ul>
                        {podList.pods.map((pod, index) => (
                          <li className="podItem" key={pod + "_" + index} onClick={() => ListPod(pod)}>
                            {pod}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <br />
                  <Button type="primary" onClick={() => Logout()}>
                    Sign out FairOS
                  </Button>

                  {/* <br />
                  <br />
                  <h4>Shared Pods</h4>
                  <ul>
                    {podList.sharedPods.map((pod, index) => (
                      <li>{pod}</li>
                    ))}
                  </ul> */}
                </>
              )}
            </>
          )}

          {portableAddress != null && login === null && (
            <>
              <p>
                {/* {portableAddress} */}
                Smail detected you are connected with your wallet to your portable FDP account. You can now sign in.
              </p>
              <br />
              <Tooltip title={"Portable Account Address " + portableAddress}>
                <Button type="primary" onClick={() => LoginWithWallet()}>
                  Sign-in with wallet
                </Button>
              </Tooltip>
              <br /> <br />
              <hr />
            </>
          )}

          {login == null && (
            <>
              <br />
              <h3>Connect Portable account</h3>
              <p>
                Log into FairOS with username and password. You can then connect your wallet with your portable FDP
                account and later <strong>Sign in with wallet</strong>. This step is required if you want to use
                portable account and FairOS in Smail.
              </p>
              <br />
              <Button onClick={() => OpenLoginDialog()}>Login</Button> <br />
            </>
          )}
          <br />
        </Modal>
      )}

      {/* Intermediate step to wait for TX to map portable address to FairOS address */}
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
                //defaultValue={username}
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </Form.Item>
            <Form.Item name="password" label="Password">
              <Input
                //defaultValue={password}
                placeholder="password"
                value={password}
                type="password"
                onChange={e => setPassword(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Login to FairOS
              </Button>
              &nbsp;
              {/* <Button onClick={() => LoginWithWallet()}>Login with provider</Button> */}
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

      {isListingVisible && (
        <>
          <Modal
            title={
              <h3>
                List Pod <strong>{selectedPodName}</strong>
              </h3>
            }
            footer={null}
            maskClosable={false}
            visible={isListingVisible}
            onCancel={() => setIsListingVisible(false)}
          >
            <ListPodModalForm
              podName={selectedPodName}
              podAddress={selectedPodAddress}
              sellerNameHash={login.nameHash}
              onListPod={listSubTx}
              categories={[
                { label: "Business", value: "0xda4fd9fa774c576c08e67dcb6bb94d647b4bc97f62502f1e2b62c2ba20f879cc" },
              ]}
            />
          </Modal>
        </>
      )}
    </>
    // </div>
  );
}

function ListPodModalForm({ podName, podAddress, sellerNameHash, categories, onListPod }) {
  // const formRef = React.createRef();
  const onSendListPod = async values => {
    //listSub(values);
    //console.log("onSend", values);
    var data = {
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl,
      category: values.category,
      price: values.price,
      podAddress: podAddress,
      podName: podName,
      sellerNameHash: sellerNameHash,
    };
    console.log("onSendListPod", data);
    await onListPod(data.sellerNameHash, data, data.price, data.category, data.podAddress);
  };
  const onListSubCategoryChange = value => {
    console.log("onCategoryChange", value);
  };
  const required = [{ required: true }];

  return (
    <Form {...layouts.layout} onFinish={onSendListPod}>
      <Form.Item name="title" label="Title" rules={required}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Description" rules={required}>
        <Input.TextArea maxLength={1024} rows={3} autosize={{ minRows: "3", maxRows: "5" }} />
      </Form.Item>
      <Form.Item name="imageUrl" label="Image">
        <Input />
      </Form.Item>
      <Form.Item name="price" label="Price" rules={required}>
        <Input />
      </Form.Item>
      <Form.Item name="category" label="Category" rules={required}>
        <Select onChange={onListSubCategoryChange} options={categories} />
      </Form.Item>
      {/* <Form.Item name="fdpSellerNameHash" label="FDP NameHash">
        <Input defaultValue={sellerNameHash} value={sellerNameHash} />
      </Form.Item>
      <Form.Item name="podName" label="Pod name">
        <Input defaultValue={podName} value={podName} />
      </Form.Item>
      <Form.Item name="podAddress" label="Pod Address">
        <Input defaultValue={podAddress} value={podAddress} />
      </Form.Item> */}
      <Button
        type="primary"
        htmlType="submit"
        style={{ width: "80%", borderRadius: "5px", alignItems: "center", left: "10%" }}
      >
        LIST POD
      </Button>
    </Form>
  );
}
