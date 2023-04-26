import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { fetchJson } from "ethers/lib/utils";
import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
import { AddressSimple, AddressInput } from "../components";
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
  Form,
} from "antd";
import * as layouts from "./layouts.js";
import * as dtu from "./datetimeutils.js";
import * as EncDec from "../utils/EncDec.js";

/* Create events and add them to the calendar */
const eventTemplate = {
  eventName: "",
  description: "",
  category: "",
  location: "",
  color: "",
  participants: [],
  date: "",
  duration: "",
  time: "",
};

const dayTemplate = [
  { hour: 0, time: "0:00", events: [] },
  { hour: 1, time: "1:00", events: [] },
  { hour: 2, time: "2:00", events: [] },
  { hour: 3, time: "3:00", events: [] },
  { hour: 4, time: "4:00", events: [] },
  { hour: 5, time: "5:00", events: [] },
  { hour: 6, time: "6:00", events: [] },
  { hour: 7, time: "7:00", events: [] },
  { hour: 8, time: "8:00", events: [] },
  { hour: 9, time: "9:00", events: [] },
  { hour: 10, time: "10:00", events: [] },
  { hour: 11, time: "11:00", events: [] },
  { hour: 12, time: "12:00", events: [] },
  { hour: 13, time: "13:00", events: [] },
  { hour: 14, time: "14:00", events: [] },
  { hour: 15, time: "15:00", events: [] },
  { hour: 16, time: "16:00", events: [] },
  { hour: 17, time: "17:00", events: [] },
  { hour: 18, time: "18:00", events: [] },
  { hour: 19, time: "19:00", events: [] },
  { hour: 20, time: "20:00", events: [] },
  { hour: 21, time: "21:00", events: [] },
  { hour: 22, time: "22:00", events: [] },
  { hour: 23, time: "23:00", events: [] },
];

