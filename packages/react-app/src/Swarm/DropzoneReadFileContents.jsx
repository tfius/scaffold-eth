import React, { useCallback } from "react";
import { Card } from "antd";
import { uploadFileToBee } from "./../Swarm/BeeService";
import { useDropzone } from "react-dropzone";

export function DropzoneReadFileContents({ refObj, onAdd }) {
  const onDrop = useCallback(async acceptedFiles => {
    //console.log(refObj, onAdd, acceptedFiles);
    //acceptedFiles.forEach(file => {
    for (const file of acceptedFiles) {
      //const hash = await uploadFileToBee(file);
      // onFileUploaded(hash, file);

      const reader = new FileReader();
      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        const binaryStr = reader.result; // Do whatever you want with the file contents
        // console.log("Dropzone FormGather got data", file, binaryStr);
        refObj.addAttachment(file, binaryStr);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      style={{
        margin: "5%",
        borderRadius: "5px",
        border: "1px",
        borderStyle: "dotted",
        padding: "10px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: "#a0a0a033",
      }}
    >
      <input {...getInputProps()} />
      📎 Attach files or drop files here
    </div>
  );
}

export default DropzoneReadFileContents;
