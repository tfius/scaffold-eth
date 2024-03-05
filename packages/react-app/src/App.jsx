import { Button, Col, Menu, Row, Modal, Spin, Layout, Tooltip, Form } from "antd";
const { Header, Content, Sider } = Layout;

import "antd/dist/antd.css";
import { useContractLoader, useGasPrice, useUserProviderAndSigner } from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, BrowserRouter as Router, Route, Switch, useLocation } from "react-router-dom";
import { useThemeSwitcher } from "react-css-theme-switcher";

import "./App.css";

import {
  Account,
  Contract,
  Faucet,
  Balance,
  GasGauge,
  Header as AppHeader,
  Ramp,
  ThemeSwitch,
  FaucetHint,
  NetworkSwitch,
  AddressSimple,
  NetworkDisplay,
  BeeNetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";

import * as consts from "./views/consts";
import { Home } from "./views/Home";
import { About } from "./views/About";
import { Help } from "./views/Help";
import { Inbox } from "./views/Inbox";
import { Locker } from "./views/Locker";
import { EmailsSent } from "./views/EmailsSent";
import { EmailsReceived } from "./views/EmailsReceived";
import { Threads } from "./views/Threads";

import { DataHub } from "./views/DataHub";
import { ComposeNewMessage } from "./views/ComposeNewMessage";
import { ComposeNewThread } from "./views/ComposeNewThread";
import { ComposeNewPost } from "./views/ComposeNewPost";
import { SubRequests } from "./views/SubRequests";
import { SubBids } from "./views/SubBids";
import { Subscribers } from "./views/Subscribers";
import { Subscriptions } from "./views/Subscriptions";
import { Calendar } from "./views/Calendar";
import { Scheduler } from "./views/Scheduler";
import { SocialGraph } from "./socyomat/SocialGraph";
import { FairOSWasmConnect } from "./views/FairOSWasmConnect";
import { FairOSStoreFileTo } from "./views/FairOSStoreFileTo";
import { Notarization } from "./views/Notarization";
import FairOSBrowser from "./views/FairOSBrowser";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)
//const targetNetwork = NETWORKS.goerli;
//const targetNetwork = NETWORKS.zkdatafund;

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  /*"https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",*/
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

