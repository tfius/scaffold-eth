import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { Button, Timeline, Card, notification, Typography, Spin } from "antd";

import { downloadDataFromBee, uploadDataToBee } from "./../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "./../utils/EncDec.js";
const { Meta } = Card;

export function About({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  address,
  provider,
  smailMail,
  setSmailMail,
  web3Modal,
}) {
  return (
    <div style={{ margin: "auto", width: "100%" }}>
      <>
        <Card>
          <div>
            <h2>BEWARE AND BEHOLD</h2>
            Always check that you are on correct domain and that you are using correct MetaMask account. Scammers could
            potentially ask you to decrypt Datafund Wallet and <strong>gain access to your data</strong>.
            <hr />
            <h2>How it works</h2>
            <h3>
              How <strong>Registration</strong> works:
            </h3>
            <ul>
              <li>Your public encryption key is requested with which new Datafund Wallet is created</li>
              <li>Datafund Wallet is encrypted with your MetaMask and uploaded to Swarm</li>
              <li>Transaction is sent to register Datafund public key and Datafund Wallet</li>
              Only MetaMask account that created Datafund Wallet can decrypt and bond with it.
              <br />
              <Link to="/">Register Wallet here</Link>
            </ul>
          </div>
          <div>
            <h3>
              How <strong>Inbox</strong> works:
            </h3>
            <ul>
              <li>Recipient's Smail public Key is retrieved</li>
              <li>New Ephemeral key is created</li>
              <li>Data is packaged, encrypted and uploaded </li>
              <li>A transaction is sent to notify receiver of new data available</li>
              You don't need to be bonded to send encrypted data as long as receiver is registered with Smail data sent
              will be encrypted. <strong>NOTE: </strong>Only receiver can retrieve and decrypt its contents and create
              Threads for notes.
            </ul>
            <h3>
              How <strong>Locker</strong> works
            </h3>
            <ul>
              <li>Create a locker item with new key</li>
              <li>Data is encrypted with new key and uploaded </li>
              <li>You can share your locker with other address by sharing newly created key</li>
              <li>A transaction is sent to notify receiver, sender and receiver can decrypt message</li>
              <li>Original creator can share/unshare key</li>
              All data is encrypted between creator and new key. Threads are encrypted with same key as locker. All who
              have access to locker item can read its threads.
            </ul>
            <h3>
              How <strong>Received/Sent</strong> works
            </h3>
            <ul>
              <li>Receiver and sender must be registered</li>
              <li>Shared secret is used to encrypt data</li>
              <li>Data is packaged, encrypted with shared secret key and uploaded </li>
              <li>A transaction is sent to notify receiver, sender and receiver can decrypt message</li>
              Uses Diffie-Hellman key exchange, a shared secret is used as a key to encrypt and decrypt message on both
              sides. <strong>NOTE: </strong>
              Both sender and receiver must be bonded to send encrypted data.
            </ul>
            <h3>
              How <strong>Threads</strong> work
            </h3>
            <ul>
              <li>Receiver and sender must be registered</li>
              <li>Shared secret is used to encrypt data</li>
              <li>Data is packaged, encrypted with shared secret key and uploaded </li>
              <li>A transaction is sent to notify receiver, sender and receiver can decrypt message</li>
              Uses Diffie-Hellman key exchange, a shared secret is used as a key to encrypt and decrypt message on both
              sides. <strong>NOTE: </strong> Both sender and receiver must be bonded to send encrypted data. If one
              party deletes a thread, other party will never know.
            </ul>
            <h3>
              <strong>Calendar</strong>
            </h3>
            <ul>
              <li>Add events to your calendar</li>
              All events are encrypted for owner. And only owner can see details. Other users can see event as{" "}
              <code>busy</code> only. Uses same encryption techinque as <strong>Locker</strong>.
            </ul>
            <h3>
              <strong>Scheduler</strong>
            </h3>
            <ul>
              <li>You can Schedule an event with another user</li>
              <li>
                Schedule owner can define <code>Start</code> and <code>End</code> time and payment per second.
              </li>
              <li>The user scheduling the event pays for owners time</li>
              <li>No overlapping events</li>
              <li>Can be used for automatic schedulers</li>
              Others can only see time, duration and who scheduled event. Uses same encryption techinque as{" "}
              <strong>Threads</strong>.
            </ul>
            <h3>
              <strong>Broker</strong>
            </h3>
            <ul>
              <li>Queue tasks with service providers</li>
              <li>Task owner shedules a task with service provider for a price. second.</li>
              <li>Task is retrieved by service provider from a queue.</li>
              <li>Task payment can be challenged after 24h.</li>
              <li>Can be used for automatic task scheduling</li>
              Others can only see time and who scheduled event. Uses same encryption techinque defined within service
              provider specifications.
            </ul>
            <h3>
              <strong>Content monetization</strong>
            </h3>
            <ul>
              <li>Users can create feeds for other users to subscribe and pay for.</li>
              <li></li>
            </ul>
            <h3>
              <strong>Governance</strong>
            </h3>
            <ul>
              <li>Users can create a pool based on a feed.</li>
              <li>Can be used for evaluation of feed content.</li>
              <li>Useful for mechanisms like proposals.</li>
            </ul>
            <h3>
              <strong>Feeds</strong>
            </h3>
            <ul>
              <li>Create a post in interaction graph.</li>
              <li>Contents of a feed are public by default.</li>
              <li>Users can comment, share, like and bookmark a feed</li>
              <li>Encrypted feeds are available only for subscribers. Subscribers can only see feeds that are after</li>
            </ul>

            <hr />
          </div>
        </Card>
      </>
    </div>
  );
}

export default About;
