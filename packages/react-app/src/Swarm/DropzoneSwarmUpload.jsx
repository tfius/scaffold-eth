import React, { useCallback } from "react";
import { Card } from "antd";
import { uploadFileToBee } from "./../Swarm/BeeService";
import { useDropzone } from "react-dropzone";

export function DropzoneSwarmUpload({ onFileUploaded }) {
  const onDrop = useCallback(async acceptedFiles => {
    //acceptedFiles.forEach(file => {
    for (const file of acceptedFiles) {
      const hash = await uploadFileToBee(file);
      onFileUploaded(hash, file);
      /*
        const reader = new FileReader();
        reader.onabort = () => console.log("file reading was aborted");
        reader.onerror = () => console.log("file reading has failed");
        reader.onload = () => {
          const binaryStr = reader.result; // Do whatever you want with the file contents
          console.log("Dropzone FormGather got data", binaryStr);
        };
        reader.readAsArrayBuffer(file);
        */
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Card {...getRootProps()} bordered={false} hoverable style={{ margin: "5%" }}>
      <input {...getInputProps()} />
      Add attachments or Drop files here
    </Card>
  );
}

export default DropzoneSwarmUpload;
