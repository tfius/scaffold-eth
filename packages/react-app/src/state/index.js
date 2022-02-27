import { createContext, useContext, useEffect, useReducer } from "react";
import { uploadFileToBee, uploadJsonToBee } from "../parts/SwarmUpload/BeeService";
import { ethers } from "ethers";

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
      };
    case "CREATE_DATA_TOKEN":
      return {
        ...state,
        loading: true,
        error: false,
        payload,
        createDataToken: true,
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
    case "PREVIEW_UPLOAD":
      return {
        ...state,
        loading: true,
        error: false,
        file: action.file,
        upload: true,
      };
    case "UPLOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        upload: false,
        hash: action.hash,
        error: false,
      };
    case "UPLOAD_FAIL":
      return {
        ...state,
        upload: false,
        error: true,
        errorMessage: action.errorMessage,
      };
    case "DONE":
      return {
        ...state,
        error: false,
        loading: false,
        upload: false,
        file: null,
        createDataToken: false,
        hash: null,
      };
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
      if (title || text) {
        let post = {
          title,
          text,
          type: file?.selectedType,
          time: Date.now(),
          address: address,
          dataHash: locationAddress,
        };
        console.log("post text", post);
        postHash = "0x" + (await uploadJsonToBee(post, "post.json"));
        console.log("postHash", postHash);
        console.log("metadataAddress", metadataAddress);
      }
      tx(
        writeContracts.DataMarket.createDataToken(
          selectedCollection,
          address,
          0,
          postHash ? postHash : metadataAddress,
          locationAddress,
        ),
        update => {
          if (update?.error?.toString().includes("string 'ex'")) {
            console.log("dispatch token creation error due to an existing token");
            dispatch({ type: "CREATE_DATA_TOKEN_FAIL", payload: "Token already exists, please try another file." });
          }

          if (update && (update.status === "confirmed" || update.status === 1)) {
            console.log(" 🍾 Transaction " + update.hash + " finished!");
            dispatch({ type: "DONE" });
          }
        },
      );
      // tx(writeContracts.DataMarket.createDataToken(selectedCollection, address, 0, metadataAddress, locationAddress));
    } catch (error) {
      console.log("error creating data token", error);
      throw error;
    }
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
