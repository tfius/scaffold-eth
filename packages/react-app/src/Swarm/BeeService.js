import { notification } from "antd";
import { Bee } from "@ethersphere/bee-js";
// import { Reference } from "@ethersphere/bee-js";
// mainnet
export const downloadGateway = "https://gateway.fairdatasociety.org/bzz/";
export const uploadGateway = "https://gateway.fairdatasociety.org/proxy";
// testnet
//export const downloadGateway = "https://gw-testnet.fairdatasociety.org/bzz/";
//export const uploadGateway = "https://gw-testnet.fairdatasociety.org/proxy";
// constants
const POSTAGE_STAMP = "0000000000000000000000000000000000000000000000000000000000000000";
const META_FILE_NAME = ".swarmgatewaymeta.json";

export const uploadFileToBee = async file => {
  const lastModified = file.lastModified;
  const bee = new Bee(uploadGateway);
  //console.log("bee", bee);
  const metadata = {
    name: file.name,
    type: file.type,
    size: file.size,
  };

  //console.log("metadata", metadata);
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

  try 
  {
    const { reference } = await bee.uploadFiles(batchId, files, {
      indexDocument: metadata.name,
    });

    console.log("uploaded reference", reference, metadata.name);
    return reference;

  } catch (error) {
    notification.error({
      message: "Upload Error",
      description: error.message + " " + error.stack,
    })
  }

    console.log("error uploadFileToBee");
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

export const downloadDataFromBee = async (contentHash) => {
  /*const bee = new Bee(downloadGateway);
  const data = await bee.downloadData(contentHash).then(data => {
    return data;
  });
  return null;*/

  var url = downloadGateway + contentHash.substring(2) + "/";
  //console.log("downloading from", url);
  var json = await (await fetch(url)).json();

  //console.log("got json", json)
  return json;
}