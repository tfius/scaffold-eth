import React, { useCallback, useState, useEffect } from "react";
import { downloadDataFromBee } from "../Swarm/BeeService";
import * as layouts from "./layouts.js";
import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import EtherInput from "../components/EtherInput";
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
  Form,
} from "antd";
const { Meta } = Card;

function ViewIssuanceProcedureStatusForAddress({ readContracts, address }) {
  const [validationProcedure, setValidationProcedure] = useState({ amountApproved: null, amountIssued: null });

  const updateApprovedAndFinalizedRequests = useCallback(async address => {
    var checkValidationProcedure = await readContracts.COPIssuer.getValidationProcedure(address);
    console.log("ViewValidationProcedureStatusForAddress", checkValidationProcedure);
    setValidationProcedure(checkValidationProcedure);
  }, []);

  useEffect(() => {
    updateApprovedAndFinalizedRequests(address);
  }, [address]);

  useEffect(() => {}, [validationProcedure]);

  return (
    <Card title="Issuance Process">
      <Card.Meta
        title="Validation Procedure Status"
        description={
          <>
            KYC: {validationProcedure.kyc === true ? "Passed" : "Waiting"} <br />
            Investor: {validationProcedure.investor ? "Passed" : "Waiting"} <br />
            Manufacturer: {validationProcedure.manufacturer ? "Passed" : "Waiting"} <br />
            Production: {validationProcedure.production ? "Passed" : "Waiting"} <br />
            Amount Approved: {validationProcedure.amountApproved?.toString()} <br />
            Amount Issued: {validationProcedure.amountIssued?.toString()} <br />
          </>
        }
      />
    </Card>
  );
}

export default ViewIssuanceProcedureStatusForAddress;
