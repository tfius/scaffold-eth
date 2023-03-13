import React, { useState, useEffect, useCallback } from "react";

import { ethers } from "ethers";
import { Button, List, Card, Modal, notification, Tooltip, Typography, Spin, Checkbox } from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";

import { downloadDataFromBee } from "../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";

import { AddressSimple } from "../components";
import { ComposeNewLocker } from "./ComposeNewLocker";

export function Locker({
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

  const [page, setPage] = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [startItem, setStartItem] = useState(0);
  const [endItem, setEndItem] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const setViewMail = async mail => {
    // console.log("onViewMessage", mail);
    _setViewMail(mail);
  };

  /*  
  const onMessageSent = useCallback(async () => {
    console.log("locker onMessageSent");
    updateLocker();
  }, []);*/
  const onMessageSent = async () => {
    await updateLocker();
  };

  const updateRegistration = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return; // todo get pub key from ENS
    const data = await readContracts.SwarmMail.getPublicKeys(address);
    setIsRegistered(data.registered);
    // setKey(data.key);
    if (isRegistered === false && data.registered) updateLocker();
  });
  var updatingLocker = false;
  const updateLocker = useCallback(async () => {
    if (updatingLocker) return;
    updatingLocker = true;
    const mailCount = (await readContracts.SwarmMail.getLockerCount(address)).toNumber();
    setTotalItems(mailCount);
    var allPages = Math.ceil(mailCount / pageSize);
    setMaxPages(allPages);

    var length = pageSize;
    var start = mailCount - page * pageSize;
    if (start < 0) start = 0;
    if (start + length > mailCount) length = mailCount - start;
    setStartItem(start + 1);
    setEndItem(start + length);

    //const smails = await readContracts.SwarmMail.getLocker(address);
    const smails = await readContracts.SwarmMail.getEmailRange(address, 2, start, length);
    processSMails(smails);
    //console.log("got smails", mails);
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

  const onSignMail = async mail => {
    let newTx = await tx(writeContracts.SwarmMail.signEmail(mail.location));
    await newTx.wait();
    notification.open({
      message: "You signed " + location,
      description: `Your key: ${pubKey}`,
    });
  };
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
          var decRes = EncDec.nacl_decrypt(d, smailMail.smail.substr(2, smailMail.smail.length));
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
      mail.time = s.time;
      mail.checked = false;
      mail.location = s.swarmLocation;
      mail.sender = s.from;
      mail.signed = s.signed;
      mail.isEncryption = s.isEncryption;
      setMails(mails => [mail, ...mails]);
      // only add if not existing
      //existingMails.findIndex(m => m.sendTime == mail.sendTime) == -1 ? setMails(mails => [mail, ...mails]) : null;
      //console.log(mail);
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
        var decRes = EncDec.nacl_decrypt(d, smailMail.smail.substr(2, smailMail.smail.length));
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
  const appendData = () => {
    /*fetch(fakeDataUrl)
      .then((res) => res.json())
      .then((body) => {
        setData(data.concat(body.results));
        message.success(`${body.results.length} more items loaded!`);
      });*/
  };
  // const onScroll = e => {
  //   if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === ContainerHeight) {
  //     appendData();
  //   }
  // };
  const IconText = ({ icon, tooltip, text }) => (
    <Tooltip title={tooltip}>
      {React.createElement(icon)}
      {text}
    </Tooltip>
  );
  const shareLocker = async locker => {
    //console.log("shareLocker", locker);
    // to convert call this:
    var ephemeralKey = {
      publicKey: new Uint8Array(Buffer.from(locker.ephemeralKey.publicKey, "base64")),
      secretKey: new Uint8Array(Buffer.from(locker.ephemeralKey.secretKey, "base64")),
    };

    const shareLockerObject = {
      subject: locker.subject,
      contents: locker.contents,
      isEncryption: locker.isEncryption,
      sender: locker.sender,
      attachments: locker.attachments,
      location: locker.location,
      ephemeralKey: locker.ephemeralKey,
    };
    console.log("shareLocker", locker, ephemeralKey, shareLockerObject);
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
            It appears your account is not registred yet. Please register to store your encrypted data.
          </Typography>
        </Card>
      </>
    );
  }

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1>Locker</h1>
      <div className="routeSubtitle">Encrypted packages and sharing info</div>
      <div className="paginationInfo">
        {startItem}-{endItem} of {totalItems} &nbsp;&nbsp;&nbsp;
        <a onClick={() => retrieveNewPage(page - 1)}>{"<"}</a>&nbsp;{page}/{maxPages}&nbsp;
        <a onClick={() => retrieveNewPage(page + 1)}>{">"}</a>
      </div>

      <>
        <div style={{ paddingLeft: "6px", paddingTop: "10px", paddingBottom: "10px" }}>
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll} /> &nbsp;
          <Tooltip title="Refresh">
            <Button onClick={() => updateLocker()}>🗘</Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button onClick={() => deleteLockerMail()}>🗑</Button>&nbsp;
          </Tooltip>
          <Tooltip title="Delete">
            <Button onClick={() => setIsModalVisible(true)}>Add Data</Button>&nbsp;
          </Tooltip>
          {isLoading && <Spin />}
        </div>
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
                      {/* <Tooltip title={ {mail.sender}}> */}
                      <Tooltip title={<AddressSimple address={mail.sender} />}>
                        <span>
                          <Blockies className="mailIdenticon" seed={mail.sender} size="8" />
                        </span>
                      </Tooltip>
                      {/* <IconText icon={EditOutlined} tooltip="Sign" key="list-vertical-like-o" />, */}
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
                      <strong style={{ cursor: "pointer" }} onClick={() => setViewMail(mail)}>
                        {mail.subject}
                      </strong>

                      {mail.isEncryption === false && (
                        <IconText
                          icon={InfoCircleOutlined}
                          tooltip="This message is not encrypted"
                          key="list-vertical-signed-o"
                        />
                      )}
                      {mail.signed === true ? (
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
                      )}
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
          <Button onClick={() => shareLocker(viewMail)}>SHARE</Button>
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
        </Modal>
      )}

      {isModalVisible && (
        <ComposeNewLocker
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

export default Locker;
