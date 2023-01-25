import { encrypt } from "@metamask/eth-sig-util";
import { ethers } from "ethers";
import { deriveDriveKey, deriveFileKey, fileDecrypt, fileEncrypt } from "@/utils/w3crypto";
import { FileContract } from "@/utils/contract";

import BigNumber from "bignumber.js";
const ascii85 = require("ascii85");

const stringToHex = s => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
const hexToString = h => ethers.utils.toUtf8String(h);

export async function createRootKey() {
  const seed = new Uint16Array(8);
  window.crypto.getRandomValues(seed);
  return await deriveDriveKey(seed.buffer, "password");
}

export async function getPublicKey(account) {
  try {
    return await window.ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: [account],
    });
  } catch (e) {
    return undefined;
  }
}

export async function getPublicKeyByAddress(controller, account) {
  const fileContract = FileContract(controller);
  const result = await fileContract.getPublicKey(account);
  if (new BigNumber(result).toNumber() === 0) {
    return undefined;
  }
  const publicKey = result.substr(2, result.length - 1);
  return Buffer.from(publicKey, "hex").toString("base64");
}

export async function register(controller, publicKey) {
  publicKey = "0x" + Buffer.from(publicKey, "base64").toString("hex");
  const fileContract = FileContract(controller);
  const tx = await fileContract.register(publicKey);
  const receipt = await tx.wait();
  return receipt.status;
}

// email send & receive
// publicKey: base64, data: Buffer|string : return Buffer
function encryptEmailKey(publicKey, data) {
  // Returned object contains 4 properties: version, ephemPublicKey, nonce, ciphertext
  // Each contains data encoded using base64, version is always the same string
  const enc = encrypt({
    publicKey: publicKey,
    data: ascii85.encode(data).toString(),
    version: "x25519-xsalsa20-poly1305",
  });

  // We want to store the data in smart contract, therefore we concatenate them
  // into single Buffer
  const buf = Buffer.concat([
    Buffer.from(enc.ephemPublicKey, "base64"),
    Buffer.from(enc.nonce, "base64"),
    Buffer.from(enc.ciphertext, "base64"),
  ]);

  // In smart contract we are using `bytes[112]` variable (fixed size byte array)
  // you might need to use `bytes` type for dynamic sized array
  // We are also using ethers.js which requires type `number[]` when passing data
  // for argument of type `bytes` to the smart contract function
  // Next line just converts the buffer to `number[]` required by contract function
  // THIS LINE IS USED IN OUR ORIGINAL CODE:
  // return buf.toJSON().data;

  // Return just the Buffer to make the function directly compatible with decryptData function
  return buf;
}

