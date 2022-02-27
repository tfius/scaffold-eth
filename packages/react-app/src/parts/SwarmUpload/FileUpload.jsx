import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFileToBee } from "./BeeService";
import { useStore } from "../../state";

//const FileUpload = ({ onDataUpload, url }) => {
const FileUpload = props => {
  //const { onDataUpload } = props;
  const { dispatch } = useStore();

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
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here ...</p> : <strong>Drop your file here, or click to select one</strong>}
    </div>
  );
};

export default FileUpload;
