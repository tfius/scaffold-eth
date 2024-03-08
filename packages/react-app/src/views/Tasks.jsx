import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { Link, Route, useLocation } from "react-router-dom";
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
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
import { formatNumber, timeAgo, getDateTimeString } from "./../views/datetimeutils";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { AddressSimple, AddressInput } from "../components";
import { DisplayService } from "./TaskServices/DisplayService.jsx";
import { DisplayServiceProvider } from "./TaskServices/DisplayServiceProvider.jsx";
import { ServiceForm } from "./TaskServices/ServiceForm.jsx";
import { ServiceProviderForm } from "./TaskServices/ServiceProviderForm.jsx";

const { Panel } = Collapse;

const serviceProviders = [
  {
    name: "Datafund",
    address: "0x",
    description: "Datafund is a decentralized data marketplace and data processing platform.",
    url: "https://datafund.io",
    logo: "https://datafund.io/resources/img/logos/invert.svg",

    services: [
      {
        name: "Vision Bone Marrow",
        description: "Classify a bone marrow image",
        version: "1.0",
        service_author: "Datafund",
        model: "datafund_vision_bone_marrow",
        model_author: "Datafund",
        model_version: "1.0",
        model_license: "MIT",
        method: "post",
        endpoint: "/classify/",
        input: "form-data",
        response: "streaming",
        output: "file",
        output_file_type: "application/json",
        format: "JSON",
        subtype: "UTF8",
        url: "/web",
        example: "/classify/",
        example_form: "{ image: 'image.jpg' }", // Assuming a form-data input
        cost: "0.012",
      },
      {
        name: "Entity Recognition",
        description: "Recognize entities in text",
        version: "1.0",
        service_author: "Datafund",
        model: "datafund_ner",
        model_author: "Datafund",
        model_version: "1.0",
        model_license: "MIT",
        method: "post",
        endpoint: "/entities/",
        input: "form-data",
        response: "streaming",
        output: "file",
        output_file_type: "application/json",
        format: "JSON",
        subtype: "UTF8",
        url: "/web",
        example: "/entities/",
        example_form: "{ text: 'text.txt' }", // Assuming a form-data input
        cost: "0.008",
      },
      {
        name: "Knowledge Graph Builder",
        description: "Build a knowledge graph from a dataset",
        version: "1.0",
        service_author: "Datafund",
        model: "datafund_kg_builder",
        model_author: "Datafund",
        model_version: "1.0",
        model_license: "MIT",
        method: "post",
        endpoint: "/knowledgegraph/",
        input: "form-data",
        response: "file",
        output: "file",
        output_file_type: "application/octet-stream",
        format: "JSON",
        subtype: "UTF8",
        url: "/web",
        example: "/knowledgegraph/",
        example_form: "{ data: 'data.csv' }", // Assuming a form-data input
        cost: "0.008",
      },
      {
        name: "Model builder",
        description: "Build an ONNX model from a dataset",
        version: "1.0",
        service_author: "Datafund",
        model: "datafund_llm",
        model_author: "Datafund",
        model_version: "1.0",
        model_license: "MIT",
        method: "post",
        endpoint: "/modelbuilder/",
        scheme: "",
        input: "form-data",
        response: "file",
        output: "file",
        output_file_type: "application/octet-stream",
        format: "ONNX",
        subtype: "UTF8",
        url: "/web",
        example: "/modelbuilder/",
        example_form: "{ target: 'label', features: ['feature1', 'feature2'], data: 'data.csv' }", // Assuming a form-data input
        cost: "0.008",
      },
      {
        name: "Legal LLM",
        description: "Answer a legal question",
        version: "1.0",
        service_author: "Datafund",
        model: "datafund_llm",
        model_author: "Datafund",
        model_version: "1.0",
        model_license: "MIT",
        method: "get",
        endpoint: "/answer/{text}",
        input: "text",
        response: "streaming",
        output: "file",
        output_file_type: "application/txt",
        format: "TXT",
        subtype: "UTF8",
        url: "/web",
        example: "/answer/What is earth made of?",
        cost: "0.005",
      },
    ],
  },
  {
    name: "Fair Data Society",
    address: "0x",
    description: "Fair Data Society is a decentralized data storage platform and data processing platform.",
    url: "https://fairdatasociety.org",
    logo: "https://fdp.fairdatasociety.org//uploads/2022/10/03/fairdata.svg",
    services: [
      {
        name: "Synthesize",
        description: "Synthesize speech from text and return audio file",
        version: "1.0",
        service_author: "Datafund",
        model: "speecht5_tts",
        model_author: "Microsoft",
        model_version: "1.0",
        model_license: "MIT",
        method: "get",
        endpoint: "/synthesize/{text}",
        input: "text",
        response: "streaming",
        output: "file",
        output_file_type: "audio/wav",
        format: "WAV",
        subtype: "PCM_16",
        url: "/web",
        example: "/synthesize/Hello world",
        cost: "0.014", // Assuming a cost attribute is available or will be calculated
      },
    ],
  },
];

const serviceStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const serviceCategories = [
  { name: "AI" },
  { name: "ML" },
  { name: "NLP" },
  { name: "CV" },
  { name: "Data" },
  { name: "Model" },
  { name: "Graph" },
];

const serviceOutputType = [{ name: "File" }, { name: "Stream" }, { name: "Package" }];

const serviceOutputObject = [
  { name: "Text" },
  { name: "Image" },
  { name: "Audion" },
  { name: "Video" },
  { name: "Data" },
  { name: "Model" },
  { name: "Graph" },
  { name: "Json" },
  { name: "CSV" },
  { name: "Binary" },
  { name: "Application" },
];

export function Tasks({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  mainnetProvider,
  address,
  messageCount,
  smailMail,
  onStoreToFairOS,
  setReplyTo,
  setThreadTo,
}) {
  const [selectedServiceProvider, setSelectedServiceProvider] = useState(serviceProviders[0]);
  const [selectedService, setSelectedService] = useState(serviceProviders[0].services[0]);
  const [inputData, setInputData] = useState("");
  const [registerationProvider, setRegistrationProvider] = useState(false);
  const [registerationService, setRegistrationService] = useState(false);

  const handleServiceProviderChange = serviceProviderName => {
    const serviceProvider = serviceProviders.find(s => s.name === serviceProviderName);
    setSelectedServiceProvider(serviceProvider);
    setSelectedService(serviceProvider.services[0]);
  };
  const handleServiceChange = serviceName => {
    console.log(serviceName);
    const service = selectedServiceProvider.services.find(s => s.name === serviceName);
    setSelectedService(service);
  };

  const handleInputDataChange = event => {
    setInputData(event.target.value);
  };

  const handleSubmit = () => {
    // Implement the logic to issue the transaction
    // This will likely involve using the `fetch` API or another HTTP client
    // to send data to the specified endpoint, handling the input and output as described.
    alert("Transaction submitted for processing. Please check your inbox for results.");
  };

  const registerService = service => {
    console.log("Registering service", service);
  };
  const registerServiceProvider = serviceProvider => {
    console.log("Registering service provider", serviceProvider);
  };

  const getBrokers = async address => {
    const brokers = await readContracts.TaskBrokerage.getBrokers();
    console.log("Brokers", brokers);
  };
  const getBrokerServices = async address => {
    const services = await readContracts.TaskBrokerage.brokerGetServices(address, 0, 100);
    console.log("Services", services);
  };

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h3>
        Select Service Provider <span onClick={() => setRegistrationProvider(true)}>+</span>
      </h3>
      <Select onChange={handleServiceProviderChange} value={selectedServiceProvider.name} style={{ width: "50%" }}>
        {serviceProviders.map(serviceProvider => (
          <option key={serviceProvider.name} value={serviceProvider.name}>
            {serviceProvider.name}
          </option>
        ))}
      </Select>
      <h3>
        Select a Service <span onClick={() => setRegistrationService(true)}>+</span>
      </h3>
      <Select onChange={handleServiceChange} value={selectedService.name} style={{ width: "50%" }}>
        {selectedServiceProvider.services.map(service => (
          <option key={service.name} value={service.name}>
            {service.name}
          </option>
        ))}
      </Select>
      {selectedService && <>&nbsp; &nbsp; &nbsp;{selectedService.description}</>}
      {/* <p>Cost of Service: {selectedService.cost}</p> */}
      <hr />
      <h3>Input</h3>
      {selectedService.input === "text" ? (
        <Input.TextArea
          placeholder="Enter text here"
          value={inputData}
          onChange={handleInputDataChange}
          style={{ width: "60%" }}
          autosize={{ minRows: "10", maxRows: "20" }}
        />
      ) : (
        // <Input.TextArea maxLength={4096} rows={10} autosize={{ minRows: "10", maxRows: "20" }} />
        <input type="file" onChange={handleInputDataChange} />
      )}
      <hr />
      <Button onClick={handleSubmit}>Issue Task</Button>
      <hr />
      <DisplayServiceProvider serviceProvider={selectedServiceProvider} onSetSelectedService={handleServiceChange} />
      <DisplayService service={selectedService} />

      <Modal
        visible={registerationProvider}
        style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
        title={<h3>Register service provider details</h3>}
        maskClosable={true}
        footer={null}
        onOk={() => {
          setRegistrationProvider(false);
        }}
        onCancel={() => {
          setRegistrationProvider(false);
        }}
      >
        <ServiceProviderForm onSubmit={registerServiceProvider} />
      </Modal>

      <Modal
        visible={registerationService}
        style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
        title={<h3>Register service details</h3>}
        maskClosable={true}
        footer={null}
        onOk={() => {
          setRegistrationService(false);
        }}
        onCancel={() => {
          setRegistrationService(false);
        }}
      >
        <ServiceForm onSubmit={registerService} />
      </Modal>
    </div>
  );
}

export default Tasks;
