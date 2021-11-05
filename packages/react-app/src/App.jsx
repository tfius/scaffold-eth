import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Alert, Button, Card, Col, Input, List, Menu, Row } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Address, AddressInput, Contract, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";

import { useContractConfig } from "./hooks";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";
import { SendOutlined } from "@ant-design/icons";
import Balance from "./components/Balance";
import { Select } from "antd";

//import SwarmLocationInput from "./parts/SwarmLocationInput.jsx";
import DataMinter from "./parts/DataMinter.jsx";
import TeamsMinter from "./parts/TeamsMinter.jsx";
import MembershipMinter from "./parts/MembershipMinter.jsx";
import SponsorshipMinter from "./parts/SponsorshipMinter.jsx";
import AllegianceMinter from "./parts/AllegianceMinter.jsx";
import ContractABIs from "./contracts/hardhat_contracts.json";

//const { ethers } = require("ethers");
import { ethers } from "ethers";
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
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

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID
// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "dark", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, _options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});



function App(props) {
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : scaffoldEthProvider && scaffoldEthProvider._network
      ? scaffoldEthProvider
      : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

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
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);
  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
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
  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);
  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);
  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);
  const contractConfig = useContractConfig();
  //console.log("contractConfig", contractConfig);
  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);
  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);
  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(localProvider, () => {
    console.log(`⛓ A new rinkeby block is here: ${localProvider._lastBlockNumber}`);
    updateLoogieTanks();
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const dmBalance = useContractReader(readContracts, "DataMarket", "balanceOf", [address]);
  //console.log("DM balance:", dmBalance.toString());
  const dmnftBalance = useContractReader(readContracts, "NFTCollection", "balanceOf", [address]);
  //console.log("DMNFT balance:", dmnftBalance.toString());
  const dmCollections = useContractReader(readContracts, "DataMarket", "collectionGetAll", []);

  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  const yourDmBalance = dmBalance && dmBalance.toNumber && dmBalance.toNumber();
  const [yourDMs, setYourDMs] = useState();
  const yourDmNftBalance = dmnftBalance && dmnftBalance.toNumber && dmnftBalance.toNumber();
  const [yourDmNfts, setYourDmNfts] = useState();
  const [selectedCollection, setSelectedCollection] = useState(0);
  const [collectionInformation, setCollectionInformation] = useState({
    name: "Default Name",
    description: "Default description",
    data: "additional data",
    creator: "Creator Description",
  });

  // 📟 Listen for broadcast events
  const dmTransferEvents = useEventListener(readContracts, "DataMarket", "Transfer", localProvider, 1);
  //console.log("DM Transfer events:", dmTransferEvents);

  const dmNftTransferEvents = useEventListener(readContracts, "NFTCollection", "Transfer", localProvider, 1);
  //console.log("DMNFT Transfer events:", dmNftTransferEvents);
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // keep track of a variable from the contract in the local React state:
  const loogieBalance = useContractReader(readContracts, "Loogies", "balanceOf", [address]);
  //console.log("🤗 loogie balance:", loogieBalance);
  const loogieTankBalance = useContractReader(readContracts, "LoogieTank", "balanceOf", [address]);
  //console.log("🤗 loogie tank balance:", loogieTankBalance);
  // 📟 Listen for broadcast events
  const loogieTransferEvents = useEventListener(readContracts, "Loogies", "Transfer", localProvider, 1);
  //console.log("📟 Loogie Transfer events:", loogieTransferEvents);
  const loogieTankTransferEvents = useEventListener(readContracts, "LoogieTank", "Transfer", localProvider, 1);
  //console.log("📟 Loogie Tank Transfer events:", loogieTankTransferEvents);
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  const yourLoogieBalance = loogieBalance && loogieBalance.toNumber && loogieBalance.toNumber();
  const [yourLoogies, setYourLoogies] = useState();
  const yourLoogieTankBalance = loogieTankBalance && loogieTankBalance.toNumber && loogieTankBalance.toNumber();
  const [yourLoogieTanks, setYourLoogieTanks] = useState();

  async function updateLoogieTanks() {
    const loogieTankUpdate = [];
    for (let tokenIndex = 0; tokenIndex < yourLoogieTankBalance; tokenIndex++) {
      try {
        //console.log("tank Getting token index", tokenIndex);
        const tokenId = await readContracts.LoogieTank.tokenOfOwnerByIndex(address, tokenIndex);
        //console.log("tank tokenId", tokenId);
        const tokenURI = await readContracts.LoogieTank.tokenURI(tokenId);
        //console.log("tank tokenURI", tokenURI);
        const jsonManifestString = atob(tokenURI.substring(29));
        //console.log("tank jsonManifestString", jsonManifestString);

        try {
          const jsonManifest = JSON.parse(jsonManifestString);
          //console.log("tank jsonManifest", jsonManifest);
          loogieTankUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
        } catch (e) {
          console.log(e);
        }
      } catch (e) {
        console.log(e);
      }
    }
    setYourLoogieTanks(loogieTankUpdate.reverse());
  }

  useEffect(() => {
    const updateYourCollectibles = async () => {
      const loogieUpdate = [];
      for (let tokenIndex = 0; tokenIndex < yourLoogieBalance; tokenIndex++) {
        try {
          console.log("loggie Getting token index", tokenIndex);
          const tokenId = await readContracts.Loogies.tokenOfOwnerByIndex(address, tokenIndex);
          console.log("loggie tokenId", tokenId);
          const tokenURI = await readContracts.Loogies.tokenURI(tokenId);
          console.log("loggie tokenURI", tokenURI);
          const jsonManifestString = atob(tokenURI.substring(29));
          console.log("loggie jsonManifestString", jsonManifestString);
          /*
          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          console.log("ipfsHash", ipfsHash);
          const jsonManifestBuffer = await getFromIPFS(ipfsHash);
        */
          try {
            const jsonManifest = JSON.parse(jsonManifestString);
            console.log(" loggie jsonManifest", jsonManifest);
            loogieUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourLoogies(loogieUpdate.reverse());
      updateLoogieTanks();
    };
    updateYourCollectibles();
  }, [address, yourLoogieBalance, yourLoogieTankBalance]);

  /*useEffect(() => {
    const updateDmCollections = async () => {
      const loogieUpdate = [];
      for (let i = 0; i < dmCollections.length; i++) {
          console.log("collection", i, dmCollections[i]);
      }
      //updateLoogieTanks();
    };
    updateDmCollections();
  }, [dmCollections]);*/

  useEffect(() => {
    const updateYourNFTs = async () => {
      const listDmNfts = [];
      console.log("yourDmNftBalance", yourDmNftBalance);
      for (let tokenIndex = 0; tokenIndex < yourDmNftBalance; tokenIndex++) {
        try {
          console.log("dmNft Getting token index", tokenIndex);
          const tokenId = await readContracts.NFTCollection.tokenOfOwnerByIndex(address, tokenIndex);
          console.log("dmNft tokenId", tokenId);
          const tokenURI = JSON.parse(await readContracts.NFTCollection.tokenURI(tokenId));
          console.log("dmNft tokenURI", tokenURI);
          try {
            listDmNfts.push({ id: tokenId, data: tokenURI, owner: address });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourDmNfts(listDmNfts.reverse());
    };
    updateYourNFTs();
  }, [address, yourDmBalance, yourDmNftBalance]);

  useEffect(() => {
    const updateSelectedCollections = async () => {
      // create balances for all collections length 
      /*if (dmnftBalances.length != dmCollections.length) {
        dmnftBalances = Array.apply(null, Array(dmCollections.length)).map(function (x, i) {
          return 0;
        });
      }*/

      /*
      //WARNING THIS MIGHT NOT WORK 
      if (selectedCollection != 0) {
        const contracts = findPropertyInObject("contracts", contractConfig.deployedContracts);

        const newContractName = "NFTCollection" + selectedCollection; // contractConfig.deployedContracts[31337].localhost.
        // only if not already added 
        if (!contracts.hasOwnProperty(newContractName)) {
          const clone = Object.assign({}, contracts.NFTCollection); // clone object
          clone.address = dmCollections[selectedCollection]; // replace address
          contracts[newContractName] = clone; // will be reread from contractconfig
          //dmnftBalances[selectedCollection] = useContractReader(readContracts, newContractName, "balanceOf", [address]);
          console.log("selectedCollection", selectedCollection, newNFTCollection); 
        }
      }*/

      setCollectionInformation({
        name: "Name " + selectedCollection,
        description: "Description can be long or short as long as its UTF-8 string",
        data: "other data and information to be displayed to end user",
        creator: "Creator Generator" + selectedCollection, 
      });

      //console.log("creating balances ", dmnftBalances.length)
    };
    updateSelectedCollections();
  }, [selectedCollection]);

  /*
  useEffect(() => {
    const updateCollections = async () => {
      setSelectedCollection(0);
    };
    updateCollections();
  }, [dmCollections]);*/

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);

                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

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
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId === 31337 &&
    yourLocalBalance &&
    ethers.utils.formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            faucetTx({
              to: address,
              value: ethers.utils.parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }

  const [transferToAddresses, setTransferToAddresses] = useState({});
  const [transferToTankId, setTransferToTankId] = useState({});

  const [visibleTransfer, setVisibleTransfer] = useState({});
  const [metadataAddresses, setMetadataAddresses] = useState({});
  const [locationAddresses, setLocationAddresses] = useState({});

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      {networkDisplay}
      <BrowserRouter>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/loogies">
            <Link
              onClick={() => {
                setRoute("/loogies");
              }}
              to="/loogies"
            >
              Loogies
            </Link>
          </Menu.Item>
          <Menu.Item key="/loogietank">
            <Link
              onClick={() => {
                setRoute("/loogietank");
              }}
              to="/loogietank"
            >
              Loogie Tank
            </Link>
          </Menu.Item>
          <Menu.Item key="/mintloogies">
            <Link
              onClick={() => {
                setRoute("/mintloogies");
              }}
              to="/mintloogies"
            >
              Mint Loogies
            </Link>
          </Menu.Item>
          <Menu.Item key="/mintloogietank">
            <Link
              onClick={() => {
                setRoute("/mintloogietank");
              }}
              to="/mintloogietank"
            >
              Mint Loogie Tank
            </Link>
          </Menu.Item>

          <Menu.Item key="/graphable">
            <Link
              onClick={() => {
                setRoute("/graphable");
              }}
              to="/graphable"
            >
              Graphable
            </Link>
          </Menu.Item>

          <Menu.Item key="/ex">
            <Link
              onClick={() => {
                setRoute("/ex");
              }}
              to="/ex"
            >
              Exchange
            </Link>
          </Menu.Item>
          <Menu.Item key="/dm">
            <Link
              onClick={() => {
                setRoute("/dm");
              }}
              to="/dm"
            >
              DataMarket
            </Link>
          </Menu.Item>
          <Menu.Item key="/dmnft">
            <Link
              onClick={() => {
                setRoute("/dmnft");
              }}
              to="/dmnft"
            >
              NFTCollection
            </Link>
          </Menu.Item>
        </Menu>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Home
            </Link>
          </Menu.Item>
          <Menu.Item key="/membershipminter">
            <Link
              onClick={() => {
                setRoute("/membershipminter");
              }}
              to="/membershipminter"
            >
              Membership
            </Link>
          </Menu.Item>
          <Menu.Item key="/sponsorshipminter">
            <Link
              onClick={() => {
                setRoute("/sponsorshipminter");
              }}
              to="/sponsorshipminter"
            >
              Sponsor
            </Link>
          </Menu.Item>

          <Menu.Item key="/allegianceminter">
            <Link
              onClick={() => {
                setRoute("/allegianceminter");
              }}
              to="/allegianceminter"
            >
              Allegiance
            </Link>
          </Menu.Item>

          <Menu.Item key="/teamsminter">
            <Link
              onClick={() => {
                setRoute("/teamsminter");
              }}
              to="/teamsminter"
            >
              Teams
            </Link>
          </Menu.Item>

          <Menu.Item key="/dataminter">
            <Link
              onClick={() => {
                setRoute("/dataminter");
              }}
              to="/dataminter"
            >
              DataMinter
            </Link>
          </Menu.Item>
          <Menu.Item key="/datatoken">
            <Link
              onClick={() => {
                setRoute("/datatoken");
              }}
              to="/datatoken"
            >
              DataToken
            </Link>
          </Menu.Item>
        </Menu>
        <Switch>
          <Route exact path="/loogies">
            <Contract
              name="Loogies"
              customContract={writeContracts && writeContracts.Loogies}
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>

          <Route exact path="/graphable">
            <Contract
              name="Graphable"
              customContract={writeContracts && writeContracts.Graphable}
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>

          <Route exact path="/ex">
            <Contract
              name="Exchange"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>
          <Route exact path="/dm">
            <Contract
              name="DataMarket"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>
          <Route exact path="/dmnft">
            <Contract
              name="NFTCollection"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>

          <Route exact path="/loogietank">
            <Contract
              name="LoogieTank"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>
          <Route exact path="/mintloogies">
            <div style={{ maxWidth: 820, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Button
                type={"primary"}
                onClick={() => {
                  tx(writeContracts.Loogies.mintItem());
                }}
              >
                MINT
              </Button>
            </div>
            {/* */}
            <div style={{ width: 820, margin: "auto", paddingBottom: 256 }}>
              <List
                bordered
                dataSource={yourLoogies}
                renderItem={item => {
                  const id = item.id.toNumber();

                  console.log("IMAGE", item.image);

                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 18, marginRight: 8 }}>{item.name}</span>
                          </div>
                        }
                      >
                        <img src={item.image} />
                        <div>{item.description}</div>
                      </Card>

                      <div>
                        owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            const update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            tx(writeContracts.Loogies.transferFrom(address, transferToAddresses[id], id));
                          }}
                        >
                          Transfer
                        </Button>
                        <br />
                        <br />
                        Transfer to Loogie Tank:{" "}
                        <Address
                          address={readContracts.LoogieTank.address}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <Input
                          placeholder="Tank ID"
                          // value={transferToTankId[id]}
                          onChange={newValue => {
                            console.log("newValue", newValue.target.value);
                            const update = {};
                            update[id] = newValue.target.value;
                            setTransferToTankId({ ...transferToTankId, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            console.log("transferToTankId[id]", transferToTankId[id]);
                            console.log(parseInt(transferToTankId[id]));

                            const tankIdInBytes = "0x" + parseInt(transferToTankId[id]).toString(16).padStart(64, "0");
                            console.log(tankIdInBytes);

                            tx(
                              writeContracts.Loogies["safeTransferFrom(address,address,uint256,bytes)"](
                                address,
                                readContracts.LoogieTank.address,
                                id,
                                tankIdInBytes,
                              ),
                            );
                          }}
                        >
                          Transfer
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>
            {/* */}
          </Route>
          <Route exact path="/mintloogietank">
            <div style={{ maxWidth: 820, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Button
                type={"primary"}
                onClick={() => {
                  tx(writeContracts.LoogieTank.mintItem());
                }}
              >
                MINT
              </Button>
              <Button onClick={() => updateLoogieTanks()}>Refresh</Button>
            </div>
            {/* */}

            <div style={{ width: 820, margin: "auto", paddingBottom: 256 }}>
              <List
                bordered
                dataSource={yourLoogieTanks}
                renderItem={item => {
                  const id = item.id.toNumber();

                  console.log("IMAGE", item.image);

                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 18, marginRight: 8 }}>{item.name}</span>
                          </div>
                        }
                      >
                        <img src={item.image} />
                        <div>{item.description}</div>
                      </Card>

                      <div>
                        owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            const update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            tx(writeContracts.Loogies.transferFrom(address, transferToAddresses[id], id));
                          }}
                        >
                          Transfer
                        </Button>
                        <br />
                        <br />
                        <Button
                          onClick={() => {
                            tx(writeContracts.LoogieTank.returnAllLoogies(id));
                          }}
                        >
                          Eject Loogies
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>

            {/* */}
          </Route>

          <Route exact path="/membershipminter">
            <MembershipMinter
                yourDmBalance={yourDmBalance}
                yourDmNftBalance={yourDmNftBalance}
                dmCollections={dmCollections}
                selectedCollection={selectedCollection}
                readContracts={readContracts}
                writeContracts={writeContracts}
                mainnetProvider={mainnetProvider}
                localProvider={localProvider}
                contractConfig={contractConfig}
                address={address}
                userSigner={userSigner}
                userProviderAndSigner={userProviderAndSigner}
                setSelectedCollection={setSelectedCollection}
                collectionInformation={collectionInformation}
                tx={tx}
              />
          </Route>
          <Route exact path="/sponsorshipminter">
            <SponsorshipMinter
                yourDmBalance={yourDmBalance}
                yourDmNftBalance={yourDmNftBalance}
                dmCollections={dmCollections}
                selectedCollection={selectedCollection}
                readContracts={readContracts}
                writeContracts={writeContracts}
                mainnetProvider={mainnetProvider}
                localProvider={localProvider}
                contractConfig={contractConfig}
                address={address}
                userSigner={userSigner}
                userProviderAndSigner={userProviderAndSigner}
                setSelectedCollection={setSelectedCollection}
                collectionInformation={collectionInformation}
                tx={tx}
              />
          </Route>

          <Route exact path="/teamsminter">
            <TeamsMinter
                yourDmBalance={yourDmBalance}
                yourDmNftBalance={yourDmNftBalance}
                dmCollections={dmCollections}
                selectedCollection={selectedCollection}
                readContracts={readContracts}
                writeContracts={writeContracts}
                mainnetProvider={mainnetProvider}
                localProvider={localProvider}
                contractConfig={contractConfig}
                address={address}
                userSigner={userSigner}
                userProviderAndSigner={userProviderAndSigner}
                setSelectedCollection={setSelectedCollection}
                collectionInformation={collectionInformation}
                tx={tx}
              />
          </Route>
          <Route exact path="/allegianceminter">
            <AllegianceMinter
                yourDmBalance={yourDmBalance}
                yourDmNftBalance={yourDmNftBalance}
                dmCollections={dmCollections}
                selectedCollection={selectedCollection}
                readContracts={readContracts}
                writeContracts={writeContracts}
                mainnetProvider={mainnetProvider}
                localProvider={localProvider}
                contractConfig={contractConfig}
                address={address}
                userSigner={userSigner}
                userProviderAndSigner={userProviderAndSigner}
                setSelectedCollection={setSelectedCollection}
                collectionInformation={collectionInformation}
                tx={tx}
              />
          </Route>

          <Route exact path="/dataminter">
            <DataMinter
              yourDmBalance={yourDmBalance}
              yourDmNftBalance={yourDmNftBalance}
              dmCollections={dmCollections}
              selectedCollection={selectedCollection}
              readContracts={readContracts}
              writeContracts={writeContracts}
              mainnetProvider={mainnetProvider}
              localProvider={localProvider}
              contractConfig={contractConfig}
              address={address}
              userSigner={userSigner}
              userProviderAndSigner={userProviderAndSigner}
              setSelectedCollection={setSelectedCollection}
              collectionInformation={collectionInformation}
              tx={tx}
            />
            {/* <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5 }}>
              Balance: <strong>{yourDmBalance} DM</strong> &nbsp; You have: <strong>{yourDmNftBalance} NFTs</strong>
            </div>

            <div style={{ maxWidth: 820, margin: "auto", marginTop: 16, paddingBottom: 16 }}>
              <Card>
                <List
                  bordered
                  dataSource={dmCollections}
                  renderItem={item => {
                    console.log("Collections", item);
                  }}
                ></List>
                <Select
                  showSearch
                  value={selectedCollection}
                  onChange={value => {
                    console.log(`selected ${value}`);
                    setSelectedCollection(value);
                  }}
                >
                  {dmCollections
                    ? dmCollections.map((collection, index) => (
                        <Option key={collection} value={index}>
                          {index}: {collection}
                        </Option>
                      ))
                    : null}
                </Select>
                <SwarmLocationInput
                  ensProvider={mainnetProvider}
                  placeholder="metadata location"
                  value={metadataAddresses[0]}
                  onChange={newValue => {
                    const update = {};
                    update[0] = newValue;
                    setMetadataAddresses({ ...metadataAddresses, ...update });
                  }}
                />
                <SwarmLocationInput
                  ensProvider={mainnetProvider}
                  placeholder="data location"
                  value={locationAddresses[0]}
                  onChange={newValue => {
                    const update = {};
                    update[0] = newValue;
                    setLocationAddresses({ ...locationAddresses, ...update });
                  }}
                />
                <Button
                  type={"primary"}
                  onClick={() => {
                    tx(
                      writeContracts.DataMarket.createDataToken(
                        selectedCollection,
                        address,
                        0,
                        metadataAddresses[0],
                        locationAddresses[0], //
                      ),
                    );
                  }}
                >
                  Create
                </Button>
              </Card>
            </div> */}
            {/* */}
            <div style={{ width: 820, margin: "auto", paddingBottom: 256 }}>
              <List
                bordered
                dataSource={yourDmNfts}
                renderItem={item => {
                  const id = item.id.toNumber();
                  // console.log("NFT", id);
                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        style={{ margin: 0 }}
                        title={
                          <div>
                            <div style={{ lineHeight: 0.5 }}>
                              <span style={{ fontSize: 15, marginRight: 8, marginTop: 10 }}>#{item.id.toNumber()}</span>
                              <span style={{ fontSize: 5, marginRight: 8, marginTop: 1 }}>
                                <br />
                                {item.data.creator}
                              </span>
                            </div>
                          </div>
                        }
                      >
                        <div style={{ fontSize: 6, marginRight: 8 }}>Meta:{item.data.meta}</div>
                        <div style={{ fontSize: 6, marginRight: 8 }}>Data:{item.data.data}</div>
                        <Balance address={address} provider={localProvider} price={item.data.amount} />
                        <Button
                          style={{ display: "flex", position: "relative", right: -90, bottom: -20 }}
                          onClick={e => {
                            const update = {};
                            update[id] = visibleTransfer[id] === undefined ? true : !visibleTransfer[id];
                            setVisibleTransfer({ ...setVisibleTransfer, ...update });
                          }}
                        >
                          <SendOutlined style={{ fontSize: 16 }} />
                        </Button>
                      </Card>
                      {/* 
                      <div style={{ display: "flex", position: "relative", right: -20, top: -50 }}>
                        <Button
                          onClick={e => {
                            const update = {};
                            update[id] = visibleTransfer[id] === undefined ? true : !visibleTransfer[id];
                            setVisibleTransfer({ ...setVisibleTransfer, ...update });
                          }}
                        >
                          <SendOutlined style={{ fontSize: 16 }} />
                        </Button>
                      </div> */}

                      {/* <div style={{ display: "flex", position: "relative", right: -20, top: -80 }}>
                        <div style={{ fontSize: 6, marginRight: 8 }}>Meta:{item.data.meta}</div>
                        <div style={{ fontSize: 6, marginRight: 8 }}>Data:{item.data.data}</div>
                        <br/>
                      </div> */}
                      <div style={{ display: "flex", position: "relative", right: -20, top: -50 }}>
                        {visibleTransfer[id] === true ? (
                          <div>
                            {/* owner:{" "}
                            <Address
                              address={item.owner}
                              ensProvider={mainnetProvider}
                              blockExplorer={blockExplorer}
                              fontSize={16}
                            /> */}
                            <div style={{ display: "flex" }}>
                              <AddressInput
                                ensProvider={mainnetProvider}
                                placeholder="transfer to address"
                                value={transferToAddresses[id]}
                                onChange={newValue => {
                                  const update = {};
                                  update[id] = newValue;
                                  setTransferToAddresses({ ...transferToAddresses, ...update });
                                }}
                              />
                              <Button
                                onClick={() => {
                                  console.log("writeContracts", writeContracts);
                                  //debugger;
                                  tx(writeContracts.NFTCollection.transferFrom(address, transferToAddresses[id], id));
                                }}
                              >
                                Transfer
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </List.Item>
                  );

                  /*return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 18, marginRight: 8 }}>{item.name}</span>
                          </div>
                        }
                      >
                        <img src={item.image} />
                        <div>{item.description}</div>
                      </Card>

                      <div>
                        owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            const update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            tx(writeContracts.Loogies.transferFrom(address, transferToAddresses[id], id));
                          }}
                        >
                          Transfer
                        </Button>
                        <br />
                        <br />
                        Transfer to Loogie Tank:{" "}
                        <Address
                          address={readContracts.LoogieTank.address}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <Input
                          placeholder="Tank ID"
                          // value={transferToTankId[id]}
                          onChange={newValue => {
                            console.log("newValue", newValue.target.value);
                            const update = {};
                            update[id] = newValue.target.value;
                            setTransferToTankId({ ...transferToTankId, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            console.log("transferToTankId[id]", transferToTankId[id]);
                            console.log(parseInt(transferToTankId[id]));

                            const tankIdInBytes = "0x" + parseInt(transferToTankId[id]).toString(16).padStart(64, "0");
                            console.log(tankIdInBytes);

                            tx(
                              writeContracts.Loogies["safeTransferFrom(address,address,uint256,bytes)"](
                                address,
                                readContracts.LoogieTank.address,
                                id,
                                tankIdInBytes,
                              ),
                            );
                          }}
                        >
                          Transfer
                        </Button>
                      </div>
                    </List.Item>
                  );*/
                }}
              />
            </div>
            {/* */}
          </Route>
        </Switch>
      </BrowserRouter>

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
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
        {faucetHint}
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
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
        </Row>

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
    </div>
  );
}

export default App;
