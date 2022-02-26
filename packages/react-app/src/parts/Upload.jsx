import FileUpload from "./SwarmUpload/FileUpload";
import React, { useCallback, useState } from "react";
import { ethers } from "ethers";

const metadataTypes = [
  { name: "Unknown", metadata: "0x0000000000000000000000000000000000000000000000000000000000000000" }, //0
  { name: "Audio", metadata: "0x0000000000000000000000000000000000000000000000000000000000000001" }, // 1
  { name: "Image", metadata: "0x0000000000000000000000000000000000000000000000000000000000000002" }, // 2
  { name: "Video", metadata: "0x0000000000000000000000000000000000000000000000000000000000000003" }, // 3
  { name: "3D Model", metadata: "0x0000000000000000000000000000000000000000000000000000000000000004" }, // 4
  { name: "Animation", metadata: "0x0000000000000000000000000000000000000000000000000000000000000004" }, // 5
  { name: "Source Code", metadata: "0x0000000000000000000000000000000000000000000000000000000000000005" }, // 6
  { name: "Docs", metadata: "0x0000000000000000000000000000000000000000000000000000000000000006" }, // 7
  { name: "Sheets", metadata: "0x0000000000000000000000000000000000000000000000000000000000000007" }, // 8
  { name: "Slides", metadata: "0x0000000000000000000000000000000000000000000000000000000000000008" }, // 9
  { name: "Forms", metadata: "0x0000000000000000000000000000000000000000000000000000000000000009" }, // 10
  { name: "PDF", metadata: "0x0000000000000000000000000000000000000000000000000000000000000010" }, // 11
  { name: "Calendar", metadata: "0x0000000000000000000000000000000000000000000000000000000000000011" }, // 12
  { name: "CSV", metadata: "0x0000000000000000000000000000000000000000000000000000000000000012" }, // 13
  { name: "VCard", metadata: "0x0000000000000000000000000000000000000000000000000000000000000013" }, // 14
  { name: "JSON", metadata: "0x0000000000000000000000000000000000000000000000000000000000000014" }, // 15
  { name: "Text", metadata: "0x0000000000000000000000000000000000000000000000000000000000000015" }, // 16
];

export default function Upload({ onDataUpload }) {
  const [mimeType, setMimeType] = useState();
  const [file, setFile] = useState();
  const [mimeHash, setMimeHash] = useState();
  const [metadataAddress, setMetadataAddress] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [filename, setFilename] = useState();
  const [filesize, setFilesize] = useState(0);
  const [canCreate, setCanCreate] = useState(true); // todo refactor name
  const [error, setError] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  const onSetMimeType = useCallback(mime => {
    var mimebytes = ethers.utils.toUtf8Bytes(mime);
    var mimehash = ethers.utils.keccak256(mimebytes);
    console.log("mimehash", mime, mimebytes, mimehash);

    setMimeHash(mimehash);
    setMimeType(mime);

    var valType = 0; //var mime = new TextDecoder().decode(mimes);

    if (typeof mime === "string" || mime instanceof String) {
      if (mime.includes("audio") == true) valType = 1;
      else if (mime.includes("image") == true) valType = 2;
      else if (mime.includes("video") == true) valType = 3;
      else if (mime.includes("3dmodel") == true) valType = 4;
      // TODO: FIX need to get file extension to get proper type
      else if (mime.includes("animation") == true) valType = 5;
      // TODO: FIX need to get file extension to get proper type
      else if (mime.includes("sourcecode") == true) valType = 6;
      // TODO: FIX need to get file extension to get proper type
      else if (mime.includes("spreadsheet") == true) valType = 8;
      else if (mime.includes("document") == true) valType = 7;
      else if (mime.includes("presentation") == true) valType = 9;
      else if (mime.includes("form") == true) valType = 10;
      else if (mime.includes("pdf") == true) valType = 11;
      else if (mime.includes("text/calendar") == true) valType = 12;
      else if (mime.includes("text/csv") == true) valType = 13;
      else if (mime.includes("text/x-vcard") == true) valType = 14;
      else if (mime.includes("application/json") == true) valType = 15;
      else if (mime.includes("text/plain") == true) valType = 16;

      setMetadataAddress(metadataTypes[valType].metadata);
      setSelectedType(metadataTypes[valType].name);
    }
  });

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

  const thumbPreview = file => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img src={file.preview} style={img} />
      </div>
    </div>
  );

  console.log("File: ", file);

  return (
    <div style={{ borderRadius: "10px", margin: "auto" }} className="ant-card-body">
      <FileUpload
        onDataUpload={onDataUpload}
        onMimeType={onSetMimeType}
        onFilename={setFilename}
        onFilesize={setFilesize}
        onCanCreate={setCanCreate}
        onError={setError}
        onSetPreviewFile={setFile}
      />
      {/* <aside>{file?.path}</aside> */}
    </div>
  );
}
