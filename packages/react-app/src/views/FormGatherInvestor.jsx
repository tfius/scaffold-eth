import React from "react";
import { Button, Form } from "antd";
import * as layouts from "./layouts.js";
import { downloadGateway } from "./../Swarm/BeeService";
import { DropzoneSwarmUpload } from "./../Swarm/DropzoneSwarmUpload";

export class FormGatherInvestor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { amount: 0, hash: null, file: null };
    console.log("FormGatherKYC", props);
  }

  formRef = React.createRef();
  onFileUploaded = async (hash, file) => {
    console.log("file uploaded", hash, file);
    this.setState({ hash: hash });
    this.setState({ file: file });
  };

  onFinish = async values => {
    console.log("onFinish", values);
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
          <>
            File:{" "}
            <a
              href={downloadGateway + this.props.request.requestorFileData.kycData.substring(2)}
              download
              target="_blank"
            >
              Download
            </a>
            <br />
            <br />
          </>

          <DropzoneSwarmUpload onFileUploaded={this.onFileUploaded} />

          {this.state.file != null && (
            <>
              {this.state.file.name} &nbsp;
              {layouts.bytesToSize(this.state.file.size)}
              <br />
              Ref: <small>{this.state.hash}</small> &nbsp;
              <br />
              <br />
              <Button
                type=""
                onClick={e => {
                  this.props.onVerifyInvestor(this.props.request.reviewRequest.candidate, this.state.hash, true);
                }}
              >
                Approve Investor
              </Button>
            </>
          )}

          {this.props.request.checkValidationProcedure.investor == true && (
            <>
              <Button
                type=""
                onClick={e => {
                  this.props.onVerifyInvestor(
                    this.props.request.reviewRequest.candidate,
                    "0000000000000000000000000000000000000000000000000000000000000000", // nullify
                    false,
                  );
                }}
              >
                Revoke Completed Investor
              </Button>
            </>
          )}

          <br />
        </Form>
      </>
    );
  }
}

export default FormGatherInvestor;
