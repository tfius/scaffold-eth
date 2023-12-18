import crypto from "crypto";
import hkdf from "futoin-hkdf";
import { parse } from "uuid";

import { uploadDataToBee } from "./../Swarm/BeeService";

const nacl = require("tweetnacl");
nacl.util = require("tweetnacl-util");

const authTagLength = 16;
const keyByteLength = 32;
const keyHash = "SHA-256";
const algo = "aes-256-gcm"; // crypto library does not accept this in uppercase. So gotta keep using aes-256-gcm

export function toHex(buffer) {
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

/// helper
export function urlEncodeHashKey(keyBuffer) {
  return keyBuffer.toString("base64").replace("=", "");
}
// helper
export function hex2base64url(dataHex) {
  const buffer = Buffer.from(dataHex, "hex");
  const base64 = buffer.toString("base64");
  const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return base64url;
}
export function hexToBase64(hexstring) {
  return btoa(
    hexstring
      .match(/\w{2}/g)
      .map(function (a) {
        return String.fromCharCode(parseInt(a, 16));
      })
      .join(""),
  );
}
export function base64ToHex(base64string) {
  return nacl.util.decodeBase64(base64string);
}

/*
export async function createRootKey(password) {
  const seed = new Uint16Array(8);
  window.crypto.getRandomValues(seed);
  return await deriveDriveKey(seed.buffer, password); // // 'password'
} 
*/
// Derive a key from the user's id
/*
export const deriveDriveKey = async (seed, dataEncryptionKey) => {
  const info = dataEncryptionKey;
  const driveKey = hkdf(Buffer.from(seed), keyByteLength, { info, hash: keyHash });
  return urlEncodeHashKey(driveKey);
};
*/
/*
export const encryptData = async (key, data) => {
  const keyData = Buffer.from(key, "base64");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algo, keyData, iv, { authTagLength });
  const encryptedBuffer = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
  return {
    cipher: "AES256-GCM",
    cipherIV: iv.toString("base64"),
    data: encryptedBuffer,
  };
};
*/
/*
export async function decryptData(key, data, cipherIV) {
  try {
    const authTag = data.slice(data.byteLength - authTagLength, data.byteLength);
    const encryptedDataSlice = data.slice(0, data.byteLength - authTagLength);
    const iv = Buffer.from(cipherIV, "base64");
    const keyData = Buffer.from(key, "base64");
    const decipher = crypto.createDecipheriv(algo, keyData, iv, { authTagLength });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedDataSlice), decipher.final()]);
  } catch (err) {
    // console.log (err);
    console.log("Error decrypting file data");
    return Buffer.from("Error", "ascii");
  }
}
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const ethUtil = require("ethereumjs-util");
const sigUtil = require("@metamask/eth-sig-util");
export async function MMgetPublicKey(signer, account) {
  try {
    // signer = window.ethereum
    return await signer.request({
      method: "eth_getEncryptionPublicKey",
      params: [account],
    });
  } catch (e) {
    return undefined;
  }
}
export async function MMgetECDN(provider, account, ephemeralKey) {
  try {
    // signer = window.ethereum
    return await provider.request({
      method: "eth_performECDH",
      params: [account],
    });
  } catch (e) {
    return undefined;
  }
}
export async function MMdecryptMessage(provider, accountToDecrypt, encryptedMessage) {
  try {
    // signer ?
    return await provider.request({
      method: "eth_decrypt",
      params: [encryptedMessage, accountToDecrypt],
    });
  } catch (e) {
    console.error("decryptMessage", e);
    return undefined;
  }
}
export async function MMencryptMessage(encryptionPublicKey /* receiver pubKey */, messageToEncrypt) {
  try {
    return ethUtil.bufferToHex(
      Buffer.from(
        JSON.stringify(
          sigUtil.encrypt({
            publicKey: encryptionPublicKey,
            data: messageToEncrypt,
            version: "x25519-xsalsa20-poly1305",
          }),
        ),
        "utf8",
      ),
    );
  } catch (e) {
    console.error("encryptMessage", e);
    return undefined;
  }
}

