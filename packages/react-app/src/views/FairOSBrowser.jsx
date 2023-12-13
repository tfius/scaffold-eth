import React, { useState, useEffect, useCallback } from "react";

import { ethers } from "ethers";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import { Button, List, Card, Modal, notification, Tooltip, Typography, Spin, Checkbox } from "antd";
import {
  EnterOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileOutlined,
} from "@ant-design/icons";

import { formatNumber, timeAgo, getDateTimeString } from "./../views/datetimeutils";
import * as layouts from "./layouts.js";

import { downloadDataFromBee } from "./../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "./../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";

import { AddressSimple } from "./../components";
import { SECTION_SIZE } from "@ethersphere/bee-js";

const IconText = ({ icon, tooltip, text }) => (
  <Tooltip title={tooltip}>
    {React.createElement(icon)}
    {text}
  </Tooltip>
);
const ListFiles = ({ pod, files, onFileList, leftMargin, currentDir }) => (
  <>
    {files.length > 0 && (
      <>
        <table style={{ width: "100%", marginLeft: leftMargin }}>
          <thead>
            <tr style={{ fontSize: "0.6em" }}>
              <th>Name</th>
              <th>Size</th>
              <th>Type</th>
              <th>Created</th>
              <th>Modified</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr
                key={file + "_" + index}
                onClick={() => onFileList(pod, currentDir + "/" + file.name, file.name, file.contentType)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <IconText icon={FileOutlined} tooltip="Download file" /> {file.name}
                </td>
                <td>{layouts.bytesToSize(file.size)}</td>
                <td>{file.size}</td>
                <td>{getDateTimeString(file.creationTime)}</td>
                <td>{getDateTimeString(file.modificationTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* {files.map((file, index) => (
      <span
        className="fairos podFile"
        key={file + "_" + index}
        style={{ marginLeft: leftMargin }}
        onClick={() => onFileList(pod, currentDir + "/" + file.name, file.name, file.contentType)}
      >
        {file.name} <br />
      </span>
    ))} */}
  </>
);

const ListDirs = ({ pod, dirs, onDirList, onFileList, leftMargin, currentDir }) => (
  <div>
    {dirs.map((dir, index) => (
      <div className="fairos podDir" key={dir + "_" + index} style={{ marginLeft: leftMargin }}>
        <span onClick={() => onDirList(pod, dir.name)} style={{ cursor: "pointer" }}>
          <IconText icon={FolderOutlined} tooltip="View dir" /> {dir.name}
        </span>{" "}
        <ListFiles
          pod={pod}
          files={dir.files}
          onFileList={onFileList}
          leftMargin={leftMargin + 20 + "px"}
          currentDir={currentDir}
        />
        <ListDirs
          pod={pod}
          dirs={dir.folders}
          onDirList={onDirList}
          onFileList={onFileList}
          leftMargin={leftMargin + leftMargin + 30 + "px"}
          currentDir={currentDir}
        />
      </div>
    ))}
  </div>
);

export function FairOSBrowser({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  address,
  messageCount,
  smailMail,
  setReplyTo,
  mainnetProvider,
  fairOSLogin,
  fairOSPods,
  fairOSFolders,
  fairOSFiles,
}) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPod, setCurrentPod] = useState(null);
  const [currentDir, setCurrentDir] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [dirs, setDirs] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderTree, setFolderTree] = useState([{ name: "/", files: [], folders: [] }]); // tree of folders and files

  const saveFileAs = (blob, filename) => {
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      var elem = window.document.createElement("a");
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  };

  const onCheckAllChange = e => {
    setChecked(e.target.checked ? mails.map(mail => mail.location) : []);
    setCheckAll(e.target.checked);
  };
  const onPodOpen = async pod => {
    setIsLoading(true);
    setFolderTree([{ name: "/", files: [], folders: [] }]); // tree of folders and files
    setFiles([]);
    setDirs([]);
    let resp = await window.podOpen(fairOSLogin.sessionId, pod);
    console.log("onPodOpen", resp);
    let resp2 = await window.podStat(fairOSLogin.sessionId, pod);
    console.log("onPodStat", resp2);
    setIsLoading(false);
    setCurrentPod(pod);
    setCurrentDir("/");
    if (resp == "pod opened successfully") onDirList(pod, "/");
    notification.info({
      message: resp,
      description: "'" + resp2.podName + "' opened from " + resp2.address,
    });
  };
  const findFolderInTree = (folder, tree) => {
    for (let i = 0; i < tree.length; i++) {
      console.log("finding ", folder, " in ", tree[i].name);
      if (tree[i].name == folder) {
        return tree[i];
      }
      if (tree[i].folders) {
        for (let j = 0; j < tree[i].folders.length; j++) {
          const found = findFolderInTree(folder, tree[i].folders);
          if (found) {
            return found;
          }
        }
      }
    }
    return null;
  };
  const onDirList = async (pod, dir) => {
    setIsLoading(true);
    //await onPodOpen(pod);
    console.log("onDirList", pod, dir);
    let resp = await window.dirList(fairOSLogin.sessionId, pod, dir);
    console.log("onDirList response", resp);
    notification.open({
      message: "got dir list",
      description: "'" + pod + "' " + resp.dirs?.length + " dirs, " + resp.files?.length + " files",
    });
    setCurrentDir(dir);
    // // go through all dirs you got from response and find corresponding in dirs and add files to them
    var currentFolderTree = [...folderTree];

    var rootFolder = findFolderInTree(dir, currentFolderTree);
    if (rootFolder) rootFolder.files = resp.files;

    for (var i = 0; i < resp.dirs.length; i++) {
      var folderName = dir + (dir === "/" ? "" : "/") + resp.dirs[i].name;
      console.log(`find ${folderName}`);
      var folderExists = findFolderInTree(folderName, currentFolderTree);
      if (!folderExists) {
        currentFolderTree.push({ name: folderName, folders: [], files: [] });
        console.log("added folder", folderName);
      }
    }

    console.log("currentFolderTree", currentFolderTree);
    setFolderTree(currentFolderTree);

    setDirs(resp.dirs);
    setFiles(resp.files);
    setIsLoading(false);
  };

  const onListFolder = async folder => {
    setIsLoading(true);
    let resp2 = await window.podList(fairOSLogin.sessionId);
    console.log("onListFolder", resp2);
    setIsLoading(false);
  };

  const onDownloadFile = async (pod, filepath, filename, contentType) => {
    setIsLoading(true);
    console.log("onDownloadFile", pod, filepath);
    let resp = await window.fileDownload(fairOSLogin.sessionId, pod, filepath);
    console.log("onDownloadFile response", resp);
    var blob = new Blob([resp, { type: contentType }]);
    notification.open({
      message: filename,
      description: "Ready to download",
    });
    saveFileAs(blob, filename);

    setIsLoading(false);
  };

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px" }}>
      <h1 style={{ paddingTop: "18px" }}>Browse Your FairOS</h1>
      <div className="routeSubtitle">
        {currentPod} {currentDir} {isLoading && <Spin />}
      </div>
      {/* <h3>Available Pods</h3> */}
      {fairOSPods?.pods?.map((pod, index) => (
        <div key={pod + "__" + index}>
          {pod == currentPod ? (
            <>
              <span className="podItem" key={pod + "_" + index} onClick={() => onDirList(pod, "/")}>
                <IconText icon={FolderOpenOutlined} tooltip="List" /> {pod} <br />
              </span>
              <>
                <ListDirs
                  pod={pod}
                  dirs={folderTree}
                  onDirList={onDirList}
                  onFileList={onDownloadFile}
                  leftMargin={10}
                  currentDir={currentDir}
                />
                {/* {dirs.map((dir, index) => (
                  <span className="podItem" key={dir + "_" + index} onClick={() => onDirList(pod, "/" + dir.name)}>
                    {dir.name} <br />
                  </span>
                ))}
                {files.map((file, index) => (
                  <table style={{ width: "100%" }} key={"table" + index}>
                    <thead>
                      <tr style={{ fontSize: "0.8em" }}>
                        <th>Name</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Created</th>
                        <th>Modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        onClick={() => onDownloadFile(pod, currentDir + "/" + file.name, file.name, file.contentType)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{file.name}</td>
                        <td>{layouts.bytesToSize(file.size)}</td>
                        <td>{file.size}</td>
                        <td>{getDateTimeString(file.creationTime)}</td>
                        <td>{getDateTimeString(file.modificationTime)}</td>
                      </tr>
                    </tbody>
                  </table>
                ))} */}
              </>
            </>
          ) : (
            <span className="podItem" key={pod + "_" + index} onClick={() => onPodOpen(pod)}>
              {pod} <br />
            </span>
          )}
        </div>
      ))}

      {/* <ul>
        {fairOSPods?.sharedPods?.map((pod, index) => (
          <li className="shared podItem" key={pod + "_s_" + index} onClick={() => onPodOpen(pod)}>
            {pod}
          </li>
        ))}
      </ul> */}
    </div>
  );
}

export default FairOSBrowser;
