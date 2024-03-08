import React, { useState } from "react";
import {
  Button,
  Select,
  Card,
  Modal,
  notification,
  Tooltip,
  Typography,
  Spin,
  Checkbox,
  Input,
  Switch,
  Collapse,
} from "antd";

export function ServiceForm({ onSubmit }) {
  const [service, setService] = useState({
    name: "",
    description: "",
    version: "",
    service_author: "",
    model: "",
    model_author: "",
    model_version: "",
    model_license: "",
    method: "",
    endpoint: "",
    Input: "",
    response: "",
    output: "",
    output_file_type: "",
    format: "",
    subtype: "",
    url: "",
    example: "",
    cost: "",
  });

  const handleChange = e => {
    setService({ ...service, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(service);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* <h2>Service Details</h2> */}
      <div>
        <label>Name:</label>
        <Input name="name" value={service.name} onChange={handleChange} />
      </div>
      <div>
        <label>Description:</label>
        <Input.TextArea name="description" value={service.description} onChange={handleChange} />
      </div>
      <div>
        <label>Version:</label>
        <Input name="version" value={service.version} onChange={handleChange} />
      </div>
      <div>
        <label>Service Author:</label>
        <Input name="service_author" value={service.service_author} onChange={handleChange} />
      </div>
      <div>
        <label>Model:</label>
        <Input name="model" value={service.model} onChange={handleChange} />
      </div>
      <div>
        <label>Model Author:</label>
        <Input name="model_author" value={service.model_author} onChange={handleChange} />
      </div>
      <div>
        <label>Model Version:</label>
        <Input name="model_version" value={service.model_version} onChange={handleChange} />
      </div>
      <div>
        <label>Model License:</label>
        <Input name="model_license" value={service.model_license} onChange={handleChange} />
      </div>
      <div>
        <label>Method:</label>
        <Input name="method" value={service.method} onChange={handleChange} />
      </div>
      <div>
        <label>Endpoint:</label>
        <Input name="endpoint" value={service.endpoint} onChange={handleChange} />
      </div>
      <div>
        <label>Input:</label>
        <Input name="Input" value={service.Input} onChange={handleChange} />
      </div>
      <div>
        <label>Response:</label>
        <Input name="response" value={service.response} onChange={handleChange} />
      </div>
      <div>
        <label>Output:</label>
        <Input name="output" value={service.output} onChange={handleChange} />
      </div>
      <div>
        <label>Output File Type:</label>
        <Input name="output_file_type" value={service.output_file_type} onChange={handleChange} />
      </div>
      <div>
        <label>Format:</label>
        <Input name="format" value={service.format} onChange={handleChange} />
      </div>
      <div>
        <label>Subtype:</label>
        <Input name="subtype" value={service.subtype} onChange={handleChange} />
      </div>
      <div>
        <label>URL:</label>
        <Input name="url" value={service.url} onChange={handleChange} />
      </div>
      <div>
        <label>Example:</label>
        <Input name="example" value={service.example} onChange={handleChange} />
      </div>
      <div>
        <label>Cost:</label>
        <Input name="cost" value={service.cost} onChange={handleChange} />
      </div>
      <hr />
      <Button type="submit">Submit Service</Button>
    </form>
  );
  /*
  return (
    <form onSubmit={handleSubmit}>
      <h2>Service Details</h2>
     
      <div>
        <label>Name</label>
        <Input name="name" value={service.name} onChange={handleChange} />
      </div>
      <div>
        <label>Description</label>
        <Input.TextArea name="description" value={service.description} onChange={handleChange} />
      </div>
     
      <Button type="submit">Submit Service</Button>
    </form>
  ); */
}