///////// this is the code to generate a new key pair that will be used to encrypt the data
/*
async function registerAccount() {
  // const key = await EncDec.MMgetPublicKey( window.ethereum, address);
  // const pk = "0x" + Buffer.from(key, "base64").toString("hex");
  const newWallet = ethers.Wallet.createRandom();
  const newPrivateKey = newWallet._signingKey().privateKey;
  const newPublicKey = ethers.utils.computePublicKey(newPrivateKey, true);
  console.log("newPrivateKey", newPrivateKey, EncDec.urlEncodeHashKey(newPrivateKey));
  console.log("newPublicKey", newPublicKey, EncDec.urlEncodeHashKey(newPublicKey));

  //const sharedSecret = newWallet._signingKey().computeSharedSecret(newPublicKey); // computeSharedSecret
  //console.log("sharedSecret", newPublicKey, EncDec.urlEncodeHashKey(newPublicKey));

  //const compressedPublicKey = EncDec.compressPublicKey(newPublicKey);
  const rkey = newPublicKey.substr(2, newPublicKey.length - 1);
  const bkey = Buffer.from(rkey, "hex").toString("base64");
  console.log("rkey bkey", rkey, bkey);
  const bkeypk = "0x" + Buffer.from(bkey, "base64").toString("hex");
  console.log("bkeypk", bkeypk);

  //var password = "password";
  //var rootKey = await EncDec.createRootKey(password);
  //console.log("driveKey", rootKey);
  var encryptKey = await EncDec.MMencryptMessage(newPublicKey, newPrivateKey);
  console.log("encryptKey", encryptKey);
  var decryptKey = await EncDec.MMdecryptMessage(window.ethereum, address, encryptKey);
  console.log("decryptKey", decryptKey);

  var uploadRootKeyHash = await uploadDataToBee(encryptKey, "enc", address);
  console.log("uploadRootKeyHash", uploadRootKeyHash);

  var downloadRootKeyData = await downloadDataFromBee("0x" + uploadRootKeyHash);
  var decodedRootKey = new TextDecoder("utf-8").decode(downloadRootKeyData);
  console.log("downloadRootKey", decodedRootKey);
  var decryptRootKey = await EncDec.MMdecryptMessage(window.ethereum, address, decodedRootKey);
  console.log("decryptKey", decryptRootKey);
  //const tx = await onRegister(pk); // await testMetamaskEncryption(key, address, "text to encrypt");
}
*/

//converts hex strings to the Uint8Array format used by nacl
export function nacl_decodeHex(msgHex) {
  var msgBase64 = new Buffer(msgHex, "hex").toString("base64");
  return nacl.util.decodeBase64(msgBase64);
}

export function nacl_decodePublicKey(receiverPublicKey) {
  return nacl.util.decodeBase64(receiverPublicKey);
}

export function nacl_encodePublicKey(receiverPublicKey) {
  return nacl.util.decodeBase64(receiverPublicKey);
}

export function nacl_getEncryptionPublicKey(privateKey) {
  var privateKeyUint8Array = nacl_decodeHex(privateKey.substr(2, privateKey.length));
  var encryptionPublicKey = nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).publicKey;
  return nacl.util.encodeBase64(encryptionPublicKey);
}

export function generate_ephemeral_key_pair() {
  return nacl.box.keyPair();
}

export function nacl_encrypt(message, receiverPublicKey) {
  try {
    var ephemeralKeyPair = generate_ephemeral_key_pair();
    return nacl_encrypt_with_key(message, receiverPublicKey, ephemeralKeyPair);
  } catch (e) {
    console.error("nacl_encrypt", e);
  }
  return null;
}

export function generateNoise() {
  return nacl.util.encodeBase64(nacl.randomBytes(1024));
}

