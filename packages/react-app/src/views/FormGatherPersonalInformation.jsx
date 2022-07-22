import React from "react";
import { uploadJsonToBee } from "./../Swarm/BeeService";
import { Button, Card, Input, Form } from "antd";
const { Meta } = Card;
import * as layouts from "./layouts.js";

// https://codesandbox.io/s/5okyk?file=/index.js:191-351
export class FormGatherPersonalInformation extends React.Component {
  formRef = React.createRef();
  // onGenderChange = value => {
  //   switch (value) {
  //     case "male":
  //       this.formRef.current.setFieldsValue({
  //         note: "Hi, man!",
  //       });
  //       return;

  //     case "female":
  //       this.formRef.current.setFieldsValue({
  //         note: "Hi, lady!",
  //       });
  //       return;

  //     case "other":
  //       this.formRef.current.setFieldsValue({
  //         note: "Hi there!",
  //       });
  //   }
  // };

  onReset = () => {
    this.formRef.current.resetFields();
  };
  onFill = () => {
    /*this.formRef.current.setFieldsValue({
        note: "Hello world!",
        gender: "male",
      });*/
  };
  onFinish = async values => {
    console.log("onFinish", values);
    const swarmHash = await uploadJsonToBee(values, "post.json");
    console.log("swarmHash", swarmHash);
    this.props.onSubmit(swarmHash);
  };

  render() {
    const required = [{ required: true }];
    if (this.props.address == undefined) return <h2>Connecting...</h2>;

    //console.log(this.props.address);

    return (
      <Card title="Personal Information" description="Please provide required information">
        <Form
          {...layouts.layout}
          ref={this.formRef}
          // name="control-ref"
          onFinish={this.onFinish}
          name="gatherPersonalInformation"
          fields={[
            {
              name: ["ethaddress"],
              value: this.props.address,
            },
          ]}
        >
          <Form.Item name="first" label="First Name" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="last" label="Last Name" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="organization" label="Organization">
            <Input />
          </Form.Item>
          <Form.Item name="address1" label="Address 1" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="address2" label="Address 2">
            <Input />
          </Form.Item>
          <Form.Item name="city" label="City" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="postcode" label="Postal Code / ZIP" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="country" label="Country" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={required}>
            <Input />
          </Form.Item>
          <Form.Item name="ethaddress" label="Ethereum Address" rules={required}>
            <Input value={this.props.address} />
          </Form.Item>

          <Form.Item {...layouts.tailLayout}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button htmlType="button" onClick={this.onReset}>
              Reset
            </Button>
            {/* <Button type="link" htmlType="button" onClick={this.onFill}>
                Fill form
              </Button> */}
          </Form.Item>
        </Form>

        <Card.Meta
          title="We Care"
          description="Your information is kept private. Only KYC validators will see your personal information."
        />
      </Card>
    );
  }
}

//export default FormGatherPersonalInformation;
