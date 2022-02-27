import { Bee } from "@ethersphere/bee-js";
import { Reference } from "@ethersphere/bee-js";

import * as helpers from "../helpers";

const POSTAGE_STAMP = "0000000000000000000000000000000000000000000000000000000000000000";
//const POSTAGE_STAMP = "697f04ee51e42323fe281d1d596aed53a86e4e9b0a84a7abfc834e76781cd806";

const META_FILE_NAME = ".swarmgatewaymeta.json";

export const uploadFileToBee = async file => {
  const lastModified = file.lastModified;
  const bee = new Bee(helpers.uploadGateway);
  console.log("bee", bee);

  const metadata = {
    name: file.name,
    type: file.type,
    size: file.size,
  };

  console.log("metadata", metadata);

  const metafile = new File([JSON.stringify(metadata)], META_FILE_NAME, {
    type: "application/json",
    lastModified,
  });

  const files = [file, metafile];
  var batchId = POSTAGE_STAMP; // as Reference;

  /*
  //const batchId = await bee.createPostageBatch('100', 17)
  batchId = await bee.createPostageBatch(file.size, 17);
  console.log(batchId);
*/
  /*
  const fileHash = await bee.uploadData(batchId, "Bee is awesome!"); 
  console.log("fileHash", fileHash);
*/
  /* 
  const config = {
    onUploadProgress: progressEvent => {
      // let { progress } = this.state;
      var progress = (progressEvent.loaded / progressEvent.total) * 100;
      //this.setState({ progress });
      console.log(progress);
    },
  };
  const axiosInstance = axios.create({ onDonwloadProgress: progressCb });
  const fetch = bioččdAxopsFetcj(axiosInstance);
  */
  try {
    const { reference } = await bee.uploadFiles(batchId, files, {
      indexDocument: metadata.name,
      /*fetch,*/
    });

    console.log("reference", reference);

    return reference;
  } catch (error) {
    throw error;
  }
};

export const uploadDataToBee = async (data, type, filename) => {
  const file = new File([data], filename, { type });
  return uploadFileToBee(file);
};

export const uploadJsonToBee = async (object, filename) => {
  const jsn = JSON.stringify(object);
  const blob = new Blob([jsn], { type: "application/json" });
  const file = new File([blob], filename);
  /*
  const file = new File([JSON.stringify(object)], filename, {
    type: "application/json"
  });*/
  return uploadFileToBee(file);
};