export function generate_symetric_key() {
  let symetricKey = nacl.randomBytes(nacl.secretbox.keyLength);
  let nonceForMessage = nacl.randomBytes(nacl.secretbox.nonceLength);
  return { symetricKey, nonceForMessage };
}

export function convert_smail_pubKey (recipientPubKey) {
  //console.log("convert_smail_pubKey", recipientPubKey)
  const rkey = recipientPubKey.substr(2, recipientPubKey.length - 1);
  var pubKey = Buffer.from(rkey, "hex").toString("base64");
  //console.log("convert_smail_pubKey", recipientPubKey, pubKey);
  return { pubKey: pubKey };
}

// only requires the receiver's public keys (sender does not need to be bonded with smail)
export function nacl_encrypt_for_receivers(
  message,
  symetricKey /* { symmetricKey, nonceForMessage } */,
  receiverPublicKeys /* [address, pubKey] */,
) {
  // Encrypt the message
  let encryptedMessage = nacl.secretbox(
    nacl.util.decodeUTF8(message),
    symetricKey.nonceForMessage, //let symmetricKey = nacl.randomBytes(nacl.secretbox.keyLength);
    symetricKey.symetricKey, //let nonceForMessage = nacl.randomBytes(nacl.secretbox.nonceLength);
  );
  // recipientKey +LnyKbijWPsRLJ9ZB9XwZkyKZkVH9M7PNhdGQy3WaD0=
  // encryptWithKey = { publicKey, secretKey }
  var encryptedKeysForUsers = {};
  var keyToEncrypt = nacl.util.encodeBase64(symetricKey.symetricKey);
  for (var i = 0; i < receiverPublicKeys.length; i++) {
    var ephemeralKeyPair = nacl.box.keyPair(); // Generate ephemeral key pair for each user
    var publicKey = receiverPublicKeys[i].pubKey;
    //console.log("symetric, public, ephemeral", keyToEncrypt, publicKey.pubKey, ephemeralKeyPair);
    var encryptedKey = nacl_encrypt_with_key(keyToEncrypt, publicKey.pubKey, ephemeralKeyPair);
    encryptedKeysForUsers[receiverPublicKeys[i].address] = encryptedKey;
  }
  return {
    encryptedMessage: nacl.util.encodeBase64(encryptedMessage),
    encryptedNonce: nacl.util.encodeBase64(symetricKey.nonceForMessage),
    receivers: encryptedKeysForUsers,
  };
  // Distribute `encryptedMessage` and the corresponding `encryptedKeysForUsers` to each user
}
// to decrypt the message, the receiver needs to know the sender's public key
export function nacl_decrypt_for_receiver(encryptedMessage, nonceForMessage, userEncryptedKeyData, receiverPrivateKey) {
  // Decrypt the symmetric key, which is encrypted with the receiver's public key and ephemeral key pair (in userEncryptedKeyData)
  let decryptedSymmetricKey = nacl_decrypt(userEncryptedKeyData, receiverPrivateKey);
  // prepare the data for decryption
  let decryptedSymmetricKeyUint8Array = nacl.util.decodeBase64(decryptedSymmetricKey);
  let nonceForMessageUint8Array = nacl.util.decodeBase64(nonceForMessage);
  var msgParamsUInt8Array = nacl.util.decodeBase64(encryptedMessage);
  //console.log("decryptedSymmetricKey", decryptedSymmetricKey);
  //console.log("nonceForMessage", nonceForMessage);

  let decryptedMessage = nacl.secretbox.open(
    msgParamsUInt8Array, //encryptedMessage,
    nonceForMessageUint8Array,
    decryptedSymmetricKeyUint8Array,
  );
  // fails when decrypted message == null
  return nacl.util.encodeUTF8(decryptedMessage);
}

