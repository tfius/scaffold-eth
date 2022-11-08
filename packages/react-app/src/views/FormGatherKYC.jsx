import React from "react";
import { Button, Form } from "antd";
import * as layouts from "./layouts.js";
import { downloadGateway } from "./../Swarm/BeeService";
import { DropzoneSwarmUpload } from "./../Swarm/DropzoneSwarmUpload";

/*
function Dropzone({ onFileUploaded }) {
  const onDrop = useCallback(async acceptedFiles => {
    //acceptedFiles.forEach(file => {
    for (const file of acceptedFiles) {
      const hash = await uploadFileToBee(file);
      onFileUploaded(hash, file);
      
      const reader = new FileReader();
      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        const binaryStr = reader.result; // Do whatever you want with the file contents
        console.log("Dropzone FormGather got data", binaryStr);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Card {...getRootProps()}>
      <input {...getInputProps()} />
      Add documentation or drop files here
    </Card>
  );
}
*/

export class FormGatherKYC extends React.Component {
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
          <>
            File:{" "}
            <a
              href={downloadGateway + this.props.request.requestorFileData.kycData.substring(2)}
              download
              target="_blank"
            >
              Download
            </a>
            {/* <Button
              onClick={e => {
                downloadFileFromBee(this.props.request.requestorFileData.kycData.substring(2));
              }}
            >
              <small>{this.props.request.requestorFileData.kycData}</small>
            </Button> */}
            <br />
            <br />
          </>
          {/*
          <Form.Item name="ethaddress" label="Validator">
            <Input value={this.props.address} disabled />
          </Form.Item>
           <Form.Item name="amount" label="Amount" rules={required}>
            <Input />
          </Form.Item> */}

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
                  this.props.onVerifyKYC(this.props.request.reviewRequest.candidate, this.state.hash, true);
                }}
              >
                Approve KYC
              </Button>
            </>
          )}

          {this.props.request.checkValidationProcedure.kyc == true && (
            <>
              <Button
                type=""
                onClick={e => {
                  this.props.onVerifyKYC(
                    this.props.request.reviewRequest.candidate,
                    "0000000000000000000000000000000000000000000000000000000000000000", // nullify
                    false,
                  );
                }}
              >
                Revoke Completed KYC
              </Button>
            </>
          )}

          <br />
          {/* 
          <Form.Item {...layouts.tailLayout}>
            <Button
              type=""
              htmlType="submit"
              onClick={e => {
                this.props.onVerifyKYC();
              }}
            >
              Approve KYC
            </Button>
          </Form.Item> */}
        </Form>
      </>
    );
  }
}

export default FormGatherKYC;
