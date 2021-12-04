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
      props.onCanCreate(false);
      props.onMimeType(filesArray[0].type);
      props.onFilename(filesArray[0].name);

      const hash = await uploadFileToBee(filesArray[0]);
      console.log("upload hash", "0x" + hash);
      
      props.onDataUpload("0x" + hash);

      props.onCanCreate(true);
    } catch (error) {
      console.error(error);

      props.onError(error.toString());
      props.onMimeType("");
      props.onFilename("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the files here ...</p> : <p>Drag 'n' drop some files here, or click to select files</p>}
    </div>
  );
};

export default FileUpload;
