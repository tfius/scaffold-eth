import React, { useState, useEffect, useCallback, useRef } from "react";

import { ethers } from "ethers";
import { Link, Route, useLocation } from "react-router-dom";
import { Button, List, Card, Modal, notification, Tooltip, Typography, Spin, Checkbox, Input, Switch } from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";

import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
import { formatNumber, timeAgo, getDateTimeString } from "./../views/datetimeutils";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";

import { AddressSimple, AddressInput } from "../components";
import { ComposeNewNotarization } from "./ComposeNewNotarization";
import {
  getSpanValue,
  makeChunkedFile,
  fileInclusionProofBottomUp,
  fileAddressFromInclusionProof,
} from "@fairdatasociety/bmt-js";

export function Notarization({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  mainnetProvider,
  address,
  messageCount,
  smailMail,
  onStoreToFairOS,
  setReplyTo,
  setThreadTo,
}) {
  const fileInputRef = useRef(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLookupModalVisible, setIsLookupModalVisible] = useState(false);
  // const [key, setKey] = useState(consts.emptyHash);
  // const [publicKey, setPublicKey] = useState({ x: consts.emptyHash, y: consts.emptyHash });
  const [mails, setMails] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const [messageCountTrigger, setMessageCountTrigger] = useState(0);
  const [viewMail, _setViewMail] = useState(null);
  const [viewAddress, setViewAddress] = useState(null);
  const [viewShares, setViewShares] = useState([]);

  const [page, setPage] = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [startItem, setStartItem] = useState(0);
  const [endItem, setEndItem] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [showShareAddress, setShowShareAddress] = useState(false);
  const [toAddress, setToAddress] = useState();
  const [viewSharedItems, setViewSharedItems] = useState(false);
  const [sharedItems, setSharedItems] = useState([]);
  const [displayProofChunks, setDisplayProofChunks] = useState(null);
  const [displayDocument, setDisplayDocument] = useState(null);

  const setViewMail = async mail => {
    console.log("onViewMessage", mail);
    if (mail !== null) {
      try {
        var data = await readContracts.SwarmMail.getLockerShares(address, mail.location);
        console.log("onViewMessage", data);
        setViewShares(data);
      } catch (e) {
        console.log("error", e);
      }
    }
    _setViewMail(mail);
  };

  const toggleViewShared = isChecked => {
    setViewSharedItems(isChecked);
    if (isChecked) {
      setSharedItems([]);
      getSharedItems();
    }
  };
  const getSharedItems = async () => {
    const boxCount = await readContracts.SwarmMail.getUserStats(address);
    const numSharedItems = boxCount.numSharedLockers.toNumber();
    const smails = await readContracts.SwarmMail.getEmailRange(address, 4, 0, numSharedItems);
    //console.log("getSharedItems smails", smails);

    for (var i = 0; i < smails.length; i++) {
      // get smail content
      try {
        const lockerData = await downloadDataFromBee(smails[i].swarmLocation); // returns buffer
        var d = JSON.parse(new TextDecoder().decode(lockerData));
        var decRes = EncDec.nacl_decrypt(d, smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length));
        var lockerItem = JSON.parse(decRes);
        // get shared content
        const sharedData = await downloadDataFromBee(lockerItem.location); // returns buffer
        var sharedD = JSON.parse(new TextDecoder().decode(sharedData));
        //console.log("sharedD", sharedD);

        var decSharedRes = EncDec.nacl_decrypt_with_key(
          sharedD,
          lockerItem.ephemeralKey.recipientKey,
          lockerItem.ephemeralKey.secretKey,
        );
        //console.log("decSharedRes", decSharedRes);
        var sharedLocker = {};
        sharedLocker.smail = smails[i];
        sharedLocker.sharedMail = lockerItem;
        sharedLocker.locker = JSON.parse(decSharedRes);
        //sharedLocker.

        setSharedItems(sharedItems => [...sharedItems, sharedLocker]);
        console.log("sharedLocker", sharedLocker);
      } catch (e) {
        console.log("error", e);
      }
    }
    //console.log("sharedItems", sharedItems);
    //setSharedItems(smails);
  };

  const onMessageSent = async () => {
    await updateLocker();
  };

  const updateRegistration = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return; // todo get pub key from ENS
    const data = await readContracts.SwarmMail.getPublicKeys(address);
    setIsRegistered(data.registered);
    if (isRegistered === false && data.registered) updateLocker();
  });

  var updatingLocker = false;
  const updateLocker = useCallback(async () => {
    if (updatingLocker) return;
    updatingLocker = true;
    const boxCount = await readContracts.SwarmMail.getUserStats(address);
    console.log("boxCount", boxCount);
    if (false) {
      const mailCount = boxCount.numLockers.toNumber();

      setTotalItems(mailCount);
      var allPages = Math.ceil(mailCount / pageSize);
      setMaxPages(allPages);

      var length = pageSize;
      var start = mailCount - page * pageSize;
      if (start < 0) start = 0;
      if (start + length > mailCount) length = mailCount - start;
      setStartItem(start + 1);
      setEndItem(start + length);

      const smails = await readContracts.SwarmMail.getEmailRange(address, 2, start, length);
      if (smails.length > 0) processSMails(smails);
    }
    //console.log("got smails", mails);

    const numDocuments = await readContracts.DocumentNotarization.getUserNotarizedDocumentsCount(address);
    console.log("numDocuments", numDocuments);
    const notarizationDocuments = await readContracts.DocumentNotarization.getAllUserNotarizedDocuments(address);
    console.log("notarizationDocuments", notarizationDocuments);

    var smails = [];
    for (var i = 0; i < notarizationDocuments.length; i++) {
      try {
        var doc = notarizationDocuments[i];
        var smail = await readContracts.SwarmMail.getEmailFromByType(address, 2, doc.docHash);
        smails.push(smail);
      } catch (e) {
        console.log("error", e);
      }
    }
    if (smails.length > 0) processSMails(smails);
    updatingLocker = false;
  });

  useEffect(() => {
    updateLocker();
  }, [page]);

  const retrieveNewPage = async newPage => {
    if (newPage < 1) newPage = 1;
    if (newPage > maxPages) newPage = maxPages;
    if (newPage !== page) {
      setMails([]); // clear mails
      await setPage(newPage);
    }
    console.log("retrieveNewPage", newPage);
  };

  const deleteLockerMail = useCallback(async () => {
    if (checked.length === 0) {
      notification.error({
        message: "No items selected",
        description: "Please select items to delete",
      });
      return;
    }
    console.log("got checked", checked);
    var newTx = await tx(writeContracts.SwarmMail.removeEmails(2, checked));
    await newTx.wait();
    for (var i = 0; i < checked.length; i++) {
      setMails(mails.filter(m => m.location !== checked[i])); // remove mails with same location
    }
  });

  useEffect(() => {
    if (viewAddress !== address) {
      setViewAddress(address);
      setMails([]);
    }
    updateRegistration();
  }, [address]);

  useEffect(() => {
    console.log("messageCount", messageCount, messageCountTrigger);
    if (messageCount > messageCountTrigger && !updatingLocker) updateLocker();
    setMessageCountTrigger(messageCount);
  }, [messageCount]);

  const processSMails = async sMails => {
    setIsLoading(true);
    for (let i = 0; i < sMails.length; i++) {
      var s = sMails[i];
      if (mails.findIndex(m => m.location == s.swarmLocation) != -1) continue; // skip if already existing

      var mail = { attachments: [] };
      const data = await downloadDataFromBee(s.swarmLocation); // returns buffer

      // see if mail is encrypted
      if (s.isEncryption === true) {
        //console.log("data", data, smailMail);
        try {
          var d = JSON.parse(new TextDecoder().decode(data));
          var decRes = EncDec.nacl_decrypt(d, smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length));
          mail = JSON.parse(decRes);
        } catch (e) {
          console.error("decrypt", e);
          continue;
        }
      } else {
        // do this for non encrypted mails
        try {
          mail = JSON.parse(new TextDecoder().decode(data)); //Buffer.from(data).toJSON(); // JSON.parse(data.toString());
        } catch (e) {
          console.error("processSMails", e);
        }
      }

      mail.smail = s;
      mail.time = s.time;
      mail.checked = false;
      mail.location = s.swarmLocation;
      mail.from = s.from;
      mail.signed = s.signed;
      mail.isEncryption = s.isEncryption;
      setMails(mails => [mail, ...mails]);
      console.log("smail", mail);
    }
    setIsLoading(false);
    //console.log("processedMails", mails);
  };
  const onDownloadFile = async (mail, index, attachment) => {
    setIsLoading(true);
    //console.log("onDownloadFile", mail, attachment);
    const data = await downloadDataFromBee("0x" + attachment.digest); // returns buffer
    if (mail.isEncryption === true) {
      try {
        var uint8View = new Uint8Array(data);
        var decoded = new TextDecoder().decode(uint8View);
        var d = JSON.parse(decoded);
        var decRes = EncDec.nacl_decrypt(d, smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length));
        var object = JSON.parse(decRes);
        var blob = new Blob([new Uint8Array(object.binaryData)], { type: attachment.file.type });
        saveFileAs(blob, attachment.file.path);
      } catch (e) {
        console.error("decrypt", e);
      }
    } else {
      saveFileAs(new Blob([data], { type: attachment.file.type }), attachment.file.path);
    }
    setIsLoading(false);
  };

  const onDownloadLockerFile = async (sharedLocker, index, attachment) => {
    setIsLoading(true);
    console.log("onDownloadLockerFile", sharedLocker, attachment);
    const data = await downloadDataFromBee("0x" + attachment.digest); // returns buffer
    try {
      var uint8View = new Uint8Array(data);
      var decoded = new TextDecoder().decode(uint8View);
      var d = JSON.parse(decoded);
      var decRes = EncDec.nacl_decrypt_with_key(
        d,
        sharedLocker.sharedMail.ephemeralKey.recipientKey,
        sharedLocker.sharedMail.ephemeralKey.secretKey,
      ); //
      var object = JSON.parse(decRes);
      var blob = new Blob([new Uint8Array(object.binaryData)], { type: attachment.file.type });
      saveFileAs(blob, attachment.file.path);
    } catch (e) {
      console.error("decrypt", e);
    }
    setIsLoading(false);
  };

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
  const IconText = ({ icon, tooltip, text }) => (
    <Tooltip title={tooltip}>
      {React.createElement(icon)}
      {text}
    </Tooltip>
  );

  const retrievePubKey = async forAddress => {
    try {
      const data = await readContracts.SwarmMail.getPublicKeys(forAddress);
      const rkey = data.pubKey.substr(2, data.pubKey.length - 1);
      var pk = Buffer.from(rkey, "hex").toString("base64");
      if (data.pubKey === "0x0000000000000000000000000000000000000000000000000000000000000000") pk = null;
      return pk;
    } catch (e) {
      console.log(e);
    }
  };
  const unshareWith = async (lockerLocation, keyLocation, withAddress) => {
    console.log("unshareWith", lockerLocation, keyLocation, withAddress);
    let newTx = await tx(
      writeContracts.SwarmMail.unshareLockerWith(lockerLocation, keyLocation, withAddress),
      //,{ value: cost }),
      // TODO make method payable
    );
  };
  const shareLocker = async locker => {
    //console.log("shareLocker", locker);
    // to convert call this:
    var ephemeralKey = {
      publicKey: new Uint8Array(Buffer.from(locker.ephemeralKey.recipientKey, "base64")),
      secretKey: new Uint8Array(Buffer.from(locker.ephemeralKey.secretKey, "base64")),
    };

    const shareLockerObject = {
      //subject: locker.subject,
      //contents: locker.contents,
      //isEncryption: locker.isEncryption,
      //attachments: locker.attachments,
      sender: locker.from,
      location: locker.location,
      ephemeralKey: locker.ephemeralKey,
    };

    var recipientPubKey = await retrievePubKey(toAddress);
    if (recipientPubKey === null) {
      setShowShareAddress(false);
      notification.error({
        message: "Recipient has not registered a public key",
        description: "Please ask the recipient to first register",
      });
      return;
    }

    var mail = JSON.stringify(shareLockerObject);
    mail = JSON.stringify(EncDec.nacl_encrypt(mail, recipientPubKey));
    const keyLocation = await uploadDataToBee(mail, "application/octet-stream", Date.now() + ".locker"); // ms-mail.json

    var cost = "1000000000";
    let newTx = await tx(
      writeContracts.SwarmMail.shareLockerWith(locker.location, "0x" + keyLocation, toAddress, { value: cost }),
      // TODO make method payable
    );

    console.log("shareLocker", keyLocation, shareLockerObject, toAddress);
    setShowShareAddress(false);
    setViewMail(null);
    notification.info({
      message: "Shared",
      description: "Recipient can now view your locker",
    });
  };

  const doAttestation = async mail => {
    console.log("doAttestation", mail);
    console.log("mail.attachments", mail.locker.attachments);
    if (mail.locker.attachments.length === 0) {
      notification.error({
        message: "Attestation failed",
        description: "No attachments with inclusions found",
      });
      return;
    }

    try {
      var fileAddress = mail.locker.attachments[0].inclusion;

      var document = await readContracts.DocumentNotarization.getDocumentByProof(fileAddress);
      console.log("document", document);

      var docLocation = document.docHash;

      //var tx = new Tx(readContracts.DocumentNotarization.attestDocument(mail.location, true)
      var checked = true;
      var newTx = await tx(writeContracts.DocumentNotarization.attestDocument(docLocation, checked));
      await newTx.wait();
    } catch (e) {
      console.log("error", e);
      notification.error({
        message: "Attestation failed",
        description: "Either package is not valid or you are not verified",
      });
    }
  };

  function displayProof(mail, proofIdx) {
    console.log("displayProof", mail, proofIdx);
    if (mail.proofs[proofIdx] === displayProofChunks) {
      setDisplayProofChunks(null);
      return;
    }
    setDisplayProofChunks(mail.proofs[proofIdx]);
  }
  // Handle file input change
  const handleLookUpFileChange = async event => {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      // read file contents as uint8 array
      const reader = new FileReader();
      reader.onload = async e => {
        const fileBytes = new Uint8Array(e.target.result);
        const chunkedFile = makeChunkedFile(fileBytes);
        var chunkedAddress = "0x" + Buffer.from(chunkedFile.address()).toString("hex"); //"0x" +

        console.log("chunkedAddress", chunkedAddress);
        verifyDocumentInNotary(chunkedAddress);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleLookupFileButtonClick = () => {
    setDisplayDocument(null);
    // Trigger the hidden file input's click event
    fileInputRef.current.click();
  };

  const verifyDocumentInNotary = async fileAddress => {
    try {
      var document = await readContracts.DocumentNotarization.getDocumentByProof(fileAddress);
      /*
    docHash: "0xbb435ae6764f533302a9b2268528bc174a08dde067d5bf814abcfad61c8e9029"
    isAttested: false
    metaHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
    owner: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
    timestamp: BigNumber {_hex: '0x65e797d0', _isBigNumber: true}
    */

      console.log("document", document);
      setDisplayDocument(document);
    } catch (e) {
      console.log("error", e);
      notification.info({
        message: "Document not found",
        description: "No such document was notarized",
      });
    }
  };

  if (address === undefined) {
    return (
      <div style={{ top: "50%", left: "50%", position: "absolute" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!isRegistered) {
    return (
      <>
        <h1 style={{ paddingTop: "18px" }}>Locker</h1>
        <Card>
          <Typography>
            <h5>Not Registered</h5>
            It appears your account is not registred yet. Please <Link to="/">register</Link> to store your encrypted
            data.
          </Typography>
        </Card>
      </>
    );
  }
  if (isRegistered && smailMail.smailPrivateKey === null) {
    return (
      <>
        <Card>
          <Typography>
            <h5>Not bonded</h5>
            It appears you did not decrypt your Smail. Please go to <Link to="/">register</Link> and decrypt your
          </Typography>
        </Card>
      </>
    );
  }

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1>Document notarization </h1>
      <div className="routeSubtitle">Notarization services for encrypted data packages {isLoading && <Spin />}</div>
      <div className="paginationInfo">
        {startItem}-{endItem} of {totalItems} &nbsp;&nbsp;&nbsp;
        <a onClick={() => retrieveNewPage(page - 1)}>{"<"}</a>&nbsp;{page}/{maxPages}&nbsp;
        <a onClick={() => retrieveNewPage(page + 1)}>{">"}</a>
      </div>

      <>
        <div style={{ paddingLeft: "6px", paddingTop: "10px", paddingBottom: "10px" }}>
          <Checkbox
            indeterminate={indeterminate}
            onChange={onCheckAllChange}
            checked={checkAll}
            disabled={viewSharedItems}
          />{" "}
          &nbsp;
          <Tooltip title="Refresh">
            <Button onClick={() => updateLocker()} disabled={viewSharedItems}>
              🗘
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button onClick={() => deleteLockerMail()} disabled={viewSharedItems}>
              🗑
            </Button>
            &nbsp;
          </Tooltip>
          <Tooltip title="Add notarization package">
            <Button onClick={() => setIsModalVisible(true)}>Notarize package</Button>&nbsp;
          </Tooltip>
          <Tooltip title="Find package with inclusion">
            <Button onClick={() => setIsLookupModalVisible(true)}>Lookup</Button>&nbsp;
          </Tooltip>
          <Tooltip title="View shared items">
            <Switch checked={viewSharedItems} onChange={toggleViewShared} />
          </Tooltip>
        </div>
        {viewSharedItems === true ? (
          <>
            <List
              itemLayout="horizontal"
              dataSource={sharedItems}
              renderItem={mail => (
                <List.Item style={{ marginBottom: "5px", marginTop: "0px", padding: "0px" }}>
                  <List.Item.Meta
                    title={
                      <>
                        <Tooltip title={<AddressSimple address={mail.sharedMail.sender} placement="right" />}>
                          {mail.locker.subject}
                        </Tooltip>{" "}
                        {/* {mail.locker.contents} */}
                        <Tooltip
                          title={
                            <>
                              Send message with{" "}
                              <AddressSimple address={mail.smail.from} ensProvider={mainnetProvider} />
                            </>
                          }
                        >
                          <span
                            onClick={() => setReplyTo(mail.smail.from, true, "Re Locker: #" + mail.location)}
                            style={{ cursor: "pointer" }}
                          >
                            &nbsp;⇽&nbsp;
                          </span>
                        </Tooltip>
                      </>
                    }
                    description={
                      <>
                        <div>
                          {mail.locker.inclusionProofs != undefined && mail.locker.inclusionProofs.length > 0 && (
                            <Tooltip title="This package is notarized and has inclusion proofs. You can do attestation, if you are verified.">
                              <small onClick={() => doAttestation(mail)}>
                                Do attestation this notarization package
                              </small>
                            </Tooltip>
                          )}
                        </div>
                        <div style={{ maxHeight: "2.7rem", overflow: "hidden" }}>{mail.locker.contents}</div>

                        {console.log("mail.locker", mail)}
                        <div>
                          {mail.locker.attachments.length > 0 && (
                            <>
                              {mail.locker.attachments.map((a, i) => (
                                <Tooltip
                                  title={
                                    <>
                                      {a.file.path} <br /> <small>{a.file.type}</small>
                                    </>
                                  }
                                  key={a.digest}
                                >
                                  <span
                                    style={{
                                      cursor: "pointer",
                                      display: "inline-block",
                                      border: "1px solid #00000055",
                                      borderRadius: "5px",
                                      paddingLeft: "0.2rem",
                                      width: "150px",
                                      overflow: "hidden",
                                      textAlign: "center",
                                      textOverflow: "ellipsis",
                                      overflowWrap: "anywhere",
                                      fontSize: "0.7rem",
                                      marginRight: "20px",
                                      marginTop: "3px",
                                      maxHeight: "1.1rem",
                                      background: "#88888888",
                                    }}
                                    onClick={() => onDownloadLockerFile(mail, i, a)}
                                  >
                                    {a.file.path}
                                  </span>
                                </Tooltip>
                              ))}
                            </>
                          )}
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
            <hr />
          </>
        ) : (
          <>
            <Checkbox.Group
              style={{ width: "100%" }}
              value={checked}
              onChange={checkedValues => {
                setChecked(checkedValues);
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={mails}
                renderItem={mail => (
                  <List.Item style={{ marginBottom: "5px", marginTop: "0px", padding: "0px" }}>
                    <List.Item.Meta
                      style={{
                        background: mail.isEncryption ? "#4000ff00" : "#4000ff10",
                        borderRadius: "5px",
                        paddingBottom: "5px",
                        paddingTop: "5px",
                        paddingRight: "5px",
                        paddingLeft: "5px",
                      }}
                      avatar={
                        <>
                          <Checkbox value={mail.location} style={{ margin: "0rem 1rem 0rem 0rem" }} />
                          <Tooltip title={<AddressSimple address={mail.from} />}>
                            <span>
                              <Blockies className="mailIdenticon" seed={mail.from} size="8" />
                            </span>
                          </Tooltip>
                        </>
                      }
                      title={
                        <div
                          style={{
                            marginTop: "1px",
                            maxHeight: "1.3rem",
                            width: "98%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            overflowWrap: "anywhere",
                          }}
                        >
                          <strong
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setViewMail(mail);
                              setDisplayProofChunks(null);
                            }}
                          >
                            {mail.subject}
                          </strong>

                          {mail.isEncryption === false && (
                            <IconText
                              icon={InfoCircleOutlined}
                              tooltip="This message is not encrypted"
                              key="list-vertical-signed-o"
                            />
                          )}
                          {/* {mail.signed === true ? (
                        <span style={{ float: "right", right: "0px" }}>
                          <IconText
                            icon={EditOutlined}
                            tooltip="You signed statement of acknowledgment for this message"
                            key="list-vertical-signed-o"
                          />
                        </span>
                      ) : (
                        <span
                          onClick={e => onSignMail(mail)}
                          style={{ float: "right", right: "0px", top: "0px", cursor: "pointer" }}
                        >
                          <IconText icon={EnterOutlined} tooltip="List locker on data hub" key="list-vertical-sign-o" />
                        </span>
                      )} */}
                        </div>
                      }
                      description={
                        <>
                          <div style={{ maxHeight: "2.7rem", overflow: "hidden" }}>{mail.contents}</div>
                          <div>
                            {mail.attachments.length > 0 && (
                              <>
                                {mail.attachments.map((a, i) => (
                                  <Tooltip
                                    title={
                                      <>
                                        {a.file.path} <br /> <small>{a.file.type}</small>
                                      </>
                                    }
                                    key={a.digest}
                                  >
                                    <span
                                      style={{
                                        cursor: "pointer",
                                        display: "inline-block",
                                        border: "1px solid #00000055",
                                        borderRadius: "5px",
                                        paddingLeft: "0.2rem",
                                        width: "150px",
                                        overflow: "hidden",
                                        textAlign: "center",
                                        textOverflow: "ellipsis",
                                        overflowWrap: "anywhere",
                                        fontSize: "0.7rem",
                                        marginRight: "20px",
                                        marginTop: "3px",
                                        maxHeight: "1.1rem",
                                        background: "#88888888",
                                      }}
                                      onClick={() => onDownloadFile(mail, i, a)}
                                    >
                                      {a.file.path}
                                    </span>
                                  </Tooltip>
                                ))}
                              </>
                            )}
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            </Checkbox.Group>
          </>
        )}
      </>
      {viewMail && (
        <Modal
          className="largerModal"
          style={{ width: "100%", resize: "auto", borderRadious: "20px" }}
          title={
            <>
              <h3>{viewMail.subject}</h3>
              {/* <small>
                {" "}
                <AddressSimple address={viewMail.sender} />
              </small>
              <span style={{ float: "right", verticalAlignement: "top" }}>
                <Tooltip title={<AddressSimple address={viewMail.sender} />}>
                  <span>
                    <Blockies className="mailIdenticon" seed={viewMail.sender} size="4" />
                  </span>
                </Tooltip>
              </span> */}
            </>
          }
          footer={null}
          visible={true}
          //   maskClosable={false}
          onOk={() => {
            //setModal(null);
          }}
          onCancel={() => {
            setViewMail(null);
          }}
        >
          <MarkdownPreview
            source={viewMail.contents}
            style={{ backgroundColor: "transparent", color: "inherit" }}
            darkMode={true}
            wrapperElement={{
              "data-color-mode": "dark",
            }}
          />
          <br />

          {showShareAddress === true ? (
            <div>
              <AddressInput
                autoFocus
                ensProvider={mainnetProvider}
                placeholder="to address"
                address={toAddress}
                onChange={setToAddress}
              />
              <br />
              <Button type="primary" onClick={() => shareLocker(viewMail)}>
                SHARE
              </Button>
              <br />
              <i>This will share your contents with receiver.</i>
            </div>
          ) : (
            <Button onClick={() => setShowShareAddress(true)}>SHARE</Button>
          )}

          <div>
            {viewMail.attachments.length > 0 && (
              <>
                <br />
                {viewMail.attachments.map((a, i) => (
                  <Tooltip
                    title={
                      <>
                        {a.file.path} <br /> <small>{a.file.type}</small>
                      </>
                    }
                    key={a.digest}
                  >
                    <span
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        border: "1px solid #00000055",
                        borderRadius: "5px",
                        paddingLeft: "0.2rem",
                        width: "200px",
                        overflow: "hidden",
                        textAlign: "center",
                        textOverflow: "ellipsis",
                        overflowWrap: "anywhere",
                        fontSize: "0.7rem",
                        marginRight: "20px",
                        marginTop: "3px",
                        maxHeight: "1.1rem",
                        background: "#88888888",
                      }}
                      onClick={() => onDownloadFile(viewMail, i, a)}
                    >
                      {a.file.path}
                    </span>
                  </Tooltip>
                ))}
              </>
            )}
          </div>
          <div>
            <h5>References</h5>
            {viewMail.inclusionProofs.length > 0 && (
              <>
                {viewMail.inclusionProofs.map((inclusionProof, i) => (
                  <div key={i}>
                    <small onClick={() => displayProof(viewMail, i)}>
                      {inclusionProof}
                      <br />
                    </small>
                  </div>
                ))}
              </>
            )}
            {displayProofChunks && (
              <div>
                <h5>Inclusion proofs</h5>
                <small>{JSON.stringify(displayProofChunks)}</small>
              </div>
            )}
          </div>

          <div>
            {viewShares.length > 0 && (
              <>
                <br />
                <h4>Shared with</h4>
              </>
            )}
            <small>
              {viewShares.map((s, i) => (
                <div key={i}>
                  {s.revoked === false ? (
                    <Tooltip title={"Click to revoke"}>
                      <a onClick={() => unshareWith(viewMail.location, s.keyLocation, s.withAddress)}>
                        {s.withAddress}
                      </a>
                    </Tooltip>
                  ) : (
                    <Tooltip title={"Revoked"}>
                      <span style={{ color: "gray" }}>{s.withAddress}</span>
                    </Tooltip>
                  )}
                </div>
              ))}
            </small>
          </div>
        </Modal>
      )}

      {isModalVisible && (
        <ComposeNewNotarization
          readContracts={readContracts}
          writeContracts={writeContracts}
          ensProvider={mainnetProvider}
          address={address}
          modalControl={setIsModalVisible}
          tx={tx}
          onMessageSent={onMessageSent}
          smailMail={smailMail}
          recipient={address}
        />
      )}

      <Modal
        visible={isLookupModalVisible}
        style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
        title={<h3>Verify notarized file</h3>}
        maskClosable={true}
        onOk={() => {
          setIsLookupModalVisible(false);
        }}
        onCancel={() => {
          setIsLookupModalVisible(false);
        }}
      >
        <p>Select document to check if it was notarized</p>
        <input
          type="file"
          onChange={handleLookUpFileChange}
          style={{ display: "none" }} // Hide the input element
          ref={fileInputRef} // Reference the input for triggering click
        />
        <Button onClick={handleLookupFileButtonClick}>Verify file</Button>
      </Modal>

      {/* display modal for document */}
      <Modal
        visible={displayDocument != null}
        style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
        title={<h3>File was notarized</h3>}
        maskClosable={true}
        onOk={() => {
          setDisplayDocument(null);
        }}
        onCancel={() => {
          setDisplayDocument(null);
        }}
      >
        {displayDocument != null && (
          <>
            <strong>Owner: </strong>
            <AddressSimple address={displayDocument.owner} ensProvider={mainnetProvider} />
            <Tooltip
              title={
                <>
                  Send message with <AddressSimple address={displayDocument.owner} ensProvider={mainnetProvider} />
                </>
              }
            >
              <span
                onClick={() => setReplyTo(displayDocument.owner, true, "Re Post: #" + displayDocument.docHash)}
                style={{ cursor: "pointer" }}
              >
                &nbsp;⇽&nbsp;
              </span>
            </Tooltip>
            <Tooltip
              title={
                <>
                  Create thread with <AddressSimple address={displayDocument.owner} ensProvider={mainnetProvider} />
                </>
              }
            >
              <span
                onClick={() => setThreadTo(displayDocument.owner, "Re Document: #" + displayDocument.docHash)}
                style={{ cursor: "pointer" }}
              >
                &nbsp;♺&nbsp;
              </span>
            </Tooltip>
            <br />
            <strong>Notarized on: </strong>
            {getDateTimeString(displayDocument.timestamp)}
            <br />
            <strong>Attested: </strong> {displayDocument.isAttested ? "true" : "N/A"}
            {/* <br />
            <strong>Doc:</strong> {displayDocument.docHash}
            <br />
            <strong>Meta:</strong> {displayDocument.metaHash}
            <br /> */}
          </>
        )}
      </Modal>
    </div>
  );
}

export default Notarization;
