import { Button, Col, Menu, Row, Modal, Spin, Layout, Tooltip } from "antd";
const { Header, Content, Sider } = Layout;

import "antd/dist/antd.css";
import { useContractLoader, useGasPrice, useUserProviderAndSigner } from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
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

import { Home } from "./views/Home";
import { Inbox } from "./views/Inbox";
import { Marketplace } from "./views/Marketplace";
import { ComposeNewMessage } from "./views/ComposeNewMessage";
import { SubRequests } from "./views/SubRequests";
import { SubBids } from "./views/SubBids";
import { Subscribers } from "./views/Subscribers";

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
  const networkOptions = [
    "localhost",
    "mainnet",
    "sapphire",
    "xdai",
    "arbitrum",
    "optimism",
    "matic",
    "avalanche",
    "harmony",
    "goerli",
    "testnetSapphire",
    //"rinkeby",
  ];
  const BEENETWORKS = {
    "gateway bee": {
      name: "gateway",
      downloadUrl: "https://gateway.fairdatasociety.org/bzz/",
      uploadUrl: "https://gateway.fairdatasociety.org/proxy",
    },
    "local bee": {
      name: "localhost",
      downloadUrl: "http://localhost:1635/bzz/",
      uploadUrl: "http://localhost:1635/proxy",
    },
  };
  const beeNetworkOptions = ["gateway bee", "local bee"];

  const { currentTheme } = useThemeSwitcher();
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [selectedBeeNetwork, _setSelectedBeeNetwork] = useState(beeNetworkOptions[0]);
  const setSelectedBeeNetwork = beeNetwork => {
    console.log("setSelectedBeeNetwork", beeNetwork, BEENETWORKS[beeNetwork]);
    // TODO set proper params to bee.js here
    _setSelectedBeeNetwork(beeNetwork);
  };
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [smailMail, setSmailMail] = useState({ key: null, smail: null }); // this has to be defined
  const [replyTo, _setReplyTo] = useState("");
  const [isModalVisible, _setIsModalVisible] = useState(false);
  const location = useLocation();

  const setReplyTo = replyTo => {
    _setReplyTo(replyTo);
    setIsModalVisible(true);
  };
  const setIsModalVisible = visible => {
    console.log(visible);
    _setIsModalVisible(visible);
  };
  const composeNewMail = () => {
    console.log("compose");
    setReplyTo("");
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
  const gasPrice = useGasPrice(targetNetwork, "fast", 25000);
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
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

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
    }
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

  useEffect(() => {
    console.log("Address changed to: ", address);
    setSmailMail({ key: null, smail: null }); // this has to be defined
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

  // if(true) return <div></div>

  return (
    <div className="App">
      <Layout style={{ minHeight: "100vh" }}>
        <Sider theme={currentTheme} style={{ position: "fixed", height: "100vh", left: 0, top: 0, bottom: 0 }}>
          <AppHeader />
          {/* collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)} */}
          {/* <div style={{ height: 32, margin: 16, background: "rgba(255, 255, 255, 0.2)" }}/> */}
          <Button style={{ marginLeft: "24px" }} onClick={() => composeNewMail(!isModalVisible)}>
            Compose
          </Button>
          <Menu
            mode="inline"
            style={{ textAlign: "left", height: "100%", borderRight: 0 }}
            selectedKeys={[location.pathname]}
          >
            <Menu.Item key="/">
              <Link to="/">{smailMail.key === null || smailMail.smail == null ? <>Register</> : <>Home</>}</Link>
            </Menu.Item>

            <Menu.Item key="/inbox">
              <Tooltip title="View received messages" placement="right">
                <Link to="/inbox">Inbox</Link>
              </Tooltip>
            </Menu.Item>

            <Menu.Item key="/marketplace">
              <Tooltip title="View offers, open new listings" placement="right">
                <Link to="/marketplace">Marketplace</Link>
              </Tooltip>
            </Menu.Item>
            <Menu.Item key="/requests">
              <Tooltip title="Approve bid requests for your listings" placement="right">
                <Link to="/requests">Requests</Link>
              </Tooltip>
            </Menu.Item>
            <Menu.Item key="/subscribers">
              <Tooltip title="Manage listings, view subscribers and earnings" placement="right">
                <Link to="/subscribers">Subscribers</Link>
              </Tooltip>
            </Menu.Item>
            <Menu.Item key="/bids:bidRequestHash">
              <Tooltip title="Manage your active bids" placement="right">
                <Link to="/bids">Your bids</Link>
              </Tooltip>
            </Menu.Item>

            {smailMail.key && smailMail.smail ? (
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
            <Menu.Item key="/swarmmail">
              <Link to="/swarmmail">Contract</Link>
            </Menu.Item>
            <Menu.Item key="/smailmailkey" disabled>
              <Tooltip title="Registration status">
                {smailMail.key ? "wallet" : "no key"}&nbsp;
                {smailMail.smail ? "bonded" : "no bond"}
              </Tooltip>
            </Menu.Item>
            <Menu.Item key="/add">
              <Tooltip title={<Balance address={address} provider={localProvider} price={price} />}>
                <span>⬨</span>
              </Tooltip>
              {address ? <AddressSimple address={address} ensProvider={mainnetProvider} /> : "Connecting..."}
            </Menu.Item>
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
                  smailMail={smailMail}
                  setSmailMail={setSmailMail}
                />
              </Route>
              <Route exact path="/inbox">
                <Inbox
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  messageCount={messageCount}
                  smailMail={smailMail}
                  setReplyTo={setReplyTo}
                />
              </Route>
              <Route exact path="/marketplace">
                <Marketplace
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  mainnetProvider={mainnetProvider}
                  userSigner={userSigner}
                  tx={tx}
                  address={address}
                  smailMail={smailMail}
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

              <Route exact path="/swarmmail">
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
            </Switch>
          </Content>
        </Layout>
      </Layout>

      {isModalVisible && (
        // <Modal
        //   title={<h2>New Message</h2>}
        //   visible={isModalVisible}
        //   footer={null}
        //   onOk={() => {
        //     setIsModalVisible(false);
        //   }}
        //   onCancel={() => {
        //     setIsModalVisible(false);
        //   }}
        // >
        <ComposeNewMessage
          readContracts={readContracts}
          writeContracts={writeContracts}
          ensProvider={mainnetProvider}
          address={address}
          modalControl={setIsModalVisible}
          tx={tx}
          onMessageSent={onMessageSent}
          smailMail={smailMail}
          recipient={replyTo}
        />
        // </Modal>
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

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ marginRight: 20, display: "block" }}>
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
          <NetworkDisplay
            NETWORKCHECK={NETWORKCHECK}
            localChainId={localChainId}
            selectedChainId={selectedChainId}
            targetNetwork={targetNetwork}
          />
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
  );
}

export default App;
