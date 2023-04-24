import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { fetchJson } from "ethers/lib/utils";
import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
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
  attachments: [],
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

/* 
 Calendar encrypts data for user only with their smail key and new throw away key. 
*/

export function Calendar({
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
  //   const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState(Date.now() / 1000);
  //   const [eventDuration, setEventDuration] = useState(30 * 60); // 30 minutes
  //   const [eventParticipants, setEventParticipants] = useState([]);
  //   const [eventCategory, setEventCategory] = useState("");
  //   const [eventLocation, setEventLocation] = useState("");
  //   const [eventDescription, setEventDescription] = useState("");
  //   const [eventName, setEventName] = useState("");
  //   const [eventID, setEventID] = useState("");
  //   const [eventOwner, setEventOwner] = useState("");
  //   const [eventOwnerName, setEventOwnerName] = useState("");

  const fetchEvents = useCallback(async () => {
    if (readContracts === undefined || readContracts.Calendar === undefined) return; // todo get pub key from ENS
    //console.log("fetchEvents", address, dtu.getDateString(date), dtu.getTimestampFromDate(date));
    const data = await readContracts.Calendar.getEventsByDate(address, dtu.getTimestampFromDate(date));
    //console.log("data from contracts", data);
    processEvents(data);
  });
  const processEvents = useCallback(async eventsFromChain => {
    if (readContracts === undefined || readContracts.Calendar === undefined) return; // todo get pub key from ENS
    var data = [];
    for (var i = 0; i < eventsFromChain.length; i++) {
      // TODO decrypt with smail key data before upload
      var eventData = await downloadDataFromBee(eventsFromChain[i].location);
      var decoded = JSON.parse(new TextDecoder().decode(eventData));
      var decRes = EncDec.nacl_decrypt(decoded, smailMail.smailPrivateKey.substr(2, smailMail.smailPrivateKey.length));
      var d = JSON.parse(decRes);

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

  const createEventTx = async event => {
    setIsLoading(true);
    // TODO encrypt with smail key data before upload

    try {
      var recipientKey = await retrievePubKey(address);
      var ephemeralKey = EncDec.generate_ephemeral_key_pair();
      var smailEvent = JSON.stringify(event);
      //var smailEnc = JSON.stringify(EncDec.nacl_encrypt_with_key(smailEvent, recipientKey, ephemeralKey));
      var smailEnc = JSON.stringify(EncDec.nacl_encrypt_with_key(smailEvent, recipientKey, ephemeralKey));
      if (smailEnc === "null") throw { message: "Error encrypting event" };

      const eventDigest = await uploadDataToBee(smailEnc, "application/octet-stream", date + ".smailcal"); // ms-mail.json
      const tx = await writeContracts.Calendar.addEvent(
        event.date + "",
        event.time + "",
        event.duration + "",
        "0x" + eventDigest,
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
    }
    setIsLoading(false);
  };

  const deleteEventTx = async event => {
    setIsLoading(true);
    try {
      const tx = await writeContracts.Calendar.removeEventByIndex(event.date + "", event.index + "");
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
      <h1 style={{ paddingTop: "18px" }}>Calendar {dtu.getMonthName(date) + " " + dtu.getYear(date)}</h1>
      <h2>
        <a onClick={() => retrieveNewDate(date, -1)}>{"<"}</a>
        &nbsp;&nbsp;
        <a onClick={() => retrieveNewDate(date, +1)}>{">"}</a>
        <Tooltip title={dtu.getDateString(date)}>
          <span>
            &nbsp;&nbsp;{dtu.getDayName(date) + " " + dtu.getMonthDay(date)}&nbsp;&nbsp;
            <div style={{ float: "right", marginRight: "5%" }}>{dtu.getMonthName(date) + " " + dtu.getYear(date)}</div>
          </span>
        </Tooltip>
        {/* <Button onClick={() => createEvent(date)}>Create Event</Button>&nbsp; */}
      </h2>
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
            title="Calendar Event"
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
