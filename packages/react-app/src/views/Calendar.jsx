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
} from "antd";

/* Create events and add them to the calendar */
const eventTemplate = {
  eventName: "string",
  description: "string",
  category: "string",
  location: "string",
  participants: ["address"],
  date: "uint64",
  duration: "uint64",
  time: "uint64",
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

function getTimestampFromDate(date) {
  //var myDate = "26-02-2012";
  var myDate = getDateString(date);
  myDate = myDate.split("-");
  //var newDate = new Date(myDate[2], myDate[1] - 1, myDate[0]);
  var newDate = new Date(myDate[0], myDate[1] - 1, myDate[2]);
  return newDate.getTime() / 1000;
}
function getDayName(timestamp, locale = "en-US") {
  var date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, { weekday: "long" });
}
function getMonthName(timestamp, locale = "en-US") {
  var date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, { month: "long" });
}
function getTimestampForDay(year, month, day) {
  const date = new Date(year, month - 1, day);
  return Math.floor(date.getTime() / 1000);
}
function getDateString(timestamp) {
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert from seconds to milliseconds
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Add leading zero if necessary
  const day = ("0" + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}
function getDateTimeString(timestamp) {
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert from seconds to milliseconds
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Add leading zero if necessary
  const day = ("0" + date.getDate()).slice(-2);
  const hours = ("0" + date.getHours()).slice(-2);
  const minutes = ("0" + date.getMinutes()).slice(-2);
  const seconds = ("0" + date.getSeconds()).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getTimeString(time) {
  console.log(time);
  var h = Math.floor(time / 3600);
  var m = Math.floor((time % 3600) / 60);
  var s = Math.floor((time % 3600) % 60);
  return `${h}:${m}`;
}
function getDurationString(duration) {
  var m = duration / 60;
  return `${m}`;
}

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
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(Date.now() / 1000);
  const [event, setEvent] = useState(eventTemplate);
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
    console.log("fetchEvents", address, getDateString(date), getTimestampFromDate(date));
    const data = await readContracts.Calendar.getEventsByDate(address, getTimestampFromDate(date));
    //console.log("data from contracts", data);
    processEvents(data);
  });
  const processEvents = useCallback(async eventsFromChain => {
    if (readContracts === undefined || readContracts.Calendar === undefined) return; // todo get pub key from ENS
    var data = [];
    for (var i = 0; i < eventsFromChain.length; i++) {
      // TODO decrypt with smail key data before upload
      var eventData = await downloadDataFromBee(eventsFromChain[i].location);
      var decoded = new TextDecoder().decode(new Uint8Array(eventData));
      var d = JSON.parse(decoded);

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
  // getTimestampForDay(2021, 1, 1)
  const createEvent = async (date, time) => {
    const day = Math.round(getTimestampFromDate(date) + time * 60 * 60);
    setEventTime(day);
    console.log("createEvent", getDateString(day), time);
    var event = {
      name: "New Event " + getDateString(day),
      description: "New Event Description",
      location: "New Event Location",
      category: "New Event Category",
      participants: [],
      owner: address,
      ownerName: "New Event Owner Name",
      date: getTimestampFromDate(date),
      time: time * 60 * 60,
      duration: 60 * 60, // 1h
    };
    setEvent(event);
    //debugger;
    // TODO encrypt with smail key data before upload
    const eventDigest = await uploadDataToBee(JSON.stringify(event), "application/octet-stream", date + ".smail"); // ms-mail.json
    //addEvent(uint64 _date, uint64 _time, uint64 _duration, bytes32 _swarmLocation))
    try {
      const tx = await writeContracts.Calendar.addEvent(
        event.date + "",
        event.time + "",
        event.duration + "",
        "0x" + eventDigest,
      );
      await tx.wait();
    } catch (e) {
      notification.warning({
        message: "Error",
        description: e.message,
        //placement: "bottomRight", 1330210800
        duration: 6,
      });
    }

    // const tx = await writeContracts.Calendar.createEvent(
    //   "New Event",
  };
  const retrieveNewDate = async (oldDate, days) => {
    setDate(Math.round(oldDate + days * 24 * 60 * 60)); // console.log("date", d);
    setEvents([]);
  };

  const viewEvent = async (e, event) => {
    console.log("viewEvent", e, event);
    setEvent(event);
    e.stopPropagation();
  };

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px" }}>
      <h1 style={{ paddingTop: "18px" }}>Calendar</h1>
      <h2>
        <a onClick={() => retrieveNewDate(date, -1)}>{"<"}</a>
        &nbsp;&nbsp;
        <a onClick={() => retrieveNewDate(date, +1)}>{">"}</a>
        &nbsp;&nbsp;{getDayName(date) + " " + getMonthName(date)}&nbsp;&nbsp;
        <div style={{ float: "right" }}>&nbsp;&nbsp;{getDateString(date)}&nbsp;&nbsp;</div>
        {/* <Button onClick={() => createEvent(date)}>Create Event</Button>&nbsp; */}
      </h2>
      <div style={{ marginRight: "5%" }}>
        {dayTemplate.map((day, index) => {
          return (
            <div key={index} className="hourBox" onClick={() => createEvent(date, day.hour)}>
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
                      <div className="hourBoxEventLocation">{getDurationString(event.duration) + "'"}</div>
                      {/* <div className="hourBoxEventLocation">{event.location}</div> */}
                    </div>
                  );
                }
              })}
            </div>
          );
        })}
      </div>

      {events.length > 0 ? <ul></ul> : <p>No events found for this date.</p>}
    </div>
  );
}
