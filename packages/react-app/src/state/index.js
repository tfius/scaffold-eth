import { createContext, useContext, useEffect, useReducer } from "react";
import { uploadFileToBee, uploadJsonToBee } from "../parts/SwarmUpload/BeeService";
import { ethers } from "ethers";
import * as helpers from "../parts/helpers";

/*

State machine
-------------

Illustrated with file upload to Swarm

1) FileUpload.jsx - receive file from user - dispatch action to state machine with the file
....
dispatch({ type: "UPLOAD_TO_SWARM", payload: file });
...

2) state/index.js - process file and add result to state
a) reducerActions - states for handing file upload: UPLOAD_TO_SWARM, PREVIEW_UPLOAD, UPLOAD_SUCCESS, UPLOAD_FAIL  
...
case "UPLOAD_TO_SWARM":
    payload,
    upload: true
...

b) StoreProvider useEffect - triggers when the action updates the upload boolean flag
...
useEffect(() => {
  if (state.upload) {
    uploadToSwarm(state.payload);
  }
}, [state.upload]);
...

c) uploadToSwarm - upload file and calls dispatch with file hash

const uploadToSwarm = async file => {
  dispatch({ type: "LOADING" }); // turn on loaders etc on the front end

  let payload = buildPayload(file);
  dispatch({ type: "PREVIEW_UPLOAD", file: payload }); // provider the blob url while user waits for upload to finish

  try {
    const hash = await uploadFileToBee(file);
    dispatch({ type: "UPLOAD_SUCCESS", hash: "0x" + hash }); // upload complete, dispatch action with hash
  } catch (error) {
    console.log("error", error);
    dispatch({ // upload failed, show user the error message why upload failed
      type: "UPLOAD_FAIL",
      error: true,
      errorMessage: error.message,
    });
  }
};

d) reducerActions - states for handling file upload responses: UPLOAD_SUCCESS, UPLOAD_FAIL  
...
case "UPLOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        upload: false,
        hash: action.hash,
        error: false,
        appendDataToken: false,
      };
case "UPLOAD_FAIL":
  return {
    ...state,
    upload: false,
    error: true,
    errorMessage: action.errorMessage,
  };
...

e) FileUpload.jsx or any other consumer - access state objects and paint ui

// get the states
const {
  state: { file, hash, loading, error, errorMessage }
} = useStore();

...
{file?.mimeType.includes("image") && (<img src={file?.previewUrl} />)}
...


*/

const reducerActions = (state = initialState, action) => {
  const { type, payload } = action;
  console.log("action: ", type);
  switch (type) {
    case "UPLOAD_TO_SWARM":
      return {
        ...state,
        loading: true,
        error: false,
        errorMessage: null,
        payload,
        progressCb: action.progressCb,
        upload: true,
        hash: null,
        appendDataToken: false,
      };
    case "PREVIEW_UPLOAD":
      return {
        ...state,
        loading: true,
        error: false,
        file: action.file,
        upload: true,
        appendDataToken: false,
      };
    case "UPLOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        upload: false,
        hash: action.hash,
        error: false,
        appendDataToken: false,
      };
    case "UPLOAD_FAIL":
      return {
        ...state,
        upload: false,
        error: true,
        errorMessage: action.errorMessage,
      };
    case "APPEND_DATA_TOKEN":
      return {
        ...state,
        loading: false,
        error: false,
        payload,
        appendDataToken: true,
      };
    case "APPEND_DATA_TOKEN_SUCCESS":
      return {
        ...state,
        loading: false,
        error: false,
        payload,
        file: null,
        appendDataToken: false,
      };

    case "CREATE_DATA_TOKEN":
      return {
        ...state,
        loading: false,
        error: false,
        payload,
        createDataToken: true,
      };
    case "CREATE_DATA_TOKEN_SUCCESS":
      return {
        ...state,
        error: false,
        loading: false,
        upload: false,
        file: null,
        createDataToken: false,
        hash: null,
        metadataHash: payload,
      };
    case "CREATE_DATA_TOKEN_FAIL":
      return {
        ...state,
        loading: false,
        upload: false,
        file: null,
        createDataToken: false,
        hash: null,
        error: true,
        errorMessage: payload,
      };
    case "RESET":
      return initialState;
    case "LOADING":
      return { ...state, loading: true, error: false };
    case "ERROR":
      let msg = payload;
      // format the number into a human readable format
      let formatBytes = msg.substring(msg.indexOf("an") + 3, msg.indexOf("bytes"));
      msg =
        msg.replace(formatBytes + "bytes", convertBytesToString(formatBytes, 0)) +
        ". Please try again with a smaller file.";
      return { ...state, loading: false, error: true, errorMessage: msg };
    default:
      return state;
  }
};

