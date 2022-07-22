import React from "react";
import { Link } from "react-router-dom";
// import ReactMarkdown from 'react-markdown';

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

// before finger today south flavor gossip loyal domain badge supply silent shallow

/**
 * web3 props can be passed from '../App.jsx' into your local view component for use
 * @param {*} yourLocalBalance balance on current network
 * @param {*} readContracts contracts from current chain already pre-loaded using ethers contract module. More here https://docs.ethers.io/v5/api/contract/contract/
 * @returns react component
 */
function Home({ yourLocalBalance, readContracts }) {
  // you can also use hooks locally in your component of choice
  // in this case, let's keep track of 'purpose' variable from our contract
  //const purpose = useContractReader(readContracts, "YourContract", "purpose");

  return (
    <div style={{ margin: "auto", width: "90vw" }}>
      {/* <List grid={{ gutter: 100, row: 10, column: 10 }}  style={{ verticalAlign: "top", display: "inline-block" }} > */}
      <Row gutter={16} type="flex">
        <Col span={12}>
          <Link to="/requests">
            <Card hoverable title="Submit Review Request">
              <h2>Eligible projects</h2>
              Owners of green energy production devices
              <ul>
                <li>Photovoltaic power station</li>
                <li>Wind power generation</li>
                <li>Hydrogen electrolysers</li>
              </ul>
              <Card.Meta title="Request a project review" description="Have a project that could get COP Tokens ?" />
            </Card>
          </Link>
        </Col>
        <Col span={12}>
          <Link to="/registryofapprovedandfinalized">
            <Card hoverable title="Registry of Requests Reviewed">
              <h2>Registry of reviewed and finalized requests</h2>
              Projects, information, procedures
              <ul>
                <li>Review procedure completed</li>
                <li>Finalization procedure completed</li>
                <li>Review Approval And Finalization Validators</li>
              </ul>
              <Card.Meta title="View Registry of Requests" description="Public registry of all reviewed requests" />
            </Card>
          </Link>
        </Col>
        <Col span={12}>
          <Link to="/registry">
            <Card hoverable title="Registry">
              <h2>Registry of projects</h2>
              Projects, information, procedures
              <ul>
                <li>Review procedure</li>
                <li>Review Amounts</li>
                <li>Challenge validators</li>
              </ul>
              <Card.Meta title="View Registry of projects" description="Public registry of all projects" />
            </Card>
          </Link>
        </Col>
        <Col span={12}>
          <Link to="requestsreview">
            <Card hoverable title="Reviewers">
              <h2>Application reviewer</h2>

              <ul>
                <li>Validate project data</li>
                <li>Review Projects</li>
                <li>Approve acceptance</li>
                <li>Reject or Finalize Application</li>
              </ul>
              <Card.Meta title="For reviewers" description="View requests for projects" />
            </Card>
          </Link>
        </Col>
        <Col span={12}>
          <Link to="validators">
            <Card hoverable title="Validators">
              <h2>Apply to become a validator</h2>
              <ul>
                <li>KYC Validators</li>
                <li>Investment Validators</li>
                <li>Manufacturer Validators</li>
                <li>Production Validators</li>
              </ul>
              <Card.Meta title="For validators" description="View tasks for validators" />
            </Card>
          </Link>
        </Col>
        <Col span={24}>
          <Link to="pool">
            <Card hoverable title="Pool">
              {/* <h2>Where are tokens</h2> */}
              <Card.Meta title="Allocation" description="View where are tokens allocated" />
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
}

export default Home;
