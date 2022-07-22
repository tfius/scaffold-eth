import React from "react";
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
} from "antd";
const { Meta } = Card;

function Pool({ writeContracts, readContracts }) {
  //const purpose = useContractReader(readContracts, "YourContract", "purpose");

  return (
    <div style={{ margin: "auto", width: "90vw" }}>
      {/* <List grid={{ gutter: 100, row: 10, column: 10 }}  style={{ verticalAlign: "top", display: "inline-block" }} > */}
      <Row gutter={16} type="flex">
        <Col span={24}>
          <Card hoverable title="Pool">
            <h2>Title</h2>
            Subtitle description
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <Card.Meta title="Meta Title" description="Meta description" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Pool;