window.setIsLoading = null;
window.isLoading = false;
function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  // const networkOptions = [
  //   "localhost", // 0
  //   "mainnet", // 1
  //   "sapphire", // 2
  //   "xdai", // 3
  //   "arbitrum", // 4
  //   "optimism", // 5
  //   "matic", // 6
  //   "avalanche", // 7
  //   "harmony", // 8
  //   "goerli", // 9
  //   "testnetSapphire", // 10
  //   "rinkeby",
  // ];
  const networkOptions = [
    "localhost", // 9
    "zkdatafund", // 9
    "goerli", // 9
    "polygonzkevmtestnet", //
    "sepolia",
  ];
  const BEENETWORKS = {
    "gateway bee": {
      name: "gateway",
      endpoint: "https://bee-1.fairdatasociety.org",
      downloadUrl: "https://gateway.fairdatasociety.org/bzz/",
      uploadUrl: "https://gateway.fairdatasociety.org/proxy",
      fairOsRpc: "https://sepolia.dev.fairdatasociety.org",
      beeRpc: "https://xdai.dev.fairdatasociety.org/",
    },
    "local bee": {
      name: "localhost",
      endpoint: "http://localhost:1633",
      downloadUrl: "http://localhost:1633/bzz/",
      uploadUrl: "http://localhost:1633/proxy",
      fairOsRpc: "https://sepolia.dev.fairdatasociety.org",
      beeRpc: "https://xdai.fairdatasociety.org/",
    },
  };
  const beeNetworkOptions = ["gateway bee", "local bee"];

  const { currentTheme } = useThemeSwitcher();
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, _setSelectedNetwork] = useState(networkOptions[0]); // 9 goerli
  const setSelectedNetwork = network => {
    console.log("setSelectedNetwork", network);
    _setSelectedNetwork(network);
  };

  const [batchId, setBatchId] = useState(consts.emptyBatchId);
  const [selectedBeeNetwork, _setSelectedBeeNetwork] = useState(beeNetworkOptions[0]);

  const setSelectedBeeNetwork = beeNetwork => {
    console.log("setSelectedBeeNetwork", beeNetwork, BEENETWORKS[beeNetwork]);
    // TODO set proper params to bee.js here
    _setSelectedBeeNetwork(beeNetwork);
  };
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [smailMail, setSmailMail] = useState({ pubKey: null, keyLocation: null, smailPrivateKey: null }); // this has to be defined
  const [replyTo, _setReplyTo] = useState(""); // in mails, threads
  const [subject, _setSubject] = useState(""); // in threads
  const [isOneWay, setIsOneWay] = useState(true);
  const [isComposeModalVisible, _setIsComposeModalVisible] = useState(false);
  const [isComposeThreadModalVisible, _setIsComposeThreadModalVisible] = useState(false);
  const [isComposePostModalVisible, _setIsComposePostModalVisible] = useState(false);

  const [isStoreFileToFairOSModalVisible, _setIsStoreFileToFairOSModalVisible] = useState(false);
  const [fairOSFileObject, setFairOSFileObject] = useState(null);

  const [fairOSPods, setFairOSPods] = useState([]);
  const [fairOSSessionId, setFairOSSessionId] = useState(null);
  const [fairOSLogin, setFairOSLogin] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const location = useLocation();

  const setIsStoreFileToFairOSModalVisible = (visible, fairOSFileObject) => {
    console.log(visible);
    setFairOSFileObject(fairOSFileObject); /*{ path, type, uint8array }*/
    _setIsStoreFileToFairOSModalVisible(visible);
  };

  const setIsComposePostModalVisible = visible => {
    console.log(visible);
    _setIsComposePostModalVisible(visible);
  };

  const setIsComposeThreadModalVisible = visible => {
    console.log(visible);
    _setIsComposeThreadModalVisible(visible);
  };
  const setThreadTo = (threadToAddress, subject) => {
    _setReplyTo(threadToAddress);
    _setSubject(subject);
    setIsComposeThreadModalVisible(true);
    console.log("setThreadTo", threadToAddress, subject);
  };

  const setReplyTo = (replyToAddress, isOneWay, subject) => {
    setIsOneWay(isOneWay);
    _setReplyTo(replyToAddress);
    if (subject !== undefined) _setSubject(subject);
    setIsComposeModalVisible(true);
  };
  const setIsComposeModalVisible = visible => {
    console.log(visible);
    _setIsComposeModalVisible(visible);
  };
  const composeNewMail = () => {
    console.log("compose");
    setReplyTo("", true);
  };

  /// 📡 What chain are your contracts deployed to?
  const targetNetwork = NETWORKS[selectedNetwork]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);
  if (DEBUG) console.log(`Using ${selectedBeeNetwork} bee location`);

  // 🛰 providers
  //if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider, 60000);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "average", 45000);
  //const gasPrice = 1;
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  /*
  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);
*/
  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  // const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // TODO solve this issue (userContractLoader is not working on zkdatafund)
  //if had do this since readContracts were not retrieved from zkdatafund (unknown reason)
  const readContracts = writeContracts;

  /*
  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });


  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "Carbon", "purpose");
*/

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    window.setIsLoading = setIsLoading;
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      //      yourLocalBalance &&
      //      yourMainnetBalance &&
      readContracts &&
      //      mainnetContracts &&
      writeContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      //      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      //      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      //      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      //      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);

      loadDataHubData(address);
    }
    setFairOSPods([]);
    setFairOSSessionId(null);
    setFairOSLogin(null);
    setSmailMail({ pubKey: null, keyLocation: null, smailPrivateKey: null });
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    //yourLocalBalance,
    //yourMainnetBalance,
    readContracts,
    writeContracts,
    //mainnetContracts,
  ]);

  const loadDataHubData = useCallback(
    async forAddress => {
      if (address === undefined) return;
      if (readContracts === undefined) return;
      if (readContracts.DataHub === undefined) return;
      const activeBids = await readContracts.DataHub.getActiveBids(forAddress);
      const listedSubs = await readContracts.DataHub.getListedSubs(forAddress); // listed subscribers
      const subItems = await readContracts.DataHub.getAllSubItems(forAddress); // sub items
      const subRequests = await readContracts.DataHub.getSubRequests(forAddress); // sub requests
      console.log("loadDataHubData", forAddress, activeBids, listedSubs, subItems, subRequests);
    },
    [address, readContracts],
  );

  useEffect(() => {
    console.log("Address changed to: ", address);
    setSmailMail({ pubKey: null, keyLocation: null, smailPrivateKey: null }); // this has to be defined
  }, [address]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
    //automatically connect if it is a safe app
    // const checkSafeApp = async () => {
    //   if (await web3Modal.isSafeApp()) {
    //     loadWeb3Modal();
    //   }
    // };
    //checkSafeApp();
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  // ping back to inbox / outbox to update the messages
  const onMessageSent = async (message, recipient) => {
    await new Promise(resolve => setTimeout(resolve, 10000));
    setMessageCount(messageCount + 1);
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //   FAIROS WASM STUFF
  //   from https://github.com/fairDataSociety/fairos-client-examples/blob/wasm.0/wasm-hello-world/src/App.tsx
  //   types https://github.com/asabya/scaffold-eth/blob/35eabe678331aa061265057a85f58ff92d746940/packages/react-app/src/react-app-env.d.ts
  //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // wallet connect
  // list pods

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //{ pubKey: null, keyLocation: null, smailPrivateKey: null }
  // if(true) return <div></div>
  const isBonded = smailMail.smailPrivateKey !== null;
  const isFairOsed = fairOSSessionId !== null;
  return (
    // <Router>
    <div className="App">
      <Layout style={{ minHeight: "100vh" }}>
        <Sider theme={currentTheme} style={{ position: "fixed", height: "100vh", left: 0, top: 0, bottom: 0 }}>
          <>
            <AppHeader />
            <NetworkDisplay
              NETWORKCHECK={NETWORKCHECK}
              localChainId={localChainId}
              selectedChainId={selectedChainId}
              targetNetwork={targetNetwork}
            />
          </>
          {/* collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)} */}
          {/* <div style={{ height: 32, margin: 16, background: "rgba(255, 255, 255, 0.2)" }}/> */}
          <Button style={{ marginLeft: "24px", width: "10rem" }} onClick={() => composeNewMail(!isComposeModalVisible)}>
            Compose
          </Button>
          <Menu
            mode="inline"
            style={{ textAlign: "left", height: "100%", borderRight: 0 }}
            selectedKeys={[location.pathname]}
          >
            <Menu.Item key="/feed">
              <Tooltip title="Social interaction network">
                <Link to="/feed">Feed</Link>
              </Tooltip>
            </Menu.Item>

            <Menu.SubMenu key="comspace" title="Comspace" inlineCollapsed mode="inline">
              <Menu.Item key="/">
                <Tooltip
                  title={
                    <>
                      Registration:&nbsp;
                      {smailMail.pubKey ? "wallet" : "no key"}&nbsp;
                      {smailMail.smailPrivateKey ? "bonded" : "no bond"}
                    </>
                  }
                >
                  <Link to="/">
                    {smailMail.pubKey === null || smailMail.smailPrivateKey == null ? <>Register</> : <>Home</>}
                  </Link>
                </Tooltip>
              </Menu.Item>

              <Menu.Item key="/inbox">
                <Tooltip title="View one way messages" placement="right">
                  <Link to="/inbox">Incoming</Link>
                </Tooltip>
              </Menu.Item>
              <Menu.Item key="/received" disabled={!isBonded}>
                <Tooltip title="View received messages" placement="right">
                  <Link to="/received">Inbox</Link>
                </Tooltip>
              </Menu.Item>
              <Menu.Item key="/sent" disabled={!isBonded}>
                <Tooltip title="View sent messages" placement="right">
                  <Link to="/sent">Sent</Link>
                </Tooltip>
              </Menu.Item>
              <Menu.Item key="/threads" disabled={!isBonded}>
                <Tooltip title="View threads" placement="right">
                  <Link to="/threads">Threads</Link>
                </Tooltip>
              </Menu.Item>
            </Menu.SubMenu>

            <Menu.SubMenu key="workspace" title="Productivity" inlineCollapsed mode="inline" disabled={!isBonded}>
              <Menu.Item key="/locker" disabled={!isBonded}>
                <Tooltip title="Encrypt and store your data" placement="right">
                  <Link to="/locker">Locker</Link>
                </Tooltip>
              </Menu.Item>
              <Menu.Item key="/notarization" disabled={!isBonded}>
                <Tooltip title="Document Notarization" placement="right">
                  <Link to="/notarization">Notarization</Link>
                </Tooltip>
              </Menu.Item>

              <Menu.Item key="/calendar" disabled={!isBonded}>
                <Tooltip title="View calendar" placement="right">
                  <Link to="/calendar">Calendar</Link>
                </Tooltip>
              </Menu.Item>
              <Menu.Item key="/scheduler" disabled={!isBonded}>
                <Tooltip
                  title="Schedule events at other addresses and manage your scheduler settings"
                  placement="right"
                >
                  <Link to="/scheduler">Scheduler</Link>
                </Tooltip>
              </Menu.Item>
              <Menu.Item key="/tasks" disabled={!isBonded}>
                <Tooltip title="Issue tasks to service providers." placement="right">
                  <Link to="/tasks">AI Tasks</Link>
                </Tooltip>
              </Menu.Item>
            </Menu.SubMenu>
            {/* <>
              <Menu.Item key="/smailmailkey" disabled>
                <Tooltip title="Registration status">
                  console.log("smailMail", smailMail)
                  {smailMail.pubKey ? "wallet" : "no key"}&nbsp;
                  {smailMail.smailPrivateKey ? "bonded" : "no bond"}
                </Tooltip>
              </Menu.Item>
            </> */}

            {/* {fairOSSessionId != null && <Menu.Divider />} */}
            <Menu.Divider />
            <Menu.SubMenu key="submenuDatahub" title="Fairdrive" inlineCollapsed mode="inline">
              {web3Modal && web3Modal?.cachedProvider && (
                <Menu.Item key="/fairOS">
                  <FairOSWasmConnect
                    selectedBeeNetwork={selectedBeeNetwork}
                    targetNetwork={targetNetwork}
                    BEENETWORKS={BEENETWORKS}
                    batchId={batchId}
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    userSigner={userSigner}
                    tx={tx}
                    address={address}
                    messageCount={messageCount}
                    provider={localProvider}
                    smailMail={smailMail}
                    setSmailMail={setSmailMail}
                    //FairOSPods={fairOSPods}
                    setFairOSPods={setFairOSPods}
                    setFairOSSessionId={setFairOSSessionId}
                    setFairOSLogin={setFairOSLogin}
                    isWalletConnected={web3Modal && web3Modal?.cachedProvider}
                  />
                </Menu.Item>
              )}

              <>
                <Menu.Item key="/fairosbrowser" disabled={fairOSLogin === null}>
                  <Tooltip title="Browse your FairOS data" placement="right">
                    <Link to="/fairosbrowser">Browse</Link>
                  </Tooltip>
                </Menu.Item>
                <Menu.Item key="/datahub" disabled={!isFairOsed}>
                  <Tooltip title="View offers, open new listings" placement="right">
                    <Link to="/datahub">Market</Link>
                  </Tooltip>
                </Menu.Item>
                <Menu.Item key="/subscriptions" disabled={!isFairOsed}>
                  <Tooltip title="Manage your active listings and subscribers" placement="right">
                    <Link to="/subscriptions">Subscriptions</Link>
                  </Tooltip>
                </Menu.Item>
                <Menu.Item key="/requests" disabled={!isFairOsed}>
                  <Tooltip title="Approve requests for your listings" placement="right">
                    <Link to="/requests">Requests</Link>
                  </Tooltip>
                </Menu.Item>
                <Menu.Item key="/subscribers" disabled={!isFairOsed}>
                  <Tooltip title="Manage listings, view subscribers and earnings" placement="right">
                    <Link to="/subscribers">Subscribers</Link>
                  </Tooltip>
                </Menu.Item>
                <Menu.Item key="/bids" disabled={!isFairOsed}>
                  <Tooltip title="Manage your active bids" placement="right">
                    <Link to="/bids">Bids</Link>
                  </Tooltip>
                </Menu.Item>
                <Menu.Divider />
              </>

              {smailMail.pubKey && smailMail.smailPrivateKey ? (
                <>
                  {/* /////////////////////////////////////////////////
                /////////////////////////////////////////////////
                // all debug */}
                  {/* <Menu.Item key="/sent">
                  <Link to="/sent">Sent</Link>
                </Menu.Item>
                <Menu.Item key="/contacts">
                  <Link to="/contacts">Contacts</Link>
                </Menu.Item> */}
                </>
              ) : (
                <></>
                // <Menu.Item key="/connect">
                //   <Link to="/">Connect</Link>
                // </Menu.Item>
              )}
            </Menu.SubMenu>

            <Menu.Item key="/account">
              <Account
                minimized
                address={address}
                localProvider={localProvider}
                userSigner={userSigner}
                mainnetProvider={mainnetProvider}
                price={price}
                web3Modal={web3Modal}
                loadWeb3Modal={loadWeb3Modal}
                logoutOfWeb3Modal={logoutOfWeb3Modal}
                blockExplorer={blockExplorer}
              />
            </Menu.Item>
            <Menu.Item key="/add">
              <Tooltip title={<Balance address={address} provider={localProvider} price={price} />}>
                <span>⬨</span>
              </Tooltip>
              {address ? <AddressSimple address={address} ensProvider={mainnetProvider} /> : "Connecting..."}
            </Menu.Item>

            {/* <Menu.Divider /> */}
            <Menu.SubMenu key="submenuContracts" title="Contracts" inlineCollapsed mode="inline">
              <Menu.Item key="/swarmmailcontract">
                <Link to="/swarmmailcontract">SMail</Link>
              </Menu.Item>
              <Menu.Item key="/datahubcontract">
                <Link to="/datahubcontract">DataHub</Link>
              </Menu.Item>
              <Menu.Item key="/calendarcontract">
                <Link to="/calendarcontract">Calendar</Link>
              </Menu.Item>
              <Menu.Item key="/schedulercontract">
                <Link to="/schedulercontract">Scheduler</Link>
              </Menu.Item>
              <Menu.Item key="/taskbrokercontract">
                <Link to="/taskbrokercontract">TaskBroker</Link>
              </Menu.Item>
              <Menu.Item key="/socialgraphcontract">
                <Link to="/socialgraphcontract">SocialGraph</Link>
              </Menu.Item>
              <Menu.Item key="/datarelaycontract">
                <Link to="/datarelaycontract">DataRelayService</Link>
              </Menu.Item>
              <Menu.Item key="/documentnotarizationcontract">
                <Link to="/documentnotarizationcontract">DocumentNotarization</Link>
              </Menu.Item>
            </Menu.SubMenu>
            {/* </SubMenu> */}
          </Menu>
          {/* <Balance address={address} provider={localProvider} price={price} /> */}
        </Sider>
        <Layout style={{ padding: "0px 0px 0px 0px", marginLeft: 200 }}>
          <Content
            style={{
              padding: 0,
              margin: 0,
              minHeight: 280,
              width: "100%",
              overflow: "initial",
              // background: "#000000",
            }}
          >
            <Switch>
              <Route exact path="/">
                <Home
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  provider={localProvider}
                  web3Modal={web3Modal}
                  smailMail={smailMail}
                  setSmailMail={setSmailMail}
                />
              </Route>
              <Route exact path="/about">
                <About
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  provider={localProvider}
                  web3Modal={web3Modal}
                  smailMail={smailMail}
                  setSmailMail={setSmailMail}
                />
              </Route>
              <Route path="/inbox">
                <Inbox
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  smailMail={smailMail}
                  setReplyTo={setReplyTo}
                  mainnetProvider={mainnetProvider}
                  onStoreToFairOS={setIsStoreFileToFairOSModalVisible}
                />
              </Route>
              <Route path="/sent">
                <EmailsSent
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  smailMail={smailMail}
                  setReplyTo={setReplyTo}
                  mainnetProvider={mainnetProvider}
                  onStoreToFairOS={setIsStoreFileToFairOSModalVisible}
                />
              </Route>
              <Route path="/received">
                <EmailsReceived
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  smailMail={smailMail}
                  setReplyTo={setReplyTo}
                  mainnetProvider={mainnetProvider}
                  onStoreToFairOS={setIsStoreFileToFairOSModalVisible}
                />
              </Route>
              <Route path="/locker">
                <Locker
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  smailMail={smailMail}
                  mainnetProvider={mainnetProvider}
                  onStoreToFairOS={setIsStoreFileToFairOSModalVisible}
                />
              </Route>
              <Route path="/threads">
                <Threads
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  smailMail={smailMail}
                  mainnetProvider={mainnetProvider}
                  onStoreToFairOS={setIsStoreFileToFairOSModalVisible}
                />
              </Route>
              <Route
                path="/calendar/:address?/:day?"
                children={props => (
                  <Calendar
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    userSigner={userSigner}
                    tx={tx}
                    address={address}
                    messageCount={messageCount}
                    smailMail={smailMail}
                    mainnetProvider={mainnetProvider}
                  />
                )}
              />
              <Route
                path="/scheduler/:address?/:day?"
                children={props => (
                  <Scheduler
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    userSigner={userSigner}
                    tx={tx}
                    address={address}
                    messageCount={messageCount}
                    smailMail={smailMail}
                    mainnetProvider={mainnetProvider}
                  />
                )}
              />
              <Route
                path="/tasks/:address?/:service?/:task?"
                children={props => (
                  <>
                    {/* <Scheduler
                     readContracts={readContracts}
                     writeContracts={writeContracts}
                     userSigner={userSigner}
                     tx={tx}
                     address={address}
                     messageCount={messageCount}
                     smailMail={smailMail}
                     mainnetProvider={mainnetProvider}
                   /> */}
                  </>
                )}
              />
              <Route
                path="/notarization/:address?/:document?"
                children={props => (
                  <Notarization
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    userSigner={userSigner}
                    tx={tx}
                    address={address}
                    messageCount={messageCount}
                    smailMail={smailMail}
                    mainnetProvider={mainnetProvider}
                  />
                )}
              />
              <Route
                path="/feed"
                children={props => (
                  <SocialGraph
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    userSigner={userSigner}
                    tx={tx}
                    address={address}
                    messageCount={messageCount}
                    smailMail={smailMail}
                    mainnetProvider={mainnetProvider}
                    setReplyTo={setReplyTo}
                    setThreadTo={setThreadTo}
                    setComposePost={setIsComposePostModalVisible}
                  />
                )}
              />

              <Route
                exact
                path="/fairosbrowser"
                children={props => (
                  <FairOSBrowser
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    mainnetProvider={mainnetProvider}
                    userSigner={userSigner}
                    tx={tx}
                    address={address}
                    smailMail={smailMail}
                    fairOSLogin={fairOSLogin}
                    fairOSPods={fairOSPods}
                  />
                )}
              />
              <Route
                path="/datahub/:cat?/:sub?"
                children={props => (
                  <DataHub
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    mainnetProvider={mainnetProvider}
                    userSigner={userSigner}
                    tx={tx}
                    address={address}
                    smailMail={smailMail}
                    fairOSLogin={fairOSLogin}
                  />
                )}
              />

              <Route exact path="/subscriptions">
                <Subscriptions
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  mainnetProvider={mainnetProvider}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  smailMail={smailMail}
                  setReplyTo={setReplyTo}
                />
              </Route>
              <Route exact path="/requests">
                <SubRequests
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  mainnetProvider={mainnetProvider}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  smailMail={smailMail}
                  sessionId={fairOSSessionId}
                />
              </Route>
              <Route exact path="/subscribers">
                <Subscribers
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  mainnetProvider={mainnetProvider}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  smailMail={smailMail}
                />
              </Route>
              <Route exact path="/bids">
                <SubBids
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  mainnetProvider={mainnetProvider}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  smailMail={smailMail}
                />
              </Route>

              <Route exact path="/swarmmailcontract">
                <Contract
                  name="SwarmMail"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
              <Route exact path="/datahubcontract">
                <Contract
                  name="DataHub"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
              <Route exact path="/calendarcontract">
                <Contract
                  name="Calendar"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
              <Route exact path="/schedulercontract">
                <Contract
                  name="Scheduler"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
              <Route exact path="/taskbrokeragecontract">
                <Contract
                  name="TaskBrokerage"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>

              <Route exact path="/taskbrokercontract">
                <Contract
                  name="TaskBroker"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
              <Route exact path="/socialgraphcontract">
                <Contract
                  name="SocialGraph"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
              <Route exact path="/datarelaycontract">
                <Contract
                  name="DataRelayService"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
              <Route exact path="/documentnotarizationcontract">
                <Contract
                  name="DocumentNotarization"
                  price={price}
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                  messageCount={messageCount}
                />
              </Route>
            </Switch>
          </Content>
        </Layout>
      </Layout>

      {isComposeModalVisible && (
        <ComposeNewMessage
          readContracts={readContracts}
          writeContracts={writeContracts}
          ensProvider={mainnetProvider}
          address={address}
          modalControl={setIsComposeModalVisible}
          tx={tx}
          onMessageSent={onMessageSent}
          smailMail={smailMail}
          recipient={replyTo}
          isOneWay={isOneWay}
          subject={subject}
        />
      )}
      {isComposeThreadModalVisible && (
        <ComposeNewThread
          readContracts={readContracts}
          writeContracts={writeContracts}
          ensProvider={mainnetProvider}
          address={address}
          modalControl={setIsComposeThreadModalVisible}
          tx={tx}
          onMessageSent={onMessageSent}
          smailMail={smailMail}
          recipient={replyTo}
          subject={subject}
        />
      )}
      {isComposePostModalVisible && (
        <ComposeNewPost
          readContracts={readContracts}
          writeContracts={writeContracts}
          ensProvider={mainnetProvider}
          address={address}
          modalControl={setIsComposePostModalVisible}
          tx={tx}
          onMessageSent={onMessageSent}
          smailMail={smailMail}
          recipient={replyTo}
          subject={subject}
        />
      )}
      {isStoreFileToFairOSModalVisible && (
        <FairOSStoreFileTo
          smailMail={smailMail}
          fairOSLogin={fairOSLogin}
          fairOSPods={fairOSPods}
          modalControl={setIsStoreFileToFairOSModalVisible}
          fairOSFileObject={fairOSFileObject}
        />
      )}

      {/* ✏️ Edit the header and change the title to your project name */}
      {/* <AppHeader />
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
      />
      <Menu style={{ textAlign: "center" }} selectedKeys={[location.pathname]} mode="horizontal">
        <Menu.Item key="/">
          <Link to="/">Home</Link>
        </Menu.Item>
        <Menu.Item key="/swarmmail">
          <Link to="/swarmmail">SwarmMail</Link>
        </Menu.Item>
      </Menu> */}

      {/* <Footer>Footer</Footer> */}

      <div style={{ position: "fixed", left: "50%", top: "2%" }}>{isLoading && <Spin size="64" />}</div>

      <ThemeSwitch />
      <div className="main fade-in" style={{ position: "fixed", right: 8, bottom: 40 }}>
        <Button onClick={() => setShowHelp(!showHelp)}>?</Button>
      </div>
      <>{showHelp && <Help onClose={setShowHelp} />}</>

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ marginRight: 20, display: "block" }}>
            {/* <NetworkDisplay
              NETWORKCHECK={NETWORKCHECK}
              localChainId={localChainId}
              selectedChainId={selectedChainId}
              targetNetwork={targetNetwork}
            /> */}
            <NetworkSwitch
              networkOptions={networkOptions}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
            />
            <BeeNetworkSwitch
              networkOptions={beeNetworkOptions}
              selectedNetwork={selectedBeeNetwork}
              setSelectedNetwork={setSelectedBeeNetwork}
            />
          </div>

          {/* <Account
            address={address}
            localProvider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          /> */}
        </div>
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <>
        <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
          {/* <Row align="middle" gutter={[4, 4]}>
            <Col span={8}>
              <Ramp price={price} address={address} networks={NETWORKS} />
            </Col>
            <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
              <GasGauge gasPrice={gasPrice} />
            </Col>
            <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
              <Button
                onClick={() => {
                  window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
                }}
                size="large"
                shape="round"
              >
                <span style={{ marginRight: 8 }} role="img" aria-label="support">
                  💬
                </span>
                Support
              </Button>
            </Col>
          </Row> */}

          <Row align="middle" gutter={[4, 4]}>
            <Col span={24}>
              {
                /*  if the local provider has a signer, let's show the faucet:  */
                faucetAvailable ? (
                  <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
                ) : (
                  ""
                )
              }
            </Col>
          </Row>
        </div>
      </>
    </div>
    // </Router>
  );
}

export default App;
