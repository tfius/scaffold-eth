import React, { useCallback, useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import {
  Button,
  List,
  Card,
  Descriptions,
  Divider,
  Drawer,
  InputNumber,
  Modal,
  notification,
  Row,
  Col,
  Select,
  Space,
  Tooltip,
  Typography,
  Input,
} from "antd";
const { Meta } = Card;

function Registry({ writeContracts, readContracts }) {
  //const purpose = useContractReader(readContracts, "YourContract", "purpose");

  return (
    <div style={{ margin: "auto", width: "70vw" }}>
      {/* <List grid={{ gutter: 100, row: 10, column: 10 }}  style={{ verticalAlign: "top", display: "inline-block" }} > */}
      <Row gutter={16} style={{ height: "22px" }} type="flex">
        <Col span={24}>
          <Card hoverable title="Registry">
            <Card.Meta title="Browse Registry" description="Public registry of projects" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Registry;

/*
<Input
placeholder={props.placeholder ? props.placeholder : "amount in " + mode}
autoFocus={props.autoFocus}
prefix={mode === "USD" ? "$" : "Ξ"}
value={display}
addonAfter={
  !props.price ? (
    ""
  ) : (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (mode === "USD") {
          setMode("ETH");
          setDisplay(currentValue);
        } else {
          setMode("USD");
          if (currentValue) {
            const usdValue = "" + (parseFloat(currentValue) * props.price).toFixed(2);
            setDisplay(usdValue);
          } else {
            setDisplay(currentValue);
          }
        }
      }}
    >
      {mode === "USD" ? "USD 🔀" : "ETH 🔀"}
    </div>
  )
}
onChange={async e => {
  const newValue = e.target.value;
  if (mode === "USD") {
    const possibleNewValue = parseFloat(newValue);
    if (possibleNewValue) {
      const ethValue = possibleNewValue / props.price;
      setValue(ethValue);
      if (typeof props.onChange === "function") {
        props.onChange(ethValue);
      }
      setDisplay(newValue);
    } else {
      setDisplay(newValue);
    }
  } else {
    setValue(newValue);
    if (typeof props.onChange === "function") {
      props.onChange(newValue);
    }
    setDisplay(newValue);
  }
}}
/>*/
