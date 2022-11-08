import React, { useCallback, useState, useEffect } from "react";
import { DropzoneSwarmUpload } from "./../Swarm/DropzoneSwarmUpload";
import { Card, Row, Col, Button, notification } from "antd";
const { Meta } = Card;

const emptyHash = "0x0000000000000000000000000000000000000000000000000000000000000000"; // this means no data was provided and must be provided

function RequestAddRequestorData({ writeContracts, readContracts, address, tx }) {
  const [fileData, setFileData] = useState({});
  const [requestorData, setRequestorData] = useState({});

  const [docsSubmited, setDocsSubmited] = useState(false);
  const [kycHash, setKycHash] = useState(emptyHash);
  const [investorHash, setInvestorHash] = useState(emptyHash);
  const [manufacturerHash, setManufacturerHash] = useState(emptyHash);
  const [productionHash, setProductionHash] = useState(emptyHash);

  var d = {
    // kycHash: emptyHash,
    // investorHash: emptyHash,
    // manufacturerHash: emptyHash,
    // productionHash: emptyHash,
    kycFile: null,
    investorFile: null,
    manufacturerFile: null,
    productionFile: null,
  };

  const updateRequestorData = useCallback(async address => {
    var checkRequestorData = await readContracts.COPIssuer.getRequestorData(address);
    console.log("RequestAddRequestorData", checkRequestorData);
    setRequestorData(checkRequestorData);
    setFileData(d);
    setKycHash(checkRequestorData.kycData);
    setInvestorHash(checkRequestorData.investorData);
    setManufacturerHash(checkRequestorData.manufacturerData);
    setProductionHash(checkRequestorData.productionData);

    const docsSubmited =
      checkRequestorData.kycData !== emptyHash &&
      checkRequestorData.investorData !== emptyHash &&
      checkRequestorData.manufacturerData !== emptyHash &&
      checkRequestorData.productionData !== emptyHash;

    setDocsSubmited(docsSubmited);
  }, []);

  useEffect(() => {
    updateRequestorData(address);
  }, [address]);

  useEffect(() => {
    console.log("requestorData", requestorData);
  }, [requestorData]);

  useEffect(() => {
    console.log("fileData", fileData);
  }, [fileData]);

  const onFileKYC = async (hash, file) => {
    if (hash === undefined) return;
    console.log("onFileKYC uploaded", hash, file.name);
    d.kycFile = file;
    setKycHash("0x" + hash);
    setFileData(d);
  };
  const onFileInvestor = async (hash, file) => {
    if (hash === undefined) return;
    console.log("onFileInvestor uploaded", hash, file.name);
    d.investorFile = file;
    setInvestorHash("0x" + hash);
    setFileData(d);
  };
  const onFileManufacturer = async (hash, file) => {
    if (hash === undefined) return;
    console.log("onFileManufacturer uploaded", hash, file.name);
    d.manufacturerFile = file;
    setManufacturerHash("0x" + hash);
    setFileData(d);
  };
  const onFileProduction = async (hash, file) => {
    if (hash === undefined) return;
    console.log("onFileProduction uploaded", hash, file.name);
    d.productionFile = file;
    setProductionHash("0x" + hash);
    setFileData(d);
  };

  const onSubmitDocuments = async () => {
    if (
      kycHash === emptyHash ||
      investorHash === emptyHash ||
      manufacturerHash === emptyHash ||
      productionHash === emptyHash
    ) {
      notification.error({
        message: "Upload Error",
        description: "Please upload all documents before submitting",
      });
      return;
    }

    const txout = await tx(
      writeContracts.COPIssuer.addRequestorData(address, kycHash, investorHash, manufacturerHash, productionHash),
    );
  };

  var areDocumentsSubmitted =
    kycHash !== emptyHash &&
    investorHash !== emptyHash &&
    manufacturerHash !== emptyHash &&
    productionHash !== emptyHash;

  //console.log("xxx", fileData);
  if (fileData === undefined) return <></>;

  if (docsSubmited)
    return (
      <>
        <Card title="Documents Provided" bordered={false}>
          <Card.Meta title={"KYC"} description={kycHash} />
          <Card.Meta title={"Investor"} description={investorHash} />
          <Card.Meta title={"Manufacturer"} description={manufacturerHash} />
          <Card.Meta title={"Production"} description={productionHash} />
        </Card>
      </>
    );

  return (
    <Card title="Provide Required Documents">
      <div className="site-card-wrapper">
        <Row gutter={16}>
          <Col span={12} style={{ minWidth: "100%" }}>
            <Card title="Identification / KYC" bordered={false}>
              {kycHash === emptyHash ? (
                <DropzoneSwarmUpload onFileUploaded={onFileKYC} />
              ) : (
                <>{fileData.kycFile?.name}</>
              )}
            </Card>
          </Col>
          <Col span={12} style={{ minWidth: "100%" }}>
            <Card title="Investment" bordered={false}>
              {investorHash === emptyHash ? (
                <DropzoneSwarmUpload onFileUploaded={onFileInvestor} />
              ) : (
                <>{fileData.investorFile?.name}</>
              )}
            </Card>
          </Col>
          <Col span={12} style={{ minWidth: "100%" }}>
            <Card title="Manufacturing" bordered={false}>
              {manufacturerHash === emptyHash ? (
                <DropzoneSwarmUpload onFileUploaded={onFileManufacturer} />
              ) : (
                <>{fileData.manufacturerFile?.name}</>
              )}
            </Card>
          </Col>
          <Col span={12} style={{ minWidth: "100%" }}>
            <Card title="Production" bordered={false}>
              {productionHash === emptyHash ? (
                <DropzoneSwarmUpload onFileUploaded={onFileProduction} />
              ) : (
                <>{fileData.productionFile?.name}</>
              )}
            </Card>
          </Col>
        </Row>

        <Row>
          <Col span={12} style={{ left: "0px" }}>
            <Button type="primary" onClick={e => onSubmitDocuments()}>
              Submit Documents
            </Button>
          </Col>
        </Row>
      </div>
      <br />
      KYC: {requestorData.kycData !== emptyHash ? "Passed" : "Missing"} <br />
      Investor: {requestorData.investorData !== emptyHash ? "Passed" : "Missing"} <br />
      Manufacturer: {requestorData.manufacturerData !== emptyHash ? "Passed" : "Missing"} <br />
      Production: {requestorData.productionData !== emptyHash ? "Passed" : "Missing"} <br />
      <br />
      <Card.Meta
        title="Provide required data"
        description={<>Upload your documents and then submit them for validation</>}
      />
    </Card>
  );
}

export default RequestAddRequestorData;