const StoreContext = createContext({});

const initialState = {
  loading: false,
  file: null,
  error: false,
  errorMessage: null,
  hash: null,
  upload: false,
  appendDataToken: false,
  metadataHash: null,
};

const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducerActions, initialState);

  useEffect(() => {
    if (state.upload) {
      uploadToSwarm(state.payload);
    }
  }, [state.upload]);

  useEffect(() => {
    const process = async () => {
      if (state.createDataToken) {
        await createDataToken(state.payload, state.file);
      }
    };
    process();
  }, [state.createDataToken]);

  useEffect(() => {
    console.log("append data payload: ", state.payload);
    const process = async () => {
      if (state.appendDataToken) {
        await appendDataToken(state.payload, state.hash);
      }
    };
    process();
  }, [state.appendDataToken]);

  const uploadToSwarm = async file => {
    dispatch({ type: "LOADING" });

    let payload = buildPayload(file);
    dispatch({ type: "PREVIEW_UPLOAD", file: payload });

    try {
      const hash = await uploadFileToBee(file);
      dispatch({ type: "UPLOAD_SUCCESS", hash: "0x" + hash });
      console.log("hash", hash);
    } catch (error) {
      console.log("error", error);
      dispatch({
        type: "UPLOAD_FAIL",
        error: true,
        errorMessage: error.message,
      });
    }
  };

  const createDataToken = async (
    { tx, writeContracts, selectedCollection, address, metadataAddress, locationAddress, title, text },
    file,
  ) => {
    try {
      let postHash = undefined;
      let post = {
        title,
        text,
        type: file?.selectedType,
        mimeHash: file?.mimeHash,
        mimeType: file?.mimeType,
        time: Date.now(),
        address: address,
        dataHash: locationAddress,
      };
      console.log("post text", post);
      postHash = "0x" + (await uploadJsonToBee(post, "post.json"));
      console.log("postHash", postHash);
      console.log("metadataAddress", metadataAddress);
      tx(
        writeContracts.DataMarket.createDataToken(selectedCollection, address, 0, postHash, locationAddress),
        update => {
          if (update?.error?.toString().includes("string 'ex'")) {
            console.log("dispatch token creation error due to an existing token");
            dispatch({ type: "CREATE_DATA_TOKEN_FAIL", payload: "Token already exists, please try another file." });
          }

          if (update && (update.status === "confirmed" || update.status === 1)) {
            console.log(" 🍾 Transaction " + update.hash + " finished!");
            dispatch({ type: "CREATE_DATA_TOKEN_SUCCESS", payload: postHash });
          }
        },
      );
      // tx(writeContracts.DataMarket.createDataToken(selectedCollection, address, 0, metadataAddress, locationAddress));
    } catch (error) {
      console.log("error creating data token", error);
      throw error;
    }
  };

  const appendDataToken = async ({ title, postText, text, address, avatarToken, tokenData, contract, id }, hash) => {
    console.log("appendDataToken", { title, postText, text, address, avatarToken, tokenData, contract, id }, hash);
    console.log("avatarToken", avatarToken);
    var post = {
      title,
      postText: postText ? postText : text,
      address: address,
      time: Date.now(),
      avatarId: avatarToken?.id,
      avatarName: avatarToken?.name,
      id: tokenData.id,
      uri: tokenData.uri,
      contract: contract.address,
      type: "post",
    };
    if (hash) {
      post.fileHash = hash;
    }
    console.log("post text", post);
    const swarmHash = await uploadJsonToBee(post, "post.json");
    console.log("swarmHash", swarmHash);
    const result = await helpers.makeCall("addDataLocation", contract, [id, "0x" + swarmHash]); // make tx

    dispatch({ type: "APPEND_DATA_TOKEN_SUCCESS", payload: post });

    //console.log("result", result);
  };

  return <StoreContext.Provider value={{ state, dispatch }}> {children} </StoreContext.Provider>;
};

