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

export function ServiceProviderForm({ onSubmit }) {
  const [provider, setProvider] = useState({
    name: "",
    address: "",
    description: "",
    url: "",
    logo: "",
  });

  const handleChange = e => {
    setProvider({ ...provider, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(provider);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* <h2>Service Provider Details</h2> */}
      <div>
        <label>Name</label>
        <Input name="name" value={provider.name} onChange={handleChange} />
      </div>
      <div>
        <label>Address</label>
        <Input name="address" value={provider.address} onChange={handleChange} />
      </div>
      <div>
        <label>Description</label>
        <Input.TextArea name="description" value={provider.description} onChange={handleChange} />
      </div>
      <div>
        <label>URL</label>
        <Input name="url" value={provider.url} onChange={handleChange} type="url" />
      </div>
      <div>
        <label>Logo URL</label>
        <Input name="logo" value={provider.logo} onChange={handleChange} type="url" />
      </div>
      <hr />
      <Button type="submit">Submit Provider</Button>
    </form>
  );
}
