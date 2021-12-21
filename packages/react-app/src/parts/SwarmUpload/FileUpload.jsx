import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFileToBee } from "./service";

// https://gw-testnet.fairdatasociety.org/access/e75defedaf98ff89100ae0b514237b871939aee2553e6a108f618d7ffe9e42a6

// e75defedaf98ff89100ae0b514237b871939aee2553e6a108f618d7ffe9e42a6

//const FileUpload = ({ onDataUpload, url }) => {
const FileUpload = (props) => {
//const { onDataUpload } = props;

  const onDrop = useCallback(async filesArray => {
    try {
      props.onCanCreate(true);

      props.onError("");
      props.onFilename(filesArray[0].name);
      props.onFilesize((filesArray[0].size/1024).toFixed(1));
      props.onMimeType("uploading");

      const hash = await uploadFileToBee(filesArray[0]);
      console.log("upload hash", "0x" + hash);
      
      props.onMimeType(filesArray[0].type);
      props.onDataUpload("0x" + hash);

      props.onCanCreate(false);
      
    } catch (error) {
      console.error(error);

      props.onError(error.toString());
      props.onMimeType("");
      props.onFilename("");
      props.onFilesize(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here ...</p> : <p>Drag 'n' drop your file here, or click to select one</p>}
    </div>
  );
};

export default FileUpload;