export async function sendEmail(
  controller,
  emailUuid,
  driveKey,
  sendPublicKey,
  receivePublicKey,
  toAddress,
  isEncryption,
  title,
  message,
  fileUuid,
) {
  let hexData;
  let hexFileUuid;
  let cost = 0;
  if (isEncryption) {
    // create key
    const emailKey = await deriveFileKey(driveKey, emailUuid);
    // encrypt email key by receive user public key
    const encryptSendKey = encryptEmailKey(sendPublicKey, Buffer.from(emailKey, "base64"));
    const encryptReceiveKey = encryptEmailKey(receivePublicKey, Buffer.from(emailKey, "base64"));
    // encrypt content
    const encryptResult = await fileEncrypt(emailKey, message);
    // data
    const encryptContent = Buffer.concat([
      encryptSendKey, // 112
      encryptReceiveKey, // 112
      Buffer.from(encryptResult.cipherIV, "base64"), // 12
      encryptResult.data,
    ]);

    const fileSize = Buffer.byteLength(encryptContent);
    if (fileSize > 24 * 1024 - 326) {
      cost = Math.floor((fileSize + 326) / 1024 / 24);
    }
    hexData = "0x" + encryptContent.toString("hex");
    hexFileUuid = stringToHex(fileUuid);
  } else {
    const fileSize = Buffer.byteLength(message);
    if (fileSize > 24 * 1024 - 326) {
      cost = Math.floor((fileSize + 326) / 1024 / 24);
    }
    hexData = stringToHex(message);
    hexFileUuid = "0x";
  }

  const fileContract = FileContract(controller);
  const hexUuid = stringToHex(emailUuid);
  const hexTitle = stringToHex(title);
  try {
    const tx = await fileContract.sendEmail(toAddress, isEncryption, hexUuid, hexTitle, hexData, hexFileUuid, {
      value: ethers.utils.parseEther(cost.toString()),
    });
    const receipt = await tx.wait();
    return receipt.status;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function getEmails(contract, type) {
  const fileContract = FileContract(contract);
  let result;
  if (type === 1) {
    result = await fileContract.getInboxEmails();
  } else {
    result = await fileContract.getSentEmails();
  }
  const emailList = [];
  const isEncryptions = result[0];
  const times = result[1];
  const fromMails = result[2];
  const toMails = result[3];
  const uuids = result[4];
  const titles = result[5];
  const fileUuids = result[6];
  const fileNames = result[7];
  for (let i = 0; i < uuids.length; i++) {
    const email = {
      isEncryption: isEncryptions[i],
      time: new Date(parseInt(times[i], 10) * 1000),
      fromMail: fromMails[i],
      toMail: toMails[i],
      uuid: uuids[i],
      title: titles[i],
      fileUuid: fileUuids[i],
      fileName: fileNames[i],
    };
    emailList.push(email);
  }
  emailList.sort(function (a, b) {
    return b.time - a.time;
  });
  return emailList;
}

// account: string, data: Buffer): Promise<Buffer>
async function decryptEmailKey(account, data) {
  // Reconstructing the original object outputed by encryption
  const structuredData = {
    version: "x25519-xsalsa20-poly1305",
    ephemPublicKey: data.slice(0, 32).toString("base64"),
    nonce: data.slice(32, 56).toString("base64"),
    ciphertext: data.slice(56).toString("base64"),
  };
  // Convert data to hex string required by MetaMask
  const ct = `0x${Buffer.from(JSON.stringify(structuredData), "utf8").toString("hex")}`;
  // Send request to MetaMask to decrypt the ciphertext
  // Once again application must have acces to the account
  const decrypt = await window.ethereum.request({
    method: "eth_decrypt",
    params: [ct, account],
  });
  // Decode the base85 to final bytes
  return ascii85.decode(decrypt);
}

export async function getEmailMessageByUuid(contract, account, isEncryption, types, fromMail, uuid) {
  const fileContract = FileContract(contract);
  try {
    const result = await fileContract.getEmailContent(fromMail, uuid, 0);
    if (result === "0x") {
      return {
        key: "",
        content: "-deleted",
      };
    }

    if (isEncryption === "false") {
      return {
        key: "",
        content: hexToString(result),
      };
    }

    const content = result.substr(2, result.length - 1);
    const data = Buffer.from(content, "hex");
    let toKeyData;
    if (types === "1") {
      // inbox [112 - 224)
      toKeyData = data.slice(112, 224);
    } else {
      // sendKey [0 - 112)
      toKeyData = data.slice(0, 112);
    }
    const encryptKey = await decryptEmailKey(account, toKeyData);
    const iv = data.slice(224, 236).toString("base64");
    const contentData = data.slice(236, data.length);
    const bf = await fileDecrypt(iv, encryptKey.toString("base64"), contentData);
    return {
      key: encryptKey.toString("base64"),
      content: bf.toString(),
    };
  } catch (e) {
    return undefined;
  }
}

export async function downloadFile(contract, fromMail, uuid, fileKey) {
  const fileContract = FileContract(contract);
  const chunkCount = await fileContract.countChunks(fromMail, uuid);
  if (chunkCount.toNumber() === 0) {
    return "-deleted";
  }
  const quest = [];
  for (let i = 0; i < chunkCount.toNumber(); i++) {
    quest.push(fileContract.getFile(fromMail, uuid, i));
  }
  const encryptDatas = await Promise.all(quest);
  let encryptData = "";
  for (let data of encryptDatas) {
    data = data.substr(2, data.length - 1);
    encryptData = encryptData + data;
  }

  // decrypt
  const data = Buffer.from(encryptData, "hex");
  const iv = data.slice(0, 12);
  const fileData = data.slice(12, data.length);
  return await fileDecrypt(iv, fileKey, fileData);
}

export async function deleteEmail(contract, types, uuids) {
  const fileContract = FileContract(contract);
  const tx = await fileContract.removeEmails(types, uuids);
  const receipt = await tx.wait();
  return receipt.status;
}
