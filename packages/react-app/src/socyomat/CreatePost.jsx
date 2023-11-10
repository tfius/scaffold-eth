// main component for SocialGraph contract visualization
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { fetchJson } from "ethers/lib/utils";
import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
import { DropzoneReadFileContents } from "../Swarm/DropzoneReadFileContents";
import Dropzone from "react-dropzone";
import { useDropzone } from "react-dropzone";

//import tf from "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs-core";
import * as toxicity from "@tensorflow-models/toxicity";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import "@tensorflow/tfjs-backend-cpu";
// const tf = require("@tensorflow/tfjs-node");
import { CollapseProps } from "antd";
//require("@tensorflow/tfjs");
//const toxicity = require("@tensorflow-models/toxicity");
import { hyperplanesX } from "./hyperplanes_16";
var HYPER = null;

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
  Collapse,
} from "antd";
const { Panel } = Collapse;

// returns list of @strings in text
function findAtStrings(text) {
  // This regex matches any word that starts with @
  const regex = /@\w+/g;
  // Use match() to find all instances in the text
  const matches = text.match(regex);
  // If matches is not null, return the array of matches, otherwise return an empty array
  return matches || [];
}
// returns list of #strings in text
function findHashStrings(text) {
  // This regex matches any word that starts with #
  const regex = /#\w+/g;
  // Use match() to find all instances in the text
  const matches = text.match(regex);
  // If matches is not null, return the array of matches, otherwise return an empty array
  return matches || [];
}
// retursn sentences separated by ., !, ?
function findSentences(text) {
  // This regex matches any word that starts with #
  const regex = /[^\.!\?]+[\.!\?]+/g;
  // Use match() to find all instances in the text
  const matches = text.match(regex);
  // If matches is not null, return the array of matches, otherwise return an empty array
  return matches || [];
}

// Function to generate random hyperplanes - Generate 256 random hyperplanes for a 256-bit hash
function generateHyperplanes(size, numPlanes) {
  return tf.randomNormal([size, numPlanes]);
}

// Function to compute the hash using embeddings and hyperplanes
function computeLSH(embeddings, hyperplanes) {
  const dotProduct = tf.matMul(embeddings, hyperplanes);
  const sign = tf.sign(dotProduct); // Get the sign of the dot product
  return sign;
}

// Helper function to convert the sign tensor to a binary hash
function convertToBinaryHash(signs) {
  return signs.arraySync().map(row => row.map(sign => (sign === 1 ? "1" : "0")).join(""));
}

// Function to convert a binary hash to bytes32
function binaryHashToBytes32(binaryHashes) {
  return binaryHashes.map(binary => {
    // Convert binary string to hexadecimal
    const hex = parseInt(binary, 2).toString(16).padStart(64, "0");
    return "0x" + hex;
  });
}
// Helper function to convert a binary string to hexadecimal
function binaryToHex(binaryStr) {
  let hex = "";
  for (let i = 0; i < binaryStr.length; i += 4) {
    let nibble = binaryStr.substr(i, 4);
    hex += parseInt(nibble, 2).toString(16);
  }
  return hex.padStart(64, "0"); // Pad to 64 characters for a bytes32
}

