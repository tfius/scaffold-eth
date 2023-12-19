import React, { useState, useEffect, useCallback } from "react";

import { ethers } from "ethers";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import { Button, List, Card, Modal, notification, Tooltip, Typography, Spin, Checkbox } from "antd";
import {
  EnterOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileOutlined,
} from "@ant-design/icons";

import { formatNumber, timeAgo, getDateTimeString } from "./datetimeutils.js";
import * as layouts from "./layouts.js";

import { downloadDataFromBee } from "../Swarm/BeeService.js";
import * as consts from "./consts.js";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";

import { AddressSimple } from "../components/index.js";
import { SECTION_SIZE } from "@ethersphere/bee-js";

const IconText = ({ icon, tooltip, text }) => (
  <Tooltip title={tooltip}>
    {React.createElement(icon)}
    {text}
  </Tooltip>
);
const ListFiles = ({ pod, files, onFileList, leftMargin, currentDir }) => (
  <div style={{ marginLeft: leftMargin }}>
    {files.length > 0 && (
      <table style={{ width: "95%" }}>
        <thead>
          <tr style={{ fontSize: "0.6em" }}>
            <th>Name</th>
            <th style={{ textAlign: "right" }}>Size</th>
            {/* <th>Type</th> */}
            <th style={{ textAlign: "right" }}>Created</th>
            {/* <th>Modified</th> */}
          </tr>
        </thead>
        <tbody>
          {files.map((file, index) => (
            <tr key={file + "_" + index}>
              <td>
                <IconText
                  style={{ cursor: "pointer" }}
                  icon={FileOutlined}
                  tooltip="Download file"
                  onClick={() => onFileList(pod, currentDir + "/" + file.name, file.name, file.contentType)}
                />{" "}
                {file.name}
                {/* {leftMargin} */}
              </td>
              <td style={{ textAlign: "right" }}>{layouts.bytesToSize(file.size)}</td>
              {/* <td>{file.contentType}</td> */}
              <td style={{ textAlign: "right" }}>{getDateTimeString(file.creationTime)}</td>
              {/* <td>{getDateTimeString(file.modificationTime)}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

function ListDirs({ pod, dirs, onDirList, onFileList, leftMargin, currentDir }) {
  const [margin, setMargin] = useState(leftMargin + 10);
  return (
    <div className="fairos podDir" style={{ marginLeft: leftMargin }}>
      {dirs.map((dir, index) => (
        <div key={dir + "_" + index}>
          <span onClick={() => onDirList(pod, dir.name)} style={{ cursor: "pointer" }} className="podDirItem">
            <IconText icon={FolderOutlined} tooltip="View dir" /> <strong>{dir.name}</strong>
            {/* {leftMargin} */}
          </span>{" "}
          <ListFiles pod={pod} files={dir.files} onFileList={onFileList} leftMargin={margin} currentDir={currentDir} />
          <ListDirs
            pod={pod}
            dirs={dir.folders}
            onDirList={onDirList}
            onFileList={onFileList}
            leftMargin={margin}
            currentDir={currentDir}
          />
        </div>
      ))}
    </div>
  );
}

export function FairOSStoreFileTo({ fairOSLogin, fairOSPods, modalControl, fairOSFileObject }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPod, setCurrentPod] = useState(null);

  useEffect(() => {
    console.log("fairOSPods", fairOSPods);
  }, []);

  const storeToPod = async pod => {
    setIsLoading(true);
    setCurrentPod(pod);
    var r = await window.podOpen(fairOSLogin.sessionId, pod);
    console.log("open pod", r);
    console.log("storing ", fairOSFileObject.path, "length", fairOSFileObject.uint8array.byteLength);
    try {
      var result = await window.fileUpload(
        fairOSLogin.sessionId,
        pod,
        "/",
        fairOSFileObject.uint8array,
        fairOSFileObject.path,
        fairOSFileObject.uint8array.byteLength,
        "8Mb",
        "",
      );
      console.log("result fileUpload", result);
      notification.success({
        message: "File stored to POD",
        description: "File stored to POD",
      });
    } catch (e) {
      console.log("error", e);
      notification.error({
        message: "Error storing file to POD",
        description: "Error storing file to POD",
      });
    }
    modalControl(false, null);
    setIsLoading(false);
  };

  return (
    <Modal
      style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
      title={
        <h3>
          {isLoading === true ? (
            <>
              Storing '{fairOSFileObject.path}' to '{currentPod}'
              <Spin />
            </>
          ) : (
            <>Your FairOS PODs</>
          )}{" "}
        </h3>
      }
      footer={null}
      visible={true}
      maskClosable={false}
      onOk={() => {}}
      onCancel={() => {
        modalControl(false);
      }}
    >
      {isLoading === false && (
        <>
          <h3>Choose POD to store '{fairOSFileObject.path}' to</h3>
          {fairOSPods?.pods?.map((pod, index) => (
            <div className="podItem" key={pod + "__" + index} onClick={() => storeToPod(pod)}>
              {pod}
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}

export default FairOSStoreFileTo;
