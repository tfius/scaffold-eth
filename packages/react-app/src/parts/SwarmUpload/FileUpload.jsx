import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useStore, metadataTypes } from "../../state";
import { Select, Input, Button, Spin } from "antd";

const thumb = {
  display: "inline-flex",
  borderRadius: 2,
  border: "1px solid #eaeaea",
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "auto",
  height: "100%",
};

const FileUpload = props => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const {
    options: { tx, writeContracts, selectedCollection, address, metadataAddress, locationAddress },
  } = props;
  const {
    state: { file, hash, loading, error, errorMessage },
    dispatch,
  } = useStore();

  const onDrop = async files => {
    if (files.length > 0) {
      let file = files[0];
      dispatch({ type: "UPLOAD_TO_SWARM", payload: file });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <>
      <span style={{ color: "red" }}> {errorMessage} </span>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the file here ...</p> : <strong>Drop your file here, or click to select one</strong>}
      </div>
      <>
        {file?.filesize && file.filesize !== 0 && (
          <>
            <br />
            <strong>{file?.filename}</strong> <br />
            <small>
              {loading ? (
                <>
                  <Spin /> {file?.mimeType}
                </>
              ) : (
                file?.mimeType
              )}
            </small>
            <br />
            {file?.mimeType.includes("image") && (
              <>
                <div style={thumb}>
                  <div style={thumbInner}>
                    <img src={file?.previewUrl} style={img} />
                  </div>
                </div>
                <br />
              </>
            )}
            <small>{file?.filesize} Kb</small> <br />
            <br />
            <div hidden={hash === null}>
              <span>Type: </span>
              <Select
                style={{ width: "200px" }}
                showSearch
                value={file?.selectedType}
                onChange={value => {
                  console.log(`selected ${value} ${metadataTypes[value].metadata}`);
                  //setSelectedCollection(value);
                  setMetadataAddress(metadataTypes[value].metadata);
                  setSelectedType(metadataTypes[value].name);
                }}
              >
                {metadataTypes
                  ? metadataTypes.map((collection, index) => (
                      <Select.Option key={collection.metadata + "" + index} value={index}>
                        {index}: {collection.name}
                      </Select.Option>
                    ))
                  : null}
              </Select>
              <Input
                style={{ width: "80%" }}
                min={0}
                size="large"
                placeholder={"Name"}
                onChange={e => {
                  try {
                    setTitle(e.target.value);
                  } catch (e) {
                    console.log(e);
                  }
                }}
              />
              <Input
                style={{ width: "80%" }}
                min={0}
                size="large"
                placeholder={"Description"}
                onChange={e => {
                  try {
                    setText(e.target.value);
                  } catch (e) {
                    console.log(e);
                  }
                }}
              />
              <br />
              <Button
                type={"primary"}
                onClick={() => {
                  dispatch({
                    type: "CREATE_DATA_TOKEN",
                    payload: {
                      tx,
                      writeContracts,
                      selectedCollection,
                      address,
                      metadataAddress,
                      locationAddress,
                      title,
                      text,
                    },
                  });
                }}
              >
                Create
              </Button>
            </div>
          </>
        )}
      </>
    </>
  );
};

export default FileUpload;
