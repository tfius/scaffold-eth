import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Progress } from "antd";
import { ethers } from "ethers";
import FText from "../components/FText";

export default function AboutThisProject(props) {
  // const chain = "XDAI";
  // const symbol = "XDai";
  // const RPC = "https://dai.poa.network";
  // const chainId = "100";
  // const blockExplorer = "https://goerli.etherscan.io/";
  // const faucet = "https://goerli-faucet.slock.it/";

  const chain = "Polygon";
  const symbol = "MATIC";
  const RPC = "https://dai.poa.network";
  const chainId = "100";
  const blockExplorer = "https://goerli.etherscan.io/";
  const faucet = "https://goerli-faucet.slock.it/";

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        marginTop: 16,
        paddingBottom: 16,
        alignItems: "left",
        textAlign: "left",
      }}
    >
      <Card title="Disclaimer">
        Resistance is highly experimental beta software. It is not ready for production use. Use at your own risk. It is
        not endorsed by any organization. Contracts are not audited. We do not guarantee the security of the contracts
        and persistance of the data.
      </Card>

      <Card title="About FDS Resistance">
        The FDS Resistance genesis NFT is a generative-style collection of unique NFTs that live on the {chain}{" "}
        blockchain. A nod to the Fair Data Society, each our tokens are created using 28 unique attributes across 4
        categories. Fair Data Society is intertwined with creative arts, and our NFT collection pays homage to our love
        of creativity while setting the stage for what's to come in the world of FDS NFTs. Resistance will be of epic
        proportions!
      </Card>

      <Card title="Setup wallet">
        You will need MetaMask to mint one of our FDS Resistance. Install the chrome extension or download the mobile
        app to get started. Please reference this article to learn how to set up MetaMask. If you are curious, other
        wallet options can be found here.
      </Card>

      <Card title="Buy">
        Our FDS Resistance will be free, but you will need to pay a small transaction fee (referred to as “gas”) to the{" "}
        {chain} network to mint the NFT. You can directly deposit to your MetaMask wallet or use a popular exchange or a
        service to acquire a small amount of {symbol}. Typically 0.1 {symbol} will be more than sufficient for gas, but
        gas can vary depending on how busy the network is.
      </Card>

      <Card title="Transfer">
        You may need to transfer {symbol} from centralized exchange to your non-custodial (eg.MetaMask) wallet. Please
        follow their guides for sending {symbol} to your wallet address (starts with “0x”). Once transferred, you will
        be ready to cover the cost of gas to mint your FDS Resistance NFT!
      </Card>

      <Card title="FAQ">
        <ul>
          <li>What is an NFT?</li>
          An NFT, or non-fungible token, is a unique, identifiable digital asset stored on the blockchain. An NFT could
          be a piece of digital artwork, a collectible, or even a digital representation of a real-life physical asset.
          Ownership of an NFT is easily and uniquely verifiable due to its public listing on the blockchain.
          <li>What does it mean to “mint” an NFT?</li>
          Minting refers to the process of tokenizing a digital file, or a digital piece of art, and publishing it on
          the blockchain. Once an NFT is minted, you can verify ownership and buy, sell, and trade the NFT.
          <li>What does the FDS Resistance NFT cost?</li>
          The FDS Resistance NFT is free to mint. However, please note that the person claiming the NFT is responsible
          for paying the gas fee required to process the transaction.
          <li>How do I set up a wallet?</li>
          Please add {chain} to your non-custodial wallet:
          <br />
          {/* <Link to="https://wiki.sovryn.app/en/getting-started/wallet-setup-videos#metamask" >Video</Link> <br/>  */}
          In Metamask click the circle in the upper right of the wallet → <strong>Settings</strong> →{" "}
          <strong>Networks</strong> → click the <strong>Add Network</strong> button and enter the following settings.{" "}
          <br />
          Network Name: <strong>{chain}</strong> <br />
          Mainnet New RPC URL: <strong>{RPC}</strong>
          <br />
          Chain ID: <strong>{chainId}</strong>
          <br />
          Currency Symbol: <strong>{symbol}</strong>
          <br />
          Block Explorer URL: <strong>{blockExplorer}</strong>
          <br />
          Faucet: <strong>{faucet}</strong>
          <li>How do I "mint" my NFT?</li>
          The NFTs will be available to mint for free (plus gas fee) on the FDS Resistance NFT website. You will simply
          be asked to connect your MetaMask wallet to the website, complete the transaction, and the NFT will then be
          transferred to that wallet.
          <li>How many FDS Resistance NFTs can I mint?</li>
          Anyone has the opportunity to FDS Resistance NFT.
          <li>How long will I have to mint my NFT?</li>
          Once the NFT drop goes live, you will have forty-eight hours to mint your NFT. Any FDS Resistance genesis NFTs
          that are not minted addresses during the forty-eight-hour mint window will be available to mint after a public
          launch.
          <li>What happens if I lose access to my Ethereum wallet/address?</li>
          The best way to prevent a lost wallet or wallet address is to make numerous physical copies of your seed
          phrase (“Secret Recovery Phrase”) and to store these copies in places you know and trust. Unfortunately, not a
          lot can be done if you’ve lost every copy of your wallet seed phrase, so please ensure to keep it safe. Never
          share your wallet seed phrase with anyone. FDS will never ask for this information.
          <li>Where can I see my NFT?</li>
          Once the NFT has been claimed (or “minted”), you will be able to see your NFT on the FDS Resistance website,
          or on other Ethereum-based NFT marketplaces. You can simply connect your digital wallet to the marketplace,
          which “signs you in,” and then browse the NFT(s) in your wallet through the marketplace’s interface.
          <li>How can I sell or trade my NFT if I want to?</li>
          If you would like to sell or trade your Resistance tokens, you can list them on Marketplace or you can list 
          the token on secondary markets or {chain}-based NFT marketplaces. Keep in mind that Resistance uses Swarm and
          DM collection has been extended to support additional usages of NFTs. You will probably not see any data on 
          third party marketplaces.
        </ul>
      </Card>
    </div>
  );
}
