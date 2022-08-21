import React, { useCallback, useState, useEffect } from "react";
import { downloadDataFromBee } from "./../Swarm/BeeService";
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

const contractName = "COPRequestReviewRegistry";
const ModalTypes = {
  KYC: 0,
  Investor: 1,
  Manufacturer: 2,
  Production: 3,
  AmountApproval: 4,
  IssueApproved: 5,
};

export class FormGatherKYC extends React.Component {
  constructor(props) {
    super(props);
    this.state = { amount: 0 };
  }

  formRef = React.createRef();

  onFinish = async values => {
    console.log("onFinish", values);
    //await this.props.onApproveAmount(this.props.request.reviewRequest.candidate, definedAmount);
    this.props.onClose(null);
  };
  render() {
    const required = [{ required: true }];
    if (this.props.request == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherApproveAmount"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          {/* <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={required}>
            <Input /> 
          </Form.Item> }
        */}
          <Form.Item {...layouts.tailLayout}>
            <Button type="" htmlType="submit">
              Approve KYC
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}
export class FromGatherInvestment extends React.Component {
  constructor(props) {
    super(props);
    this.state = { amount: 0 };
  }

  formRef = React.createRef();

  onFinish = async values => {
    console.log("onFinish", values);
    //await this.props.onApproveAmount(this.props.request.reviewRequest.candidate, definedAmount);
    this.props.onClose(null);
  };
  render() {
    const required = [{ required: true }];
    if (this.props.request == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherApproveAmount"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          {/* <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={required}>
            <Input /> 
          </Form.Item> }
        */}
          <Form.Item {...layouts.tailLayout}>
            <Button type="" htmlType="submit">
              Approve Investment Data
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}
export class FromGatherManufacturer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { amount: 0 };
  }

  formRef = React.createRef();

  onFinish = async values => {
    console.log("onFinish", values);
    //await this.props.onApproveAmount(this.props.request.reviewRequest.candidate, definedAmount);
    this.props.onClose(null);
  };
  render() {
    const required = [{ required: true }];
    if (this.props.request == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherApproveAmount"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          {/* <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={required}>
            <Input /> 
          </Form.Item> }
        */}
          <Form.Item {...layouts.tailLayout}>
            <Button type="" htmlType="submit">
              Approve Manufacturer Data
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}
export class FromGatherProduction extends React.Component {
  constructor(props) {
    super(props);
    this.state = { amount: 0 };
  }

  formRef = React.createRef();

  onFinish = async values => {
    console.log("onFinish", values);
    //await this.props.onApproveAmount(this.props.request.reviewRequest.candidate, definedAmount);
    this.props.onClose(null);
  };
  render() {
    const required = [{ required: true }];
    if (this.props.request == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherApproveAmount"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          {/* <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={required}>
            <Input /> 
          </Form.Item> }
        */}
          <Form.Item {...layouts.tailLayout}>
            <Button type="" htmlType="submit">
              Approve Production Data
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}
export class FormGatherApproveAmount extends React.Component {
  constructor(props) {
    super(props);
    this.state = { amount: 0 };
  }

  formRef = React.createRef();

  onFinish = async values => {
    let definedAmount;
    try {
      definedAmount = ethers.utils.parseEther("" + this.state.amount);
    } catch (e) {
      // failed to parseEther, try something else
      definedAmount = ethers.utils.parseEther("" + parseFloat(this.state.amount).toFixed(8));
    }
    console.log("onFinish", values, definedAmount.toString());
    await this.props.onApproveAmount(this.props.request.reviewRequest.candidate, definedAmount);
    this.props.onClose(null);
  };
  setAmount = async amount => {
    this.setState({ amount });
    console.log(amount);
  };

