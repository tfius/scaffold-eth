import React, { useCallback, useState, useEffect } from "react";
import { downloadDataFromBee } from "./../Swarm/BeeService";

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

const contractName = "COPRequestReviewRegistry";

function Registry({ writeContracts, readContracts, address, tx, localProvider }) {
  const [loading, setLoading] = useState(false);
  const [approvedAndFinalizedList, setApprovedAndFinalizedList] = useState([]);
  const [currentYear, setCurrentYear] = useState("2022");

  //const purpose = useContractReader(readContracts, "YourContract", "purpose");
  const approvedRequestsCount = useContractReader(readContracts, contractName, "getApprovedRequestCount");
  //const approvedRequests = useContractReader(readContracts, contractName, "getApprovedRequests");
  //console.log("approvedRequestsCount", approvedRequestsCount);

  const role_add_validator = useContractReader(readContracts, "COPIssuer", "ROLE_ADDVALIDATOR");
  const role_kyc_validator = useContractReader(readContracts, "COPIssuer", "ROLE_KYC_VALIDATOR");
  const role_invest_validator = useContractReader(readContracts, "COPIssuer", "ROLE_INVEST_VALIDATOR");
  const role_manufacturer_validator = useContractReader(readContracts, "COPIssuer", "ROLE_MANUFACTURER_VALIDATOR");
  const role_production_validator = useContractReader(readContracts, "COPIssuer", "ROLE_PRODUCTION_VALIDATOR");

  const getUserRoles = useCallback(async () => {});

  useEffect(() => {
    console.log(
      "roles",
      role_add_validator,
      role_kyc_validator,
      role_invest_validator,
      role_manufacturer_validator,
      role_production_validator,
    );
    if (
      role_add_validator != undefined &&
      role_kyc_validator != undefined &&
      role_invest_validator != undefined &&
      role_manufacturer_validator != undefined &&
      role_production_validator != undefined
    ) {
      getUserRoles();
    }
  }, [
    role_add_validator,
    role_kyc_validator,
    role_invest_validator,
    role_manufacturer_validator,
    role_production_validator,
  ]);

  var isAddValidator = useContractReader(readContracts, "COPIssuer", "hasRole", [role_add_validator, address]);
  var isKYCValidator = useContractReader(readContracts, "COPIssuer", "hasRole", [role_kyc_validator, address]);
  var isInvestValidator = useContractReader(readContracts, "COPIssuer", "hasRole", [role_invest_validator, address]);
  var isManufacturerValidator = useContractReader(readContracts, "COPIssuer", "hasRole", [
    role_manufacturer_validator,
    address,
  ]);
  var isProductionValidator = useContractReader(readContracts, "COPIssuer", "hasRole", [
    role_production_validator,
    address,
  ]);

  const totalIssued = useContractReader(readContracts, "COPIssuer", "totalIssued");
  const issuedPerYear = useContractReader(readContracts, "COPIssuer", "issuedPerYear", ["2022"]);
  const issuedPerYearPerAddress = useContractReader(readContracts, "COPIssuer", "perYearIssuedTokensToAddress", [
    "2022",
    address,
  ]);

  const updateApprovedAndFinalizedRequests = useCallback(async () => {
    if (approvedRequestsCount == undefined) return;
    var list = [];

    console.log("updateApprovedAndFinalizedRequests", approvedRequestsCount.toNumber());

    //var totalIssued = await readContracts.COPIssuer.totalIssued;

    for (var i = 0; i < approvedRequestsCount.toNumber(); i++) {
      var requestorAddress = await readContracts.COPRequestReviewRegistry.getApprovedRequest(i);
      //console.log("address", requestorAddress);
      var request = await readContracts.COPRequestReviewRegistry.getReviewRequest(requestorAddress);
      //console.log("request", request);
      var checkValidationProcedure = await readContracts.COPIssuer.getValidationProcedure(requestorAddress);

      var data = {};
      data.isValidationProcedureOK =
        checkValidationProcedure.kyc === true &&
        checkValidationProcedure.investor === true &&
        checkValidationProcedure.manufacturer === true &&
        checkValidationProcedure.production === true;
      data.checkValidationProcedure = checkValidationProcedure;
      data.sender = address;
      data.reviewRequest = request;

      try {
        var requestorData = await downloadDataFromBee(request.requestorDataHash);
        data.requestorData = requestorData;
      } catch (e) {
        console.error(e);
      }
      try {
        var reviewerData = await downloadDataFromBee(request.reviewerDataHash);
        data.reviewerData = reviewerData;
      } catch (e) {
        console.error(e);
      }
      try {
        var finalizerData = await downloadDataFromBee(request.finalizerDataHash);
        data.finalizerData = finalizerData;
      } catch (e) {
        console.error(e);
      }

      list.push(data); //console.log("ReviewRequest", i, d);
    }
    setApprovedAndFinalizedList(list);
    console.log("updateApprovedAndFinalizedRequests List", list);
  });

  const emptyHash = "0000000000000000000000000000000000000000000000000000000000000000";

  const onVerifyKYC = async (toaddress, hash) => {
    setLoading(true);
    await tx(
      writeContracts.COPIssuer.verify(
        toaddress,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
        false, // true
      ),
    );
    setLoading(false);
  };
  const onVerifyInvestor = async (toaddress, hash) => {
    setLoading(true);
    await tx(
      writeContracts.COPIssuer.verify(
        toaddress,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
        false, // true,
      ),
    );
    setLoading(false);
  };
  const onVerifyManufacturer = async (toaddress, hash) => {
    setLoading(true);
    await tx(
      writeContracts.COPIssuer.verify(
        toaddress,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
        false, // true,
      ),
    );
    setLoading(false);
  };
  const onVerifyProduction = async (toaddress, hash) => {
    setLoading(true);
    await tx(
      writeContracts.COPIssuer.verify(
        toaddress,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
        false, // true,
      ),
    );
    setLoading(false);
  };
  const onApproveAmount = async (toaddress, hash) => {
    setLoading(true);
    await tx(
      writeContracts.COPIssuer.verify(
        toaddress,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
        true,
      ),
    );
    setLoading(false);
  };
  const onIssueTokens = async toaddress => {
    setLoading(true);
    await tx(writeContracts.COPIssuer.mint(toaddress));
    setLoading(false);
  };

  useEffect(() => {
    updateApprovedAndFinalizedRequests();
  }, [approvedRequestsCount]);

  if (address == undefined || approvedRequestsCount == undefined) return <h2>Connecting...</h2>;
  if (issuedPerYear == undefined || issuedPerYearPerAddress == undefined || totalIssued == undefined)
    return <h2>Getting stats ...</h2>;

  return (
    <div style={{ margin: "auto", width: "90vw" }}>
      {/* <List grid={{ gutter: 100, row: 10, column: 10 }}  style={{ verticalAlign: "top", display: "inline-block" }} > */}
      <Row gutter={16} type="flex">
        <Col span={24}>
          <Card hoverable title="Registry of Issued Tokens">
            Total Issued: <strong>{totalIssued.toNumber()}</strong> Issued in Year {currentYear}:{" "}
            <strong>{issuedPerYear.toNumber()}</strong> Issued To You:{" "}
            <strong>{issuedPerYearPerAddress.toNumber()}</strong>
            <Card.Meta
              title={"There are " + approvedRequestsCount.toNumber() + " reviewed requests"}
              description="Public registry of review requests"
            />
          </Card>
        </Col>
        <Col span={24}>
          {approvedAndFinalizedList.map((request, i) => (
            <Card hoverable>
              <Card.Meta title="Validation Procedure Status" description={request.requestorData.organization} />
              {/* request.isValidationProcedureOK === false */}
              {true && (
                <div className="site-card-wrapper">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card hoverable onClick={() => onVerifyKYC(request.reviewRequest.candidate, emptyHash)}>
                        <strong>KYC</strong>
                        <br /> {request.checkValidationProcedure.kyc ? "Completed" : "Not Completed"}
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card hoverable>
                        <strong>Investor</strong>
                        <br /> {request.checkValidationProcedure.investor ? "Completed" : "Not Completed"}
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card hoverable>
                        <strong>Manufacturer</strong>
                        <br />
                        {request.checkValidationProcedure.manufacturer ? "Completed" : "Not Completed"}
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card hoverable>
                        <strong>Production</strong>
                        <br />
                        {request.checkValidationProcedure.production ? "Completed" : "Not Completed"}
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card hoverable>
                        <strong>Amount</strong>
                        <br />
                        {request.checkValidationProcedure.amount.toString()} COOP
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </Card>
          ))}
        </Col>
      </Row>

      <Card>
        <h2>Validation Rights</h2>
        KYC: {isKYCValidator ? "Validator" : "Not Validator"} <br />
        Investment: {isInvestValidator ? "Validator" : "Not Validator"} <br />
        Manufacturer: {isManufacturerValidator ? "Validator" : "Not Validator"} <br />
        Production: {isProductionValidator ? "Validator" : "Not Validator"} <br />
        <br />
        <h2>Roles</h2>
        Add Validator: {role_add_validator} <br />
        KYC: {role_kyc_validator} <br />
        Investment: {role_invest_validator} <br />
        Manufacturer: {role_manufacturer_validator} <br />
        Production: {role_production_validator} <br />
      </Card>
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
