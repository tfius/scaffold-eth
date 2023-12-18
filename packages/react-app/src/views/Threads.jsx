import React, { useState, useEffect, useCallback } from "react";

import { ethers } from "ethers";
import { Link, Route, useLocation } from "react-router-dom";
import {
  Button,
  List,
  Card,
  Modal,
  notification,
  Tooltip,
  Typography,
  Spin,
  Checkbox,
  Input,
  Switch,
  Badge,
} from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";

import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";

import { AddressSimple, AddressInput } from "../components";
import { ComposeNewThread } from "./ComposeNewThread";

function addAfter(array, index, newItem) {
  return [...array.slice(0, index), newItem, ...array.slice(index)];
}

export function ThreadsComponent({ mail, onViewMail }) {
  if (mail.threadMails.length == null) return null;
  return (
    <div style={{ marginLeft: mail.depth * 15 + "px" }}>
      {mail.threadMails.map(threadMail => (
        <>
          <span onClick={() => onViewMail(threadMail)} style={{ cursor: "pointer" }}>
            {threadMail.contents}{" "}
          </span>
          <ThreadsComponent mail={threadMail} onViewMail={onViewMail} />
        </>
      ))}
    </div>
    // <List
    //   dataSource={mail.threadMails}
    //   renderItem={threadMail => (
    //     <List.Item style={{ marginBottom: "5px", marginTop: "0px", padding: "0px" }}>
    //       <List.Item.Meta title={<>{threadMail.contents}</>} />
    //       <ThreadsComponent mail={threadMail} />
    //     </List.Item>
    //   )}
    // />
  );
}