  //console.log(onSubmit, address);
  render() {
    const required = [{ required: true }];
    if (this.props.request == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherApproveAmount"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={required}>
            {/* <Input /> */}
            <EtherInput
              price={this.props.price}
              value={this.state.amount}
              onChange={value => {
                this.setAmount(value);
              }}
            />
          </Form.Item>

          <Form.Item {...layouts.tailLayout}>
            <Button type="" htmlType="submit">
              Approve Amount of COOP tokens
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}
export class FormIssueTokens extends React.Component {
  constructor(props) {
    super(props);
    this.state = { amount: 0 };
  }

  formRef = React.createRef();

  onFinish = async values => {
    console.log("onFinish", values);
    //await this.props.onApproveAmount(this.props.request.reviewRequest.candidate, definedAmount);
    this.props.onClose(null);
  };
  render() {
    console.log(this.props);

    const required = [{ required: true }];
    if (this.props.request == undefined) return <h3>Connecting...</h3>;

    return (
      <>
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherApproveAmount"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          {/* <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={required}>
            <Input /> 
          </Form.Item> }
        */}
          <Form.Item {...layouts.tailLayout}>
            <Button type="" htmlType="submit">
              Issue Tokens
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}

function Registry({ writeContracts, readContracts, address, tx, localProvider }) {
  const [loading, setLoading] = useState(false);
  const [approvedAndFinalizedList, setApprovedAndFinalizedList] = useState([]);
  const [currentYear, setCurrentYear] = useState("2022");
  const [modalType, setModalType] = useState(0); // if null, modal is not visible
  const [modalTitle, setModalTitle] = useState(null); // if null, modal is not visible
  const [modalRequest, setModalRequest] = useState(null); // if null, modal is not visible
  //const [modalApproveAmount, setModalApproveAmount] = useState(0); // if null, modal is not visible

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

  const decimals = useContractReader(readContracts, "COPToken", "decimals");
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
  const defaultAmount = "1000000000000000000";

  const onVerifyKYC = async (toaddress, hash) => {
    setLoading(true);
    await tx(
      writeContracts.COPIssuer.verify(
        toaddress,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
        true, // true
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
        true, // true,
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
        true, // true,
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
        true, // true,
      ),
    );
    setLoading(false);
  };
  const onApproveAmount = async (toaddress, amount) => {
    setLoading(true);
    await tx(writeContracts.COPIssuer.approveAmount(toaddress, amount));
    setLoading(false);
  };
  const onIssueTokens = async toaddress => {
    setLoading(true);
    await tx(writeContracts.COPIssuer.mint(toaddress));
    setLoading(false);
  };

  const onGatherApproveAmount = async request => {
    setModalTitle("Approve amount of tokens to be issued");
    setModalRequest(request);
    setModalType(ModalTypes.AmountApproval);
  };
  const onGatherKYC = async request => {
    setModalTitle("Verify KYC data");
    setModalRequest(request);
    setModalType(ModalTypes.KYC);
  };
  const onGatherInvestor = async request => {
    setModalTitle("Verify investment data");
    setModalRequest(request);
    setModalType(ModalTypes.Investor);
  };
  const onGatherManufacturer = async request => {
    setModalTitle("Verify manufacturer data");
    setModalRequest(request);
    setModalType(ModalTypes.Manufacturer);
  };
  const onGatherProduction = async request => {
    setModalTitle("Verify production data");
    setModalRequest(request);
    setModalType(ModalTypes.Production);
  };
  const onGatherIssueTokens = async request => {
    setModalTitle("Issue tokens");
    setModalRequest(request);
    setModalType(ModalTypes.IssueTokens);
  };

  useEffect(() => {
    updateApprovedAndFinalizedRequests();
  }, [approvedRequestsCount]);

  if (address == undefined || approvedRequestsCount == undefined) return <h2>Connecting...</h2>;
  if (issuedPerYear == undefined || issuedPerYearPerAddress == undefined || totalIssued == undefined)
    return <h2>Getting stats ...</h2>;

  const totalIssuedFormatted = parseFloat(ethers.utils.formatUnits(totalIssued, decimals)).toPrecision(6);
  const issuedPerYearFormated = parseFloat(ethers.utils.formatUnits(issuedPerYear, decimals)).toPrecision(6);
  const issuedPerYearPerAddressFormated = parseFloat(
    ethers.utils.formatUnits(issuedPerYearPerAddress, decimals),
  ).toPrecision(6);
  // ethers.utils.parseUnits(amountIn.toString(), tokens[tokenIn].decimals)
  return (
    <div style={{ margin: "auto", width: "90vw" }}>
      {/* <List grid={{ gutter: 100, row: 10, column: 10 }}  style={{ verticalAlign: "top", display: "inline-block" }} > */}
      <Row gutter={16} type="flex">
        <Col span={24}>
          <Card hoverable title="Registry of Issued Tokens">
            Total Issued: <strong>{totalIssuedFormatted} </strong>
            Issued in Year {currentYear}: <strong>{issuedPerYearFormated} </strong>
            Issued To You: <strong>{issuedPerYearPerAddressFormated} </strong>
            <Card.Meta
              title={"There are " + approvedRequestsCount.toNumber() + " reviewed requests"}
              description="Public registry of review requests"
            />
          </Card>
        </Col>
        <Col span={24}>
          {approvedAndFinalizedList.map((request, i) => (
            <>
              <Card hoverable key={"regcard" + i}>
                <Card.Meta title="Validation Procedure Status" description={request.requestorData.organization} />
                {/* request.isValidationProcedureOK === false */}
                {true && (
                  <div className="site-card-wrapper">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card hoverable onClick={() => onGatherKYC(request)}>
                          {/* onVerifyKYC(request.reviewRequest.candidate, emptyHash)} */}
                          <strong>KYC</strong>
                          <br /> {request.checkValidationProcedure.kyc ? "Completed" : "Not Completed"}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card hoverable onClick={() => onGatherInvestor(request)}>
                          {/* onVerifyInvestor(request.reviewRequest.candidate, emptyHash) */}
                          <strong>Investor</strong>
                          <br /> {request.checkValidationProcedure.investor ? "Completed" : "Not Completed"}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card hoverable onClick={() => onGatherManufacturer(request)}>
                          {/* onVerifyManufacturer(request.reviewRequest.candidate, emptyHash) */}
                          <strong>Manufacturer</strong>
                          <br />
                          {request.checkValidationProcedure.manufacturer ? "Completed" : "Not Completed"}
                        </Card>
                      </Col>
                      <Col span={8} onClick={() => onGatherProduction(request)}>
                        {/* onVerifyProduction(request.reviewRequest.candidate, emptyHash) */}
                        <Card hoverable>
                          <strong>Production</strong>
                          <br />
                          {request.checkValidationProcedure.production ? "Completed" : "Not Completed"}
                        </Card>
                      </Col>
                      <Col span={8} onClick={() => onGatherApproveAmount(request)}>
                        {/* onApproveAmount(request.reviewRequest.candidate, defaultAmount) */}
                        <Card hoverable>
                          <strong>Approve Amount</strong>
                          <br />
                          {request.checkValidationProcedure.amountApproved.toString()} COOP
                        </Card>
                      </Col>
                      <Col span={8} onClick={() => onGatherIssueTokens(request)}>
                        {/* onIssueTokens(request.reviewRequest.candidate) */}
                        <Card hoverable>
                          <strong>Issue Tokens</strong>
                          <br />
                          {request.checkValidationProcedure.amountIssued.toString()} COOP
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card>
            </>
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

      <div>
        <Modal title={modalTitle} visible={modalTitle != null} footer={null} onCancel={() => setModalTitle(null)}>
          {modalType === ModalTypes.KYC && (
            <FormGatherKYC request={modalRequest} address={address} onVerifyKYC={onVerifyKYC} onClose={setModalTitle} />
          )}
          {modalType === ModalTypes.Investor && (
            <FromGatherInvestment
              request={modalRequest}
              address={address}
              onVerifyInvestor={onVerifyInvestor}
              onClose={setModalTitle}
            />
          )}
          {modalType === ModalTypes.Manufacturer && (
            <FromGatherManufacturer
              request={modalRequest}
              address={address}
              onVerifyManufacturer={onVerifyManufacturer}
              onClose={setModalTitle}
            />
          )}
          {modalType === ModalTypes.Production && (
            <FromGatherProduction
              request={modalRequest}
              address={address}
              onVerifyProduction={onVerifyProduction}
              onClose={setModalTitle}
            />
          )}
          {modalType === ModalTypes.AmountApproval && (
            <FormGatherApproveAmount
              request={modalRequest}
              address={address}
              onApproveAmount={onApproveAmount}
              onClose={setModalTitle}
            />
          )}
          {modalType === ModalTypes.IssueTokens && (
            <FormIssueTokens
              request={modalRequest}
              address={address}
              onIssueTokens={onIssueTokens}
              onClose={setModalTitle}
            />
          )}

          <Card.Meta
            description={
              <>
                <Button
                  style={{ float: "right" }}
                  className="ant-btn-primary"
                  onClick={e => {
                    setModalTitle(null);
                  }}
                >
                  Close
                </Button>
              </>
            }
          />
        </Modal>
      </div>
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
