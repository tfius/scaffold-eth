import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import { SendOutlined } from "@ant-design/icons";
import React, { Children, useCallback, useEffect, useState } from "react";
import { Select, Button, Card, Col, Input, List, Menu, Row } from "antd";
import { ethers, BigNumber } from "ethers";
import * as helpers from "./helpers";
import FText from "../components/FText";

export default function TemplateMintCreatable(props) {
  const [tokenName, setTokenName] = useState("");
  const [tokenPrice, setTokenPrice] = useState(BigNumber.from(0));

  const { onCreate, address, selectedCollection, tx, title } = props;

  useEffect(() => {
    // updateBalance();
  }, [tokenName, tokenPrice]);
  //style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}
  return (
    <Card title={title}>
      <div style={{ width: "100%" }}>
        <Input
          style={{ width: "80%" }}
          min={0}
          size="large"
          value={tokenName}
          placeholder="Enter Name"
          onChange={e => {
            try {
              setTokenName(e.target.value);
            } catch (e) {
              console.log(e);
            }
          }}
        />
        <Button
          style={{ width: "20%" }}
          type={"primary"}
          onClick={() => {
            tx(onCreate(address, selectedCollection, tokenName, tokenPrice));
          }}
        >
          Create
        </Button>
      </div>

      <div style={{ width: "100%" }}>
        <Input
          style={{ width: "80%" }}
          min={0}
          size="large"
          value={tokenPrice}
          placeholder="Price for others to mint"
          onChange={e => {
            try {
              setTokenPrice(BigNumber.from(e.target.value));
            } catch (e) {
              console.log(e);
            }
          }}
        />
        <Button
          style={{ width: "20%" }}
          type={"primary"}
          disabled
          onClick={() => {
            // tx(onCreate(address, selectedCollection, tokenName, tokenPrice));
          }}
        >
          Price
        </Button>
      </div>
    </Card>
  );
}