export function Threads({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  mainnetProvider,
  address,
  messageCount,
  smailMail,
}) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  const [threadReply, setThreadReply] = useState(null);
  const [isReplyInProgess, setIsReplyInProgess] = useState(false);

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
    /*setViewSharedItems(isChecked);
    if (isChecked) {
      setSharedItems([]);
      getSharedItems();
    }*/
  };

  const onMessageSent = async () => {
    await updateThreads();
  };

  useEffect(() => {
    if (messageCount > messageCountTrigger && !updatingLocker) updateThreads();
    setMessageCountTrigger(messageCount);
  }, [messageCount]);

  const updateRegistration = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return; // todo get pub key from ENS
    const data = await readContracts.SwarmMail.getPublicKeys(address);
    setIsRegistered(data.registered);
    if (isRegistered === false && data.registered) updateThreads();
  });
  var updatingLocker = false;
  const updateThreads = useCallback(async () => {
    if (updatingLocker) return;
    updatingLocker = true;
    const boxCount = await readContracts.SwarmMail.getUserStats(address);
    console.log("boxCount", boxCount);
    const mailCount = boxCount.numThreads.toNumber();

    setTotalItems(mailCount);
    var allPages = Math.ceil(mailCount / pageSize);
    setMaxPages(allPages);

    var length = pageSize;
    var start = mailCount - page * pageSize;
    if (start < 0) start = 0;
    if (start + length > mailCount) length = mailCount - start;
    setStartItem(start + 1);
    setEndItem(start + length);

    const smails = await readContracts.SwarmMail.getUserThreadsRange(address, start, length);
    //const smails = await readContracts.SwarmMail.getUserThreadEmails(address);
    processThreadSMails(smails[0], smails[1]);
    //console.log("got smails", mails);
    updatingLocker = false;
  });

  useEffect(() => {
    updateThreads();
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
    if (messageCount > messageCountTrigger && !updatingLocker) updateThreads();
    setMessageCountTrigger(messageCount);
  }, [messageCount]);

  // const onSignMail = async mail => {
  //   let newTx = await tx(writeContracts.SwarmMail.signEmail(mail.location));
  //   await newTx.wait();
  //   notification.open({
  //     message: "You signed " + location,
  //     description: `Your key: ${pubKey}`,
  //   });
  // };
  const getDecryptKey = async forAddress => {
    var recipientKeys = await readContracts.SwarmMail.getPublicKeys(forAddress);
    const rkey = recipientKeys.pubKey.substr(2, recipientKeys.pubKey.length - 1);
    var pubKey = Buffer.from(rkey, "hex").toString("base64");
    var sharedSecretKey = await EncDec.calculateSharedKey(
      smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length),
      pubKey,
    );
    //return { pubKey: pubKey, decryptKey: Buffer.from(sharedSecretKey.secretKey).toString("base64") };
    return { pubKey: pubKey, sharedSecretKey: sharedSecretKey };
  };
  const decryptMail = async (s, data) => {
    var keyTo = await getDecryptKey(s.to);
    var key = {}; //keyLookup[s.to];
    if (s.to === address) {
      key = await getDecryptKey(s.from);
    } else {
      key = keyTo; //await getDecryptKey(s.to);
    }

    var d = JSON.parse(new TextDecoder().decode(data));
    var decRes = EncDec.nacl_decrypt_with_key(
      d,
      keyTo.pubKey,
      Buffer.from(key.sharedSecretKey.secretKey).toString("base64"),
    );
    return JSON.parse(decRes); // returns mail object
  };

  const processThreadSMails = async (sMails, threadHashes, parentMail) => {
    setIsLoading(true);
    var idx = -1;
    if (parentMail) {
      console.log("parentMail", parentMail);
      // find parent in existing mails
      idx = mails.findIndex(m => m.location == parentMail.location);
      console.log("found parent", idx, parentMail.swarmLocation);
    }
    for (let i = 0; i < sMails.length; i++) {
      var s = sMails[i];
      // skip if swarmLocation exists in mails
      if (mails.findIndex(m => m.location == s.swarmLocation) != -1) continue; // skip if already existing
      var mail = { attachments: [] };

      try {
        const data = await downloadDataFromBee(s.swarmLocation); // returns buffer
        console.log("smail", s);
        // see if mail is encrypted
        if (s.isEncryption === true) {
          //console.log("data", data, smailMail);
          try {
            mail = await decryptMail(s, data);
          } catch (e) {
            console.error("decrypt", e);
            continue;
          }
        } else {
          // do this for non encrypted mails
          try {
            mail = JSON.parse(new TextDecoder().decode(data)); //Buffer.from(data).toJSON(); // JSON.parse(data.toString());
          } catch (e) {
            console.error("processThreadSMails", e);
          }
        }
      } catch (e) {
        console.error("processThreadSMails", e);
      }
      mail.time = s.time.toString();
      mail.checked = false;
      mail.location = s.swarmLocation;
      mail.from = s.from;
      mail.to = s.to;
      mail.signed = s.signed;
      mail.isEncryption = s.isEncryption;
      mail.threads = s.threads;
      mail.threadHash = threadHashes[i];
      mail.threadMails = [];
      mail.depth = 0;
      mail.subThreads = 0;
      if (parentMail) {
        mail.parentMail = parentMail;
        mail.depth = parentMail.depth + 1;
        //parentMail.threadMails.push(mail);
        parentMail.threadMails = [...parentMail.threadMails, mail];
        parentMail.subThreads++;
        if (parentMail.parentMail) parentMail.parentMail.subThreads++;
        /* if(idx!=-1)
           newMails = addAfter(newMails, idx, mail); */

        // newMails.unshift(mail);
        //newMails = addAfter(newMails, idx, mail);
        //newMails = newMails.splice(idx, 0, mail);
        //setMails(mails => mails.splice(idx, 0, mail));
        //setMails(mails => [parentMail, ...mails]);
        //setMails(addAfter(mails, idx, mail));
      } else {
        //setMails(mails => [mail, ...mails]);
        //newMails.unshift(mail);
        // setMails(mails => [mail, ...mails]);
      }
      console.log("thread mail", mail);
      await setMails(mails => [mail, ...mails]);
      if (mail.threads.length > 0) await loadThreads(mail);

      // only add if not existing
      //existingMails.findIndex(m => m.sendTime == mail.sendTime) == -1 ? setMails(mails => [mail, ...mails]) : null;
      //console.log(mail);
    }
    setIsLoading(false);

    //await setMails(newMails);
    /*newMails = mails.sort((a, b) => {
      a.time > b.time ? 1 : -1;
    });
    setMails(newMails);*/

    //console.log("processedMails", mails);
  };
  const loadThreads = async sMail => {
    console.log("loadThreads", sMail);
    var threads = await readContracts.SwarmMail.getThreads(sMail.threads);
    if (threads.length > 0) processThreadSMails(threads, sMail.threads, sMail);
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
        //console.log("thread", d);
        var decRes = EncDec.nacl_decrypt(d, smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length));
        var object = JSON.parse(decRes);
        //console.log("decrypted thread", object);
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

  const onReplyThread = async (mail, index) => {
    setIsReplyInProgess(true);
    console.log("onReplyThread", mail, index);
    var recipientAddress = mail.to;
    // get recipient key
    if (mail.to === address) recipientAddress = mail.from;

    var key = await getDecryptKey(recipientAddress);

    var completeMessage = { subject: "Reply", contents: threadReply, sendTime: Date.now(), attachments: [] };
    var asString = JSON.stringify(completeMessage);
    var smail = JSON.stringify(EncDec.nacl_encrypt_with_key(asString, key.pubKey, key.sharedSecretKey));

    var cost = 10;
    try {
      const mailDigest = await uploadDataToBee(smail, "application/octet-stream", completeMessage.sendTime + ".smail"); // ms-mail.json
      let newTx = await tx(
        writeContracts.SwarmMail.addThread(5, /*mail.location*/ mail.threadHash, recipientAddress, "0x" + mailDigest, {
          value: cost, // in wei
        }),
      );
      await newTx.wait();
      setViewMail(null); // close view
    } catch (e) {
      notification.warning({
        message: "Error",
        description: e.message,
      });
    }
    setIsReplyInProgess(false);
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
      <h1>Threads</h1>
      <div className="routeSubtitle">All threads your are participating in</div>
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
            <Button onClick={() => updateThreads()} disabled={viewSharedItems}>
              🗘
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button onClick={() => deleteLockerMail()} disabled={viewSharedItems}>
              🗑
            </Button>
            &nbsp;
          </Tooltip>
          <Tooltip title="Create new thread">
            <Button onClick={() => setIsModalVisible(true)}>Create Thread</Button>&nbsp;
          </Tooltip>
          {/* <Tooltip title="View Threads For you Only">
            <Switch checked={viewSharedItems} onChange={toggleViewShared} />
          </Tooltip> */}
          {isLoading && <Spin />}
        </div>
        {viewSharedItems === true ? (
          <>
            {/* <List
              itemLayout="horizontal"
              dataSource={sharedItems}
              renderItem={mail => (
                <List.Item style={{ marginBottom: "5px", marginTop: "0px", padding: "0px" }}>
                  <List.Item.Meta
                    title={
                      <>
                        <Tooltip title={<AddressSimple address={mail.sharedMail.sender} placement="right" />}>
                          {mail.locker.subject}
                        </Tooltip>
                        {mail.locker.contents} 
                      </>
                    }
                    description={
                      <>
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
            /> */}
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
              {/* // TODO https://ant.design/components/list */}
              <List
                itemLayout="horizontal"
                style={{ width: "95%" }}
                dataSource={mails}
                renderItem={mail => (
                  <>
                    {!mail.parentMail && (
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
                              {!mail.parentMail && (
                                <>
                                  <Checkbox value={mail.location} style={{ margin: "0rem 1rem 0rem 0rem" }} />
                                  <Tooltip
                                    title={
                                      <>
                                        From: <AddressSimple address={mail.from} />
                                      </>
                                    }
                                  >
                                    <span>
                                      <Blockies className="mailIdenticon" seed={mail.from} size="8" />
                                    </span>
                                  </Tooltip>
                                  <Tooltip
                                    title={
                                      <>
                                        To: <AddressSimple address={mail.to} />
                                      </>
                                    }
                                  >
                                    <span>
                                      <Blockies className="mailIdenticon" seed={mail.to} size="8" />
                                    </span>
                                  </Tooltip>
                                </>
                              )}
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
                              {/* <Badge.Ribbon text={mail.threads.length} onClick={() => loadThreads(mail)}> */}
                              {
                                /*!mail.parentMail*/ true && (
                                  <strong style={{ cursor: "pointer" }} onClick={() => setViewMail(mail)}>
                                    {mail.subject}
                                  </strong>
                                )
                              }
                              {/* </Badge.Ribbon> */}

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
                              {/* <span onClick={() => loadThreads(mail)}>
                            Threads: {mail.threads.length} {mail.subThreads} {mail.depth}
                          </span> */}
                              <>
                                <ThreadsComponent mail={mail} onViewMail={setViewMail} />

                                {/* {mail.threadMails.length > 0 && (
                              <List
                                dataSource={mail.threadMails}
                                renderItem={threadMail => (
                                  <List.Item style={{ marginBottom: "5px", marginTop: "0px", padding: "0px" }}>
                                    <List.Item.Meta title={<>{threadMail.contents}</>} />
                                  </List.Item>
                                )}
                              />
                            )} */}
                              </>
                            </>
                          }
                        />
                        <></>
                      </List.Item>
                    )}
                  </>
                )}
              />
            </Checkbox.Group>
          </>
        )}
      </>
      {/* <>
        <div style={{ marginTop: 20 }}>
          <small style={{ fontSize: 4 }}>{checked.join(", ")} </small>
        </div>
      </> */}
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
          <Input.TextArea
            value={threadReply}
            onChange={e => setThreadReply(e.target.value)}
            maxLength={4096}
            rows={7}
            autosize={{ minRows: "10", maxRows: "20" }}
          />
          <Button disabled={isReplyInProgess} onClick={() => onReplyThread(viewMail)}>
            Reply
          </Button>

          {/* <div>
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
          </div> */}
        </Modal>
      )}

      {isModalVisible && (
        <ComposeNewThread
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
    </div>
  );
}

export default Threads;