export function Scheduler({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  address,
  messageCount,
  smailMail,
  setReplyTo,
  mainnetProvider,
}) {
  const formRef = React.createRef();
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(Date.now() / 1000);
  const [event, setEvent] = useState(undefined);
  const [newEvent, setNewEvent] = useState(false);
  const [eventTime, setEventTime] = useState(Date.now() / 1000);
  const [schedulerAddress, _setSchedulerAddress] = useState("");
  const [schedulerUser, setSchedulerUser] = useState({
    balance: 0,
    startTime: 0,
    endTime: 0,
    isAway: false,
    payment: 0,
  });
  const [isUserValid, setIsUserValid] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (readContracts === undefined || readContracts.Scheduler === undefined) return; // todo get pub key from ENS
    //console.log("fetchEvents", address, dtu.getDateString(date), dtu.getTimestampFromDate(date));
    const data = await readContracts.Scheduler.getEventsByDate(address, dtu.getTimestampFromDate(date));
    //console.log("data from contracts", data);
    processEvents(data);
  });

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

  const decryptSchedulerEvent = async (event, data) => {
    var keyTo = await getDecryptKey(address);
    var key = {};
    if (schedulerAddress === address) {
      key = await getDecryptKey(event.sender);
    } else {
      key = keyTo;
    }

    //var d = JSON.parse(new TextDecoder().decode(data));
    var decRes = EncDec.nacl_decrypt_with_key(
      data,
      keyTo.pubKey,
      Buffer.from(key.sharedSecretKey.secretKey).toString("base64"),
    );
    return JSON.parse(decRes); // returns event object
  };

  const processEvents = useCallback(async eventsFromChain => {
    if (readContracts === undefined || readContracts.Scheduler === undefined) return; // todo get pub key from ENS
    var data = [];
    for (var i = 0; i < eventsFromChain.length; i++) {
      //debugger;
      // TODO decrypt with smail key data before upload
      var eventData = await downloadDataFromBee(eventsFromChain[i].location);
      var decoded = JSON.parse(new TextDecoder().decode(new Uint8Array(eventData)));
      try {
        var d = await decryptSchedulerEvent(eventsFromChain[i], decoded);
        //console.log("eventData", d);
        data.push({
          name: d.name,
          description: d.description,
          location: d.location,
          category: d.category,
          participants: d.participants,
          owner: d.owner,
          ownerName: d.ownerName,
          date: parseInt(d.date.toString()),
          time: parseInt(eventsFromChain[i].time.toString()),
          duration: parseInt(eventsFromChain[i].duration.toString()),
          index: i,
        });
      } catch (e) {
        console.log("error decrypting event", e);
        data.push({
          name: "Busy",
          description: "",
          location: "",
          category: "",
          participants: "",
          owner: "",
          ownerName: "",
          date: date.toString(), // parseInt(d.date.toString()), this one could be retrieved
          time: parseInt(eventsFromChain[i].time.toString()),
          duration: parseInt(eventsFromChain[i].duration.toString()),
          index: i,
        });
      }
    }
    setEvents(data);
    //console.log("events", eventsFromChain, data);
  });

  useEffect(() => {
    fetchEvents();
  }, [date]);

  useEffect(() => {
    fetchEvents();
  }, [readContracts, address]);

  const retrievePubKey = async forAddress => {
    try {
      const data = await readContracts.SwarmMail.getPublicKeys(forAddress);
      const rkey = data.pubKey.substr(2, data.pubKey.length - 1);
      var pk = Buffer.from(rkey, "hex").toString("base64");
      // console.log(isSender ? "sender" : "receiver", data);
      if (data.pubKey === "0x0000000000000000000000000000000000000000000000000000000000000000") pk = null;
      return pk;
    } catch (e) {
      console.log(e);
    }
    return null;
  };

  const createNewEvent = async (date, time) => {
    const day = Math.round(dtu.getTimestampFromDate(date) + time * 60 * 60);
    setNewEvent(true);
    setEventTime(day);
    //console.log("createEvent", dtu.getDateString(day), time);
    var event = {
      name: "New Event",
      description: "",
      location: " " + dtu.getDateString(day),
      category: "Personal",
      participants: [],
      owner: address,
      ownerName: "",
      color: "#9999AA",
      date: dtu.getTimestampFromDate(date),
      time: time * 60 * 60,
      duration: 60 * 60, // 1h
    };
    setEvent(event);
    //console.log("createEvent", event);
  };

  const setSchedulerAddress = async address => {
    console.log("setSchedulerAddress", address);
    try {
      _setSchedulerAddress(address);
      var user = await readContracts.Scheduler.getUser(address);
      var u = {
        balance: user.balance.toString(),
        startTime: user.startTime.toString(),
        endTime: user.endTime.toString(),
        isAway: user.isAway,
        payment: user.payment.toString(),
        pricePerS: user.payment,
        st: user.startTime.toNumber(),
        et: user.endTime.toNumber(),
      };
      console.log("user", u);
      setSchedulerUser(u);
      setIsUserValid(true);
    } catch (e) {
      console.log("error", e);
      setIsUserValid(false);
    }
  };

  const createEventTx = async event => {
    setIsLoading(true);

    // TODO encrypt with smail key data before upload

    try {
      var recipientKey = await retrievePubKey(schedulerAddress);
      if (recipientKey === null)
        throw new Error(
          schedulerAddress + " Scheduler has no public key set. Scheduler owner is not registered with Smail.",
        );

      var sharedSecretKey = await EncDec.calculateSharedKey(
        smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length),
        recipientKey,
      );

      var completeMessage = event;
      completeMessage.noise = EncDec.generateNoise();

      var smailEvent = JSON.stringify(completeMessage);
      var smailEventEnc = JSON.stringify(EncDec.nacl_encrypt_with_key(smailEvent, recipientKey, sharedSecretKey));
      const eventDigest = await uploadDataToBee(smailEventEnc, "application/octet-stream", date + ".smail"); // ms-mail.json

      const tx = await writeContracts.Scheduler.scheduleEvent(
        schedulerAddress,
        event.date + "",
        event.time + "",
        event.duration + "",
        "0x" + eventDigest,
        { value: schedulerUser.pricePerS * event.duration },
      );
      await tx.wait();
      setEvent(undefined);
      await fetchEvents();
    } catch (e) {
      notification.warning({
        message: "Error",
        description: e.message + " " + e.data?.message,
        duration: 6,
      });
      console.log("error", e);
    }
    setIsLoading(false);
  };
  const deleteEventTx = async event => {
    setIsLoading(true);
    try {
      const tx = await writeContracts.Scheduler.removeEventByIndex(event.date + "", event.index + "");
      await tx.wait();
      setEvent(undefined);
      await fetchEvents();
    } catch (e) {
      notification.warning({
        message: "Error",
        description: e.message,
        duration: 6,
      });
    }
    setIsLoading(false);
  };
  const retrieveNewDate = async (oldDate, days) => {
    setDate(Math.round(oldDate + days * 24 * 60 * 60)); // console.log("date", d);
    setEvents([]);
  };

  const viewEvent = async (e, event) => {
    //console.log("viewEvent", e, event);
    setNewEvent(false);
    setEvent(event);
    e.stopPropagation();
  };

  const onFinish = async values => {
    //console.log("onFinish:", values);
    if (newEvent === true) createEventTx(values);
    if (newEvent === false) deleteEventTx(event);
  };

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px" }}>
      <h1 style={{ paddingTop: "18px" }}>Scheduler {dtu.getMonthName(date) + " " + dtu.getYear(date)}</h1>
      <div style={{ width: "50%", float: "left", marginBottom: "10px" }}>
        <AddressInput
          placeholder="Scheduler Receiver Address"
          style={{ width: "50%", float: "left" }}
          value={schedulerAddress}
          onChange={e => setSchedulerAddress(e)}
          ensProvider={mainnetProvider}
        />
      </div>

      <h2>
        &nbsp;&nbsp;
        <a onClick={() => retrieveNewDate(date, -1)}>{"<"}</a>
        &nbsp;&nbsp;
        <a onClick={() => retrieveNewDate(date, +1)}>{">"}</a>&nbsp;
        <Tooltip title={dtu.getDateString(date)}>
          <span>
            <div style={{ float: "right", marginRight: "5%" }}>
              {dtu.getDayName(date) +
                " " +
                dtu.getMonthDay(date) +
                " " +
                dtu.getMonthName(date) +
                " " +
                dtu.getYear(date)}
            </div>
          </span>
        </Tooltip>
        {/* <Button onClick={() => createEvent(date)}>Create Event</Button>&nbsp; */}
      </h2>
      <div>
        {isUserValid === true && (
          <>
            {schedulerUser.isAway === true ? "Away" : "Available"}&nbsp; Price: {schedulerUser.payment}/s &nbsp; Start:{" "}
            {schedulerUser.startTime} &nbsp; End: {schedulerUser.endTime} &nbsp; Balance: {schedulerUser.balance} &nbsp;
          </>
        )}
        <br />
      </div>
      <br />
      <div style={{ marginRight: "5%" }}>
        {dayTemplate.map((day, index) => {
          return (
            <div key={index} className="hourBox" onClick={() => createNewEvent(date, day.hour)}>
              <span className="hourBoxHeader">{day.time}</span>
              {events.map((event, index) => {
                if (event.time <= day.hour * 60 * 60 && event.time + event.duration > day.hour * 60 * 60) {
                  return (
                    <div
                      key={index}
                      className="hourBoxEvent"
                      style={{ height: event.duration / 60 }}
                      onClick={e => viewEvent(e, event)}
                    >
                      <div className="hourBoxEventName">{event.name}</div>
                      {/* <div className="hourBoxEventLocation">{getTimeString(event.time)}</div> */}
                      <div className="hourBoxEventLocation">{dtu.getDurationString(event.duration) + "'"}</div>
                      {/* <div className="hourBoxEventLocation">{event.location}</div> */}
                    </div>
                  );
                }
              })}
            </div>
          );
        })}
      </div>
      <p>
        {events.length > 0 ? <>{events.length} events for </> : <>No events found for </>} {dtu.getDateString(date)}
      </p>
      {event !== undefined && (
        <>
          {/* {true && console.log("event", event)} */}
          <Modal
            title="Schedule Event"
            visible={event !== undefined}
            footer={null}
            onOk={() => setEvent(undefined)}
            onCancel={() => setEvent(undefined)}
          >
            <Form
              {...layouts.layout}
              ref={formRef}
              onFinish={onFinish}
              name={"Event"}
              initialValues={{
                name: event.name,
                description: event.description,
                location: event.location,
                category: event.category,
                participants: event.participants,
                duration: event.duration,
                time: event.time,
                date: event.date,
                color: event.color,
                owner: address,
                ownerName: event.ownerName,
              }}
            >
              <Form.Item name="name" label="Name">
                <Input initialValue={"test"} />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input />
              </Form.Item>
              <Form.Item name="location" label="Location">
                <Input />
              </Form.Item>
              <Form.Item name="category" label="Category">
                <Input />
              </Form.Item>
              <div style={{ visibility: "collapse", height: "0px" }}>
                <Form.Item name="participants" label="Participants">
                  <Input />
                </Form.Item>
                <Form.Item name="duration" label="Duration">
                  <Input />
                </Form.Item>
                <Form.Item name="time" label="Time">
                  <Input />
                </Form.Item>
                <Form.Item name="date" label="Date">
                  <Input />
                </Form.Item>
                <Form.Item name="color" label="Color">
                  <Input />
                </Form.Item>
                <Form.Item name="owner" label="Owner">
                  <Input />
                </Form.Item>
                <Form.Item name="ownerName" label="Owner Name">
                  <Input />
                </Form.Item>
              </div>
              {isLoading === true ? (
                <Spin />
              ) : (
                <>
                  {newEvent === true ? (
                    <Button
                      type="primary"
                      htmlType="submit"
                      style={{ width: "80%", borderRadius: "5px", alignItems: "center", left: "10%" }}
                    >
                      Create Event
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      htmlType="submit"
                      style={{ width: "80%", borderRadius: "5px", alignItems: "center", left: "10%" }}
                    >
                      Delete Event
                    </Button>
                  )}
                </>
              )}
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
}