export const metadataTypes = [
  { name: "Unknown", metadata: "0x0000000000000000000000000000000000000000000000000000000000000000" }, //0
  { name: "Audio", metadata: "0x0000000000000000000000000000000000000000000000000000000000000001" }, // 1
  { name: "Image", metadata: "0x0000000000000000000000000000000000000000000000000000000000000002" }, // 2
  { name: "Video", metadata: "0x0000000000000000000000000000000000000000000000000000000000000003" }, // 3
  { name: "3D Model", metadata: "0x0000000000000000000000000000000000000000000000000000000000000004" }, // 4
  { name: "Animation", metadata: "0x0000000000000000000000000000000000000000000000000000000000000004" }, // 5
  { name: "Source Code", metadata: "0x0000000000000000000000000000000000000000000000000000000000000005" }, // 6
  { name: "Docs", metadata: "0x0000000000000000000000000000000000000000000000000000000000000006" }, // 7
  { name: "Sheets", metadata: "0x0000000000000000000000000000000000000000000000000000000000000007" }, // 8
  { name: "Slides", metadata: "0x0000000000000000000000000000000000000000000000000000000000000008" }, // 9
  { name: "Forms", metadata: "0x0000000000000000000000000000000000000000000000000000000000000009" }, // 10
  { name: "PDF", metadata: "0x0000000000000000000000000000000000000000000000000000000000000010" }, // 11
  { name: "Calendar", metadata: "0x0000000000000000000000000000000000000000000000000000000000000011" }, // 12
  { name: "CSV", metadata: "0x0000000000000000000000000000000000000000000000000000000000000012" }, // 13
  { name: "VCard", metadata: "0x0000000000000000000000000000000000000000000000000000000000000013" }, // 14
  { name: "JSON", metadata: "0x0000000000000000000000000000000000000000000000000000000000000014" }, // 15
  { name: "Text", metadata: "0x0000000000000000000000000000000000000000000000000000000000000015" }, // 16
];

const buildPayload = file => {
  const mime = file.type;
  var mimebytes = ethers.utils.toUtf8Bytes(mime);
  var mimehash = ethers.utils.keccak256(mimebytes);

  var valType = 0; //var mime = new TextDecoder().decode(mimes);

  if (typeof mime === "string" || mime instanceof String) {
    if (mime.includes("audio") == true) valType = 1;
    else if (mime.includes("image") == true) valType = 2;
    else if (mime.includes("video") == true) valType = 3;
    else if (mime.includes("3dmodel") == true) valType = 4;
    // TODO: FIX need to get file extension to get proper type
    else if (mime.includes("animation") == true) valType = 5;
    // TODO: FIX need to get file extension to get proper type
    else if (mime.includes("sourcecode") == true) valType = 6;
    // TODO: FIX need to get file extension to get proper type
    else if (mime.includes("spreadsheet") == true) valType = 8;
    else if (mime.includes("document") == true) valType = 7;
    else if (mime.includes("presentation") == true) valType = 9;
    else if (mime.includes("form") == true) valType = 10;
    else if (mime.includes("pdf") == true) valType = 11;
    else if (mime.includes("text/calendar") == true) valType = 12;
    else if (mime.includes("text/csv") == true) valType = 13;
    else if (mime.includes("text/x-vcard") == true) valType = 14;
    else if (mime.includes("application/json") == true) valType = 15;
    else if (mime.includes("text/plain") == true) valType = 16;

    let payload = {
      filename: file.name,
      filesize: (file.size / 1024).toFixed(1),
      mimeType: file.type,
      mimeHash: mimehash,
      metadataAddress: metadataTypes[valType].metadata,
      selectedType: metadataTypes[valType].name,
      previewUrl: URL.createObjectURL(file),
    };
    console.log("payload: ", payload);

    return payload;
  }
};

const useStore = () => {
  const { state, dispatch } = useContext(StoreContext);
  return { state, dispatch };
};

export { StoreProvider, useStore };