export function nacl_encrypt_with_key(message, receiverPublicKey, ephemeralKeyPair) {
  try {
    var pubKeyUInt8Array = nacl.util.decodeBase64(receiverPublicKey);
    var msgParamsUInt8Array = nacl.util.decodeUTF8(message);
    var nonce = nacl.randomBytes(nacl.box.nonceLength);
    var encryptedMessage = nacl.box(msgParamsUInt8Array, nonce, pubKeyUInt8Array, ephemeralKeyPair.secretKey);
    // handle encrypted data
    var output = {
      version: "x25519-xsalsa20-poly1305",
      nonce: nacl.util.encodeBase64(nonce),
      ephemPublicKey: nacl.util.encodeBase64(ephemeralKeyPair.publicKey),
      ciphertext: nacl.util.encodeBase64(encryptedMessage),
    };
    return output; // return encrypted msg data
  } catch (e) {
    console.error("nacl_encrypt_with_key", e);
  }
  return null;
}

export function nacl_decrypt_with_key(encryptedData, pubKey, privateKey) {
  try {
    var ephemPrivateKey = nacl.util.decodeBase64(privateKey);
    var ephemPubKey = nacl.util.decodeBase64(pubKey);
    // assemble decryption parameters
    var nonce = nacl.util.decodeBase64(encryptedData.nonce);
    var ciphertext = nacl.util.decodeBase64(encryptedData.ciphertext);
    //var ephemPublicKey = nacl.util.decodeBase64(encryptedData.ephemPublicKey);
    var decryptedMessage = nacl.box.open(ciphertext, nonce, ephemPubKey, ephemPrivateKey);
    var output = nacl.util.encodeUTF8(decryptedMessage);
    return output;
  } catch (e) {
    console.error("nacl_decrypt", e);
  }
}

export function nacl_decrypt(encryptedData, receiverPrivateKey) {
  try {
    var recieverPrivateKeyUint8Array = nacl_decodeHex(receiverPrivateKey);
    var recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(recieverPrivateKeyUint8Array).secretKey;
    // assemble decryption parameters
    var nonce = nacl.util.decodeBase64(encryptedData.nonce);
    var ciphertext = nacl.util.decodeBase64(encryptedData.ciphertext);
    var ephemPublicKey = nacl.util.decodeBase64(encryptedData.ephemPublicKey);
    var decryptedMessage = nacl.box.open(ciphertext, nonce, ephemPublicKey, recieverEncryptionPrivateKey);
    var output = nacl.util.encodeUTF8(decryptedMessage);
    return output;
  } catch (e) {
    console.error("nacl_decrypt", e);
  }
}

export function nacl_decrypt_with_rawkey(encryptedData, pubKey, privateKey) {
  try {
    var ephemPrivateKey = nacl.util.decodeBase64(privateKey);
    var ephemPubKey = nacl.util.decodeBase64(pubKey);
    // assemble decryption parameters
    var nonce = nacl.util.decodeBase64(encryptedData.nonce);
    var ciphertext = nacl.util.decodeBase64(encryptedData.ciphertext);
    var decryptedMessage = nacl.box.open(ciphertext, nonce, ephemPubKey, ephemPrivateKey);
    var output = nacl.util.encodeUTF8(decryptedMessage);
    return output;
  } catch (e) {
    console.error("nacl_decrypt", e);
  }
}

export async function encryptAndUpload(data, recipientKey) {
  var encryptedData = JSON.stringify(nacl_encrypt(JSON.stringify(data), recipientKey));
  var encryptedDataLocation = await uploadDataToBee(encryptedData, "application/octet-stream", Date.now() + ".data");
  return encryptedDataLocation;
}

export async function calculateSharedSecret(fromPrivateKey, toPublicKey) {
  var privateKey = nacl_decodeHex(fromPrivateKey);
  var pubKey = nacl.util.decodeBase64(toPublicKey);
  var sharedSecret = nacl.scalarMult(privateKey, pubKey);
  return sharedSecret;
}

export async function calculateSharedKey(fromPrivateKey, toPublicKey) {
  var sharedSecret = await calculateSharedSecret(fromPrivateKey, toPublicKey);
  var encKey = nacl.box.keyPair.fromSecretKey(sharedSecret);
  return encKey;
}