export default function CreatePost({
  readContracts,
  writeContracts,
  address,
  tx,
  onCreatePost,
  postToCommentOn,
  isOpen,
  setIsOpen,
}) {
  const cref = React.createRef();
  const xRef = useRef(null);
  //const [isOpen, setIsOpen] = useState(true);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [canPost, setCanPost] = useState(true); //
  const [tags, setTags] = useState([]);
  const [atStrings, setAtStrings] = useState([]); // @strings in text
  const [hashStrings, setHashStrings] = useState([]); // #strings in text
  const model = useRef();
  const useModel = useRef();
  const [category, setCategory] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [embeddings, setEmbeddings] = useState([]); // [embedding1, embedding2, ...
  const [sentences, setSentecens] = useState([]); // [sentence1, sentence2, ...
  //const [toxicity, setToxicity] = useState([]); // [toxicity1, toxicity2, ...
  const [embeddingsArray, setEmbeddingsArray] = useState(""); // [toxicity1, toxicity2, ...

  const doPredictions = async t => {
    const threshold = 0.8;
    const labels = ["identity_attack", "insult", "obscene", "severe_toxicity", "sexual_explicit", "threat", "toxicity"];
    if (t.trim().length > 0) {
      const sentencesArray = findSentences(t);
      for (let i = 0; i < sentencesArray.length; i++) {
        sentencesArray[i] = sentencesArray[i].trim();
      } // trim all sentences
      setSentecens(sentencesArray);

      model.current = model.current || (await toxicity.load(threshold, labels));
      const result = await model.current.classify(t).catch(err => {
        console.error(err);
      });
      //console.log(result);
      setPredictions(result);

      await doSentenceEmbeddings(t); //sentencesArray);

      setLoading(false);
      setCanPost(false);
      for (let i = 0; i < result.length; i++) {
        if (result[i].results[0].match === true) {
          // disable post button
          console.error("can't post");
          return;
        }
      }
      setCanPost(true);
    }
  };

  const doSentenceEmbeddings = async sentencess => {
    useModel.current = useModel.current || (await use.load());
    const embeds = await useModel.current.embed(sentencess).catch(err => {
      console.error(err);
    });
    setEmbeddings(embeds);
    //console.log("embeds", embeds);
    setEmbeddingsArray(await embeds.array());

    // Generate hyperplanes (you can also use your own hyperplanes)
    // Assume embeddings size is 512, change this if the model outputs different size
    const embeddingSize = 512;
    const numPlanes = 128; // For a 512-bit hash use 256 hyperplanes
    if (HYPER == null) {
      HYPER = hyperplanesX;
      //HYPER = generateHyperplanes(embeddingSize, numPlanes);
    }
    // const hyperplanesArray = await HYPER.array(); // Convert to nested array
    // const hyperplanesJSON = JSON.stringify(hyperplanesArray);
    // console.log("hyperplanesJSON", hyperplanesJSON);

    // Compute the LSH
    const hashSigns = computeLSH(embeds, HYPER); // hyperplanesX
    //4861c5e263cb4b39c7e15ebac5b419f07aeaa4c067188e5cc956181644a546ae
    //5c4a3790168b76fa384ec060ae55487cb89500a485fbe6a363f83e9e88044b72

    // Convert the signs to a binary hash
    const binaryHashes = convertToBinaryHash(hashSigns);
    console.log("binaryHashes", binaryHashes);
    const bytes32Hashes = binaryToHex(binaryHashes.toString());
    console.log("bytes32Hashes", bytes32Hashes);
    setCategory(bytes32Hashes);
    //return binaryHashes;
    /*
    const hyperplanes = generateHyperplanes(256, 512); // // For a 256-bit hash, you would need 256 hyperplanes
    const tensor = tf.tensor(embeds.arraySync());
    debugger;
    const hash = getBinaryHash(tensor, hyperplanes);
    console.log("hash", hash);
    */
  };

  useEffect(() => {
    const timeOutId = setTimeout(() => doPredictions(text), 1000);
    return () => clearTimeout(timeOutId);
  }, [text]);

  const onTextChange = useCallback(async t => {
    setLoading(true);
    setAtStrings(findAtStrings(t));
    setHashStrings(findHashStrings(t));
    setText(t);
  });
  const addAttachment = async (file, binaryData) => {
    var newFile = { file, binaryData: binaryData, hash: consts.emptyHash };
    setAttachments([...attachments, newFile]);
  };
  const removeAttachment = async attachment => {
    setAttachments(attachments.filter(a => a !== attachment));
  };

  function onReadFile(file, binaryData) {
    addAttachment(file, binaryData);
    console.log("onReadFile", file, binaryData, addAttachment);
  }
  async function CreatePost() {
    console.log("CreatePost", text, attachments);
    setLoading(true);
    //const tags = [...atStrings, ...hashStrings];
    // calculate hashes for tags
    //ethers.utils.toUtf8Bytes(itemName)).toString()
    const tagsHashes = hashStrings.map(t => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(t)).toString());
    console.log(tagsHashes);
    const atHashes = atStrings.map(t => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(t)).toString());
    console.log(atHashes);
    const ats = [];
    atHashes.map((t, i) => {
      ats.push({ hash: t, name: atStrings[i] });
    });
    const tgs = [];
    tagsHashes.map((t, i) => {
      tgs.push({ hash: t, name: hashStrings[i] });
    });

    var locations = [];
    for (var i = 0; i < attachments.length; i++) {
      var a = attachments[i];
      hash = await uploadDataToBee(a.binaryData, a.file.type, a.file.name);
    }

    var postData = {
      message: text,
      attachments: attachments,
      tags: tgs,
      ats: ats,
      sender: address,
      sendTime: Date.now(),
      toxicity: predictions,
      //embeddings: { data: await embeddings.print(), shape: embeddings.shape },
      shape: embeddings.shape,
      embeddings: JSON.stringify(await embeddings.array()),
      sentences: sentences,
      parentPost: postToCommentOn ? postToCommentOn.postId : null,
    };

    //embeddings.print();
    var m = JSON.stringify(postData);
    const contentsLocation = await uploadDataToBee(m, "application/json", "post.json");
    console.log(contentsLocation, postData);

    try {
      if (postToCommentOn != null) {
        var newTx = await tx(
          writeContracts.SocialGraph.comment(
            postToCommentOn.postId,
            "0x" + contentsLocation,
            tagsHashes,
            atHashes,
            "0x" + category,
          ),
        );
        await newTx.wait();
      } else {
        var newTx = await tx(
          writeContracts.SocialGraph.createPost("0x" + contentsLocation, tagsHashes, atHashes, "0x" + category),
        );
        await newTx.wait();
        //console.log(newTx);
      }
    } catch (e) {
      console.error(e);
      notification.error({
        message: "Error",
        description: e.message,
        placement: "bottomRight",
        duration: 10,
      });
    }
    setLoading(false);
    setIsOpen(false);
    onCreatePost();
  }

  //const tx = writeContracts.SocialGraph.createPost(text);

  // input field, post button, attachments button
  return (
    <Modal
      style={{ width: "80%", borderRadious: "20px" }}
      title={null}
      footer={null}
      visible={isOpen}
      maskClosable={false}
      onCancel={() => {
        setIsOpen(false);
      }}
    >
      <div style={{ width: "95%" }}>
        {postToCommentOn && <span>{postToCommentOn.message.slice(0, 256)}</span>}
        <Input.TextArea
          maxLength={2048}
          rows={5}
          placeholder="What's on your mind?"
          autosize={{ minRows: "5", maxRows: "10" }}
          onChange={e => onTextChange(e.target.value)}
        />
        {}
        <Button type="primary" disabled={!canPost || loading} onClick={() => CreatePost()} style={{ width: "100%" }}>
          {loading ? <Spin /> : "Post"}
        </Button>
        <div></div>
        {/* <Button type="primary">Attach</Button> */}
        {/* <MyDropzone ref={xRef} onAdd={onReadFile} /> */}
        {/* <DropzoneReadFileContents refObj={xref} onAdd={addAttachment()}/> */}
        {/* <br /> */}
        {attachments.map((a, i) => {
          return (
            <small key={i}>
              <Button type="primary" onClick={() => removeAttachment(a)}>
                X
              </Button>
              <div>{a.file.name + " "}</div>
            </small>
          );
        })}
        <Collapse>
          <Panel header="Details" key="1">
            <Collapse bordered={false}>
              <Panel header="Mentions" key="1">
                <p>
                  {atStrings.map((atString, index) => {
                    return <small key={index}>{atString + " "}</small>;
                  })}{" "}
                </p>
              </Panel>
              <Panel header="Tags" key="2">
                {hashStrings.map((hashString, index) => {
                  return <small key={index}>{hashString + " "}</small>;
                })}
              </Panel>
              <Panel header="Toxicity" key="3">
                {predictions.map((prediction, index) => {
                  const [{ match, probabilities }] = prediction.results;
                  return <small key={index}>{match === true ? prediction.label + " " : null}</small>;
                })}
              </Panel>

              <Panel header="Sentences" key="4">
                {sentences.map((sentece, index) => {
                  return (
                    <small key={index}>
                      {index + 1}:{sentece + " "}
                      <br />
                    </small>
                  );
                })}
                <small>Count: {sentences.length} </small>{" "}
              </Panel>
              <Panel header="Locality-Sensitive Hashing (LSH)" key="5">
                <small>
                  <small>{category}</small>
                </small>
              </Panel>
              <Panel header="Embeddings" key="6">
                <small style={{ overflowWrap: "anywhere" }}>{embeddingsArray.toString()} </small>{" "}
                {/* {embeddings.map((embedding, index) => {
                  return <small key={index}>{embedding.toString() + " "}</small>;
                })} */}
              </Panel>
            </Collapse>
          </Panel>
        </Collapse>
      </div>
    </Modal>
  );
}
