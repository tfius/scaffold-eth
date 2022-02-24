import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import { SendOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useState } from "react";
import { Select, Button, Card, Col, Input, List, Menu, Row, InputNumber } from "antd";
import { ethers, BigNumber } from "ethers";
import SwarmLocationInput from "./SwarmLocationInput";
import * as helpers from "./helpers";
import { EtherInput, BalanceShort } from "../components";
import { set } from "store";

export default function Farm(props) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [dmBalance, setDmBalance] = useState(BigNumber.from(0));
  const [dmAllowance, setDmAllowance] = useState(BigNumber.from(0));
  const [goldinarBalance, setGoldinarBalance] = useState(BigNumber.from(0));
  const [stakingBalance, setStakingBalance] = useState(BigNumber.from(0));
  const [yieldBalance, setYieldBalance] = useState(BigNumber.from(0));
  const [stakeAmount, setStakeAmount] = useState(BigNumber.from(0));
  const [isStaking, setIsStaking] = useState(false);

  const [sellAmount, setSellAmount] = useState(BigNumber.from(0));
  const [buyAmount, setBuyAmount] = useState(BigNumber.from(0));

  const [collectionName, setCollectionName] = useState();
  const [collectionSymbol, setCollectionSymbol] = useState();

  //const balance = useContractReader(readContracts, DataMarket, "balanceOf", [address]);
  const formattedBalanceIn = stakeAmount ? parseFloat(ethers.utils.formatUnits(stakeAmount, 18)).toPrecision(6) : null;
  const harvestBalance = yieldBalance ? parseFloat(ethers.utils.formatUnits(yieldBalance, 18)).toPrecision(6) : null;

  const buyBalance = buyAmount ? parseFloat(ethers.utils.formatUnits(buyAmount, 18)).toPrecision(6) : null;
  const sellBalance = sellAmount ? parseFloat(ethers.utils.formatUnits(sellAmount, 18)).toPrecision(6) : null;

  const { selectedCollection, writeContracts, readContracts, address, gasPrice, tx, localProvider, price } = props;
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 5000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  const updateBalance = useCallback(async () => {
    if (readContracts === undefined) return;
    if (readContracts.DataMarket === undefined) return;

    var balanceDM = await readContracts.DataMarket.balanceOf(address);
    setDmBalance(balanceDM);
    //console.log("DM", balanceDM);

    var allowanceDM = await readContracts.DataMarket.allowance(address, readContracts.GoldinarFarm.address);
    setDmAllowance(allowanceDM);
    //console.log("allowanceDM", allowanceDM);

    var balance = await readContracts.Goldinar.balanceOf(address);
    setGoldinarBalance(balance);
    //console.log("DNAR", balance);

    var userIsStaking = await readContracts.GoldinarFarm.isStaking(address);
    setIsStaking(userIsStaking);
    //console.log("isStaking", userIsStaking);

    var sBalance = await readContracts.GoldinarFarm.stakingBalance(address);
    setStakingBalance(sBalance);
    //console.log("sBalance", sBalance);

    var yieldBalance = await readContracts.GoldinarFarm.calculateYieldTotal(address);
    setYieldBalance(yieldBalance);
    //console.log("yieldBalance", yieldBalance);
  });

  const updateYieldBalance = useCallback(async () => {
    if (readContracts === undefined) return;
    if (readContracts.DataMarket === undefined) return;

    var yieldBalance = await readContracts.GoldinarFarm.calculateYieldTotal(address);
    setYieldBalance(yieldBalance);
    //console.log("yieldBalance", yieldBalance);
  });

  useEffect(() => {
    updateBalance();
  }, [readContracts, seconds]);

  useEffect(() => {
    updateYieldBalance();
  }, [seconds]);

  return (
    <div>
      <div style={{ maxWidth: 800, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.2 }}>
        Balance <strong> {ethers.utils.formatEther(goldinarBalance)}</strong> Goldinars
        {isStaking ? (
          <List
            style={{
              display: "flex",
              verticalAlign: "top",
              width: "100%",
              alignContent: "center",
              textAlign: "center",
            }}
          >
            <h1>Farming</h1>
            <Card style={{ display: "inline-block", width: "400px" }}>
              <h1>Earned</h1>
              <h3>{harvestBalance} Goldinars</h3>
              <Button
                type={"primary"}
                onClick={() => {
                  tx(writeContracts.GoldinarFarm.withdrawYield());
                }}
              >
                Harvest
              </Button>
            </Card>

            <Card style={{ display: "inline-block", width: "400px" }}>
              <h1>Deposited</h1>
              <h3>{ethers.utils.formatEther(stakingBalance)} DMs</h3>
              <Button
                type={"primary"}
                onClick={() => {
                  tx(writeContracts.GoldinarFarm.unstake());
                }}
              >
                Unstake
              </Button>
            </Card>
          </List>
        ) : null}
        {dmBalance.toString() !== "0" ? (
          <Card style={{ width: "800px" }}>
            <h1>Stake your DMs to earn Goldinars</h1>
            <div style={{ textAlign: "right", paddingRight: "6%" }}>
              <strong
                onClick={() => {
                  setStakeAmount(dmBalance);
                }}
              >
                {" "}
                {ethers.utils.formatEther(dmBalance)}{" "}
              </strong>{" "}
              DMs <br />
            </div>
            <Input
              style={{ width: "80%" }}
              min={0}
              size="large"
              value={stakeAmount}
              onChange={e => {
                try {
                  setStakeAmount(BigNumber.from(e.target.value));
                } catch (e) {
                  console.log(e);
                }
              }}
            />

            {dmAllowance.lt(stakeAmount) ? (
              <Button
                type={"primary"}
                onClick={() => {
                  tx(writeContracts.DataMarket.approve(readContracts.GoldinarFarm.address, stakeAmount));
                }}
              >
                Approve
              </Button>
            ) : (
              <Button
                type={"primary"}
                onClick={() => {
                  //debugger;
                  tx(writeContracts.GoldinarFarm.stake(stakeAmount));
                }}
              >
                Stake
              </Button>
            )}
            <br />
            <div style={{ textAlign: "left", paddingLeft: "7.5%" }}>{formattedBalanceIn}</div>
          </Card>
        ) : null}
        <br />
        <h1>Exchange</h1>
        <List>
          <Card style={{ display: "inline-block", width: "400px" }}>
            <h1>Sell</h1>
            <div style={{ textAlign: "right", paddingRight: "10%" }}>
              <strong
                onClick={() => {
                  setSellAmount(dmBalance);
                }}
              >
                {" "}
                {ethers.utils.formatEther(dmBalance)}{" "}
              </strong>{" "}
              DMs <br />
            </div>
            <Input
              style={{ width: "80%" }}
              min={0}
              size="large"
              value={sellAmount}
              onChange={e => {
                try {
                  setSellAmount(BigNumber.from(e.target.value));
                } catch (e) {
                  console.log(e);
                }
              }}
            />

            <Button
              type={"primary"}
              onClick={() => {
                tx(writeContracts.DataMarket.sell(sellAmount));
              }}
            >
              &nbsp;&nbsp;&nbsp;&nbsp;Sell&nbsp;&nbsp;&nbsp;&nbsp;
            </Button>
            <br />
            <div style={{ textAlign: "center" }}>{sellBalance}</div>
          </Card>

          <Card style={{ display: "inline-block",  width: "400px" }}>
            <h1>Buy</h1>
            <div style={{ textAlign: "right", paddingRight: "10%" }}> 
              <strong>
                <BalanceShort address={address} provider={localProvider} price={price} onClickSet={setBuyAmount}/> 
              </strong>{" "} 
              <br />
            </div>
            <Input
              style={{ width: "80%" }}
              min={0}
              size="large"
              value={buyAmount}
              onChange={e => {
                try {
                  setBuyAmount(BigNumber.from(e.target.value));
                } catch (e) {
                  console.log(e);
                }
              }}
            />

            <Button
              type={"primary"}
              onClick={() => {
                var metadata = {};
                metadata.value = buyAmount;
                metadata.gasPrice = gasPrice;

                tx(writeContracts.DataMarket.buy(metadata));
              }}
            >
              &nbsp;&nbsp;&nbsp;&nbsp;Buy&nbsp;&nbsp;&nbsp;&nbsp;
            </Button>
            <br />
            <div style={{ textAlign: "center" }}>{buyBalance}</div>
          </Card>

          
        </List>
        <br/>
        <p>0.05% Fees go to tresury</p>
      </div>

      {/* <div style={{ maxWidth: 820, margin: "auto", marginTop: 16, paddingBottom: 16 }}>
          <Card>
            <List
              bordered
              dataSource={dmCollections}
              renderItem={(item, index) => {
                return (
                  <div style={{ fontSize: 5, marginRight: 8 }}>
                    {index}:{item}
                  </div>
                );
                console.log("Collections (TODO) metadata collect", item);
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
                    <Select.Option key={collection} value={index}>
                      {index}: {collection}
                    </Select.Option>
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
                //debugger;
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
    </div>
  );
}
