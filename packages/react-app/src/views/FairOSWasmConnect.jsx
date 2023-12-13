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
//import { categoriesTree, categoryList } from "./categories";
import * as layouts from "./layouts.js";
import { categoriesFlat } from "./categoriesFlat.js";

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
  setFairOSSessionId,
  isWalletConnected,
  setFairOSLogin,
}) {
  const [listingFee, setListingFee] = useState(ethers.utils.parseEther("0.0001"));

  const [isFairOSVisible, setIsFairOSVisible] = useState(false); // displays FairOS dialog
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
    return await readContracts.DataHub.getPortableAddress(forAddress);
  }

  const refreshPortableAddress = useCallback(async forAddress => {
    if (readContracts.DataHub === undefined) return null;
    var fdpAddress = await getPortableAddress(address);
    if (fdpAddress === "0x0000000000000000000000000000000000000000") fdpAddress = null;
    setPortableAddress(fdpAddress);
    console.log("on load portableAddress", fdpAddress);
    return fdpAddress;
  });

  useEffect(async () => {
    if (readContracts != undefined && address != undefined && readContracts.DataHub != undefined) {
      refreshPortableAddress(address);
      var listFee = await readContracts.DataHub.minListingFee();
      setListingFee(listFee.toString());
    }
  }, [readContracts, address]);

  async function OpenFairOSDialog() {
    refreshPortableAddress(address);
    setIsFairOSVisible(true);
    setIsLoginVisible(false);
    setIsConnectVisible(false);
  }
  async function OpenLoginDialog() {
    setIsLoginVisible(true);
    setIsConnectVisible(false);
  }

  async function Logout() {
    setLogin(null);
    setFairOSSessionId(null);
    OpenFairOSDialog();
    setPodList({ pods: [], sharedPods: [] });
    if (login.sessionId) await window.userLogout(login.sessionId);
  }

  async function ConnectFairOS() {
    const beeNet = BEENETWORKS[selectedBeeNetwork];
    // console.log("wasmConnect", selectedBeeNetwork, targetNetwork, batchId, beeNet);
    console.log("connect beeEndpoint", beeNet.endpoint);
    console.log("connect stampId", batchId);
    console.log("connect network", beeNet.fairOsRpc);
    console.log("connect subRPC", targetNetwork.rpcUrl);
    console.log("connect subAddr", readContracts.DataHub.address);

    try {
      /*
      let resp = await window.connect(
        beeNet.endpoint, // "http://localhost:1633", // bee endpoint
        batchId, //"51987f7304b419d8aa184d35d46b3cfeb1b00986ad937b3151c7ade699c81338", // stampId
        beeNet.beeRpc, //"http://localhost:9545", // rpc
        "testnet", //targetNetwork.name, //"play or testnet", // network
        targetNetwork.rpcUrl, // "http://localhost:9545", // contract.rpc
        readContracts.DataHub.address, //"0x21a59654176f2689d12E828B77a783072CD26680", // swarm mail contract address
      );*/
      let resp = await window.connect(
        beeNet.endpoint, // "http://localhost:1633", // bee endpoint
        batchId, //"51987f7304b419d8aa184d35d46b3cfeb1b00986ad937b3151c7ade699c81338", // stampId
        beeNet.fairOsRpc, //"http://localhost:9545", // rpc
        "testnet", //targetNetwork.name, //"play or testnet", // network
        targetNetwork.rpcUrl, // "http://localhost:9545", // contract.rpc
        readContracts.DataHub.address, //"0x21a59654176f2689d12E828B77a783072CD26680", // swarm mail contract address
      );

      //ConnectFairOS not enough arguments. "connect(beeEndpoint, stampId, rpc, network)" or
      //"connect(beeEndpoint, stampId, rpc, network, subRpc, subContractAddress)"

      console.log("ConnectFairOS", resp);
      setFairOS(resp);
    } catch (e) {
      console.log("ConnectFairOS", e);
    }
  }
  async function Login(values) {
    setLogin(null);
    setLoginError("");
    if (!fairOS) {
      await ConnectFairOS();
    }
    try {
      var resp = await window.login(values.username, values.password);
      //var userStat = await window.userStat(resp.sessionId);
      //var hash = await window.getNameHash(resp.sessionId, userStat.address);

      var loginObj = {
        user: resp.user,
        sessionId: resp.sessionId,
        address: resp.address,
        portableAddress: resp.address,
        nameHash: resp.nameHash,
      };

      // var loginObj = { user: resp.user, sessionId: resp.sessionId, address: userStat.address, nameHash: hash.namehash };
      setLogin(loginObj);
      console.log("Login", resp, loginObj);
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
    var newTx = await tx(writeContracts.DataHub.setPortableAddress(portableAddress));
    await newTx.wait();
  });
  async function LoginWithWallet() {
    const portableFDPAddress = await getPortableAddress(address);
    const signature = await userSigner.signMessage("Connect " + portableFDPAddress + " with " + address);

    console.log("signature 2", portableFDPAddress, signature, address);
    LoginWithSignature(portableFDPAddress, signature);
    // need to get userStat.address from login, which is not available here, we still need to login first into fairOS to get it for what we need username password
  }
  async function ConnectFairOSWithWallet() {
    var signature = null;
    try {
      signature = await userSigner.signMessage("Connect " + login.address + " with " + address);
      console.log("signature 1", login.address, signature, address);
      let resp = await window.connectWallet(username, password, login.address, signature);

      var loginObj = {
        user: resp.user,
        sessionId: resp.sessionId,
        address: resp.address,
        portableAddress: resp.portableAddress,
        nameHash: resp.nameHash,
      };
      setLogin(loginObj);

      // address expected is from userStat, but it should be from my wallet address, can fail with Signature failed to create user : wallet doesnot match portable account address
      console.log("connect wallet", resp);
      setIsConnectVisible(false);
      await SetPortableAccount();
      await LoginWithSignature(login.address, signature);
    } catch (e) {
      notification.warning({
        message: "Signature",
        description: e.toString(),
      });
      notification.error({
        message: "Failed to create signature SOC",
        description: "There was problem linking signature with your wallet.",
      });
    }
  }

  async function SetPortableAccount() {
    setIsPortableAddressVisible(true);
    var newTx = await setPortableAddressTx(address, login.address);
    setIsPortableAddressVisible(false);
    setIsConnectVisible(false);
  }

  async function LoginWithSignature(portableAddress, signature) {
    if (!fairOS) {
      await ConnectFairOS();
    }
    let resp = await window.walletLogin(portableAddress, signature);
    //var userStat = await window.userStat(resp.sessionId);
    //var hash = await window.getNameHash(resp.sessionId, portableAddress);

    var loginObj = {
      user: resp.user,
      sessionId: resp.sessionId,
      address: resp.address,
      portableAddress: portableAddress,
      nameHash: resp.nameHash,
    };
    setLogin(loginObj);
    if (loginObj.address.toString() !== loginObj.portableAddress.toString()) {
      notification.error({
        message: loginObj.user + " Mapping invalid",
        description: loginObj.address + " INVALID " + loginObj.portableAddress,
      });
    }
    setIsLoginVisible(false);

    console.log("LoginWithSignature", loginObj);
    await PodList(loginObj.sessionId);
    setFairOSLogin(loginObj);

    notification.info({
      message: loginObj.user + " Logged In",
      description: "Logged " + loginObj.address + " -> in through wallet " + address,
    });
  }

  async function PodList(sessionId) {
    setIsPodLoading(true);
    let resp2 = await window.podList(sessionId);
    console.log("podList", resp2);
    setPodList(resp2);
    setIsPodLoading(false);
    //setFairOSPods(resp2.pods);
    setFairOSPods(resp2);
    setFairOSSessionId(sessionId);
  }
  async function PodListAndBrowse(sessionId) {
    await PodList(sessionId);
    setFairOSLogin(login);
    setIsFairOSVisible(false);
    setIsConnectVisible(false);
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
  const listSubTx = useCallback(async (fdpSellerNameHash, data, price, category, podAddress, duration) => {
    try {
      var dataLocation = await uploadDataToBee(JSON.stringify(data), "application/json", Date.now() + ".sub.json");
      console.log("dataLocation", dataLocation, "sellerNameHash", fdpSellerNameHash);
      var newTx = await tx(
        writeContracts.DataHub.listSub(
          "0x" + fdpSellerNameHash,
          "0x" + dataLocation,
          price,
          category,
          "0x" + podAddress,
          duration, //30, // days to sell subscription
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
        description: "You can only list one subscription for a pod." + e.message,
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
  if (!isWalletConnected) return null;

  return (
    // <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
    <>
      <Button type="primary" style={{ width: "80%" }} onClick={() => OpenFairOSDialog()}>
        FairOS
      </Button>
      {/* )} */}

      {/* Main FairOS dialog */}
      {isFairOSVisible && (
        <Modal
          title={<h3>FairOS</h3>}
          footer={null}
          maskClosable={false}
          visible={isFairOSVisible}
          onCancel={() => setIsFairOSVisible(false)}
        >
          {isPodLoading === true && <Spin />}
          {login != null && (
            <>
              {isPodLoading ? (
                <>&nbsp;&nbsp;Please wait...</>
              ) : (
                <>
                  {podList.pods.length > 0 && (
                    <>
                      Note: Close will keep FairOS connected.
                      <br />
                      <br />
                      <h3>Available Pods</h3>
                      <ul>
                        {podList.pods.map((pod, index) => (
                          <li className="podItem" key={pod + "_" + index} onClick={() => ListPod(pod)}>
                            {pod}
                          </li>
                        ))}
                      </ul>
                      <i>Click on pod to list it on Data Hub.</i>
                      <br />
                    </>
                  )}
                  <br />
                  <Button onClick={() => Logout()}>Sign out FairOS</Button>
                  &nbsp;&nbsp;
                  <Button type="primary" onClick={() => setIsFairOSVisible(false)}>
                    Close
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
            To access <strong>{username}</strong> through DataHub a mapping <br />
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
            This does not bond your address with Datafund, only enables you to login into your FairOS account using
            signature. This connection will allow you to use your portable account with Datafund.
          </>
          <br />
          <br />
          <Button type="primary" onClick={() => ConnectFairOSWithWallet()}>
            Connect to FairOS with signature
          </Button>
          <br />
          <br />
          <Button type="primary" onClick={() => PodListAndBrowse(login.sessionId)}>
            No thanks, will connect later
          </Button>
          {isPodLoading === true && <Spin />}
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
              categories={categoriesFlat}
              // categories={[
              //   { label: "Business", value: "0xda4fd9fa774c576c08e67dcb6bb94d647b4bc97f62502f1e2b62c2ba20f879cc" },
              // ]}
            />
          </Modal>
        </>
      )}
    </>
    // </div>
  );
}

const durations = [
  // { label: "1 day", value: 1 },
  // { label: "3 days", value: 3 },
  // { label: "7 days", value: 7 },
  // { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  // { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
  // { label: "270 days", value: 270 },
  { label: "365 days", value: 365 },
];
function ListPodModalForm({ podName, podAddress, sellerNameHash, categories, onListPod }) {
  const [isPodLoading, setIsPodLoading] = useState(false);
  // const formRef = React.createRef();
  const onSendListPod = async values => {
    //listSub(values);
    //console.log("onSend", values);
    setIsPodLoading(true);
    var data = {
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl,
      category: values.category,
      price: values.price,
      podAddress: podAddress,
      podName: podName,
      sellerNameHash: sellerNameHash,
      duration: values.duration,
    };
    console.log("onSendListPod", data);
    await onListPod(data.sellerNameHash, data, data.price, data.category, data.podAddress, data.duration);
    setIsPodLoading(false);
  };
  const onListSubCategoryChange = value => {
    console.log("onCategoryChange", value);
  };
  const onListDurationChange = value => {
    console.log("onListDurationChange", value);
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

      <Form.Item name="duration" label="Duration" rules={required}>
        <Select onChange={onListDurationChange} options={durations} />
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
      {isPodLoading === false ? (
        <Button
          type="primary"
          htmlType="submit"
          style={{ width: "80%", borderRadius: "5px", alignItems: "center", left: "10%" }}
        >
          LIST POD
        </Button>
      ) : (
        <Spin />
      )}
    </Form>
  );
}
