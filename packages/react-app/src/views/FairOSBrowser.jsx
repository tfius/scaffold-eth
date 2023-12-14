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
          <span onClick={() => onDirList(pod, dir.name)} style={{ cursor: "pointer" }}>
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
  //const [dirs, setDirs] = useState([]);
  //const [files, setFiles] = useState([]);
  var [folderTree, setFolderTree] = useState([{ name: "/", files: [], folders: [] }]); // tree of folders and files

  useEffect(() => {
    console.log("fairOSPods", fairOSPods);
    /*
    var tree = [];
    for (let i = 0; i < fairOSPods?.pods?.length; i++) {
      tree.push({
        name: fairOSPods.pods[i],
        files: [],
        folders: [{ name: "/", files: [], folders: [], pod: fairOSPods.pods[i] }],
      });
    }
    console.log("tree", tree);
    setFolderTree(tree);
    */
  }, []);

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
    folderTree = [{ name: "/", files: [], folders: [] }]; // tree of folders and files
    let resp = await window.podOpen(fairOSLogin.sessionId, pod);
    console.log("onPodOpen", resp);
    let resp2 = await window.podStat(fairOSLogin.sessionId, pod);
    console.log("onPodStat", resp2);
    setIsLoading(false);
    setCurrentPod(pod);
    setCurrentDir("/");
    //setFolderTree([{ name: "/", files: [], folders: [] }]); // tree of folders and files
    notification.info({
      message: resp,
      description: "'" + resp2.podName + "' opened from " + resp2.address,
    });
    if (resp == "pod opened successfully") await onDirList(pod, "/");
  };
  // seek only first level to find pod
  const findPodInTree = (pod, tree) => {
    for (let i = 0; i < tree.length; i++) {
      console.log("finding ", pod, " in ", tree[i].name);
      if (tree[i].name == pod) {
        return tree[i];
      }
    }
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
      description: "'" + pod + "' " + dir + ":" + resp.dirs?.length + " dirs, " + resp.files?.length + " files",
    });
    setCurrentDir(dir);
    let currentFolderTree = [...folderTree]; // // go through all dirs you got from response and find corresponding in dirs and add files to them

    //var inPod = findPodInTree(pod, currentFolderTree);
    //console.log("inPod", inPod);
    var rootFolder = findFolderInTree(dir, currentFolderTree);
    if (rootFolder) rootFolder.files = resp.files;

    for (var i = 0; i < resp.dirs.length; i++) {
      var folderName = dir + (dir === "/" ? "" : "/") + resp.dirs[i].name;
      console.log(`find ${folderName}`);
      var folderExists = findFolderInTree(folderName, rootFolder);
      if (!folderExists) {
        rootFolder.folders.push({ name: folderName, folders: [], files: [], pod: pod });
        console.log("added folder", folderName);
      }
    }

    console.log("currentFolderTree", currentFolderTree);
    setFolderTree(currentFolderTree);
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
      <h1 style={{ paddingTop: "18px" }}>Browse Your FairOS {isLoading && <Spin />}</h1>
      {/* <div className="routeSubtitle">
        {currentPod} {currentDir} {isLoading && <Spin />}
      </div> */}
      {fairOSPods?.pods?.map((pod, index) => (
        <div key={pod + "__" + index}>
          {pod == currentPod ? (
            <>
              <span className="routeSubtitle" key={pod + "_" + index} onClick={() => onDirList(pod, "/")}>
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
              </>
            </>
          ) : (
            <span className="podItem" key={pod + "_" + index} onClick={() => onPodOpen(pod)}>
              <IconText icon={SaveOutlined} tooltip="Pod" /> {pod} <br />
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
