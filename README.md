

# Smail 
Smail is an email-like system that provides a secure, one-way communication channel for users who are looking for a private and efficient way of exchanging information. Smail's unique features include a locker with sharing capabilities and a marketplace for pod subscriptions, making it an all-in-one platform for managing your email communications.

**One-way email** allows users to send messages to others without receiving any replies, ensuring that sensitive information remains confidential. This feature is ideal for business professionals, journalists, and anyone who values privacy in their communications.

The **locker** with sharing capabilities is another standout feature of Smail, allowing users to store their emails securely and share them with trusted parties when needed. This feature is especially useful for sharing sensitive information with clients or colleagues, and it ensures that your information remains safe at all times.

Finally, Smail's pod subscription marketplace **Data Hub** makes it easy to manage your data from your pods, email communications with vendors, service providers, and other third-party contacts. Users can subscribe to various data services and receive regular updates from vendors, ensuring that they stay up-to-date on important information without having to sift through countless emails.

In summary, Smail is an email system that prioritizes privacy, security, and convenience. With features like one-way email, a locker with sharing capabilities, and a pod subscription marketplace, Smail is the perfect choice for anyone who wants to take control of their data and communications.

# Bond with Smail
## How registration works:
- your public encryption key is requested with which new Smail Wallet is created
- Smail Wallet is encrypted with your MetaMask and uploaded to Swarm
- a transaction is sent to register Smail public key and Smail Wallet
Only MetaMask account that created Smail Wallet can decrypt and bond with it.

## How sending data works:
- Recipient's Smail public Key is retrieved
- New Ephemeral key is created
- Data is packaged, encrypted and uploaded
- A transaction is sent to notify receiver of new data available
You don't need to be bonded to send encrypted data. As long as receiver is registered with Smail you will be able to send encrypted data.

You will be asked to decrypt your Smail Wallet every time you visit this page. NOTE: Only receiver can retrieve and decrypt its contents.

### BEWARE AND BEHOLD
Always check that you are on correct domain and that you are using correct MetaMask account. Scammers could potentially ask you to decrypt Smail Wallet and gain access to your data.

## Pricing
When you send message you pay transaction costs and for storage fees on Swarm network. Data persistence is not guaranteed. Storage fees go to Smail maintainer and are used to buy Bzz tokens to store data for as long as possible. For how long you might ask? Answer to this question is tricky. It depends on market conditions as prices fluctuate when demand increases. If market is willing to pay more for storage, then postage stamps expire sooner and data will be garbage collected.

## Privacy
Sending unencrypted data is supported and occours when:
- if either sender or receiver is not a registered
- Sender's Smail Wallet can not be retrieved or is not decrypted
- Receiver public key can not be retrieved
You can read and send unencrypted messages if you are connected and not bonded.

**BEWARE !!!** All unencrypted data and attachements can be retrieved by anyone with the link. If you want to store unencrypted data you can use Swarm directly, or use FairOS or FDP protocol.

## Consideration
It must be noted that transaction is sent from your MetaMask account and is as such recorded on blockchain. Transaction metadata can be linked to your account.

## Networks
Multiple networks supported, BUT:
Cross network sending is NOT supported.
You will have to register on each network.
Each Smail Wallet will be different.

Which means if you send on one network, receiver will get message on that network only.

# Why Locker 
TODO 


# Pod Subscriptions
TODO

# FairOS WASM
TODO

###################################################################

How is it done ? https://github.com/dchest/tweetnacl-js/blob/master/README.md 

### Encrypt
```
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
```
### Decrypt
```
export async function decryptData(cipherIV, key, data) {
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

```

### smail (data from SwarmMail smart contract):
```
"0x973b3f2ad38b1acb64c07dcd3b2d6465157817413a2790f2bcc3dab87ab2b3c1"
from: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
to: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
isEncryption: false
signed: false
swarmLocation: "0x973b3f2ad38b1acb64c07dcd3b2d6465157817413a2790f2bcc3dab87ab2b3c1"
time: BigNumber {_hex: '0x63d3a9b7', _isBigNumber: true}

```


### Processed mail object
```
attachments: [
  {
    file: {
        path: "WorkSans-Medium.ttf"
        type: "font/ttf"
    }, 
    digest: '49d1f4ddae1c2beeeca2bdb3c2433d43f7c6b865434eae8d23223ccf6fbcf760'
  }
]
checked: false
contents: "some longer content with 3 files in attachments\nsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer content"
location: "0x927500d537a5a655cdf4bdfa94b3b40b0c92d8c745da4e739084fa14c4520c82"
recipient: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
sendTime: 1674828189845
sender: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
subject: "test"
time:BigNumber {_hex: '0x63d3d99a', _isBigNumber: true}
```

### This was built with 🏗 Scaffold-ETH

#### 🏄‍♂️ Quick Start &&Manual setup

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork 🏗 scaffold-eth:

```bash
git clone https://github.com/austintgriffith/scaffold-eth.git
```

> install and start your 👷‍ Hardhat chain:

```bash
cd scaffold-eth
yarn install
yarn chain
```

> in a second terminal window, start your 📱 frontend:

```bash
cd scaffold-eth
yarn start
```

> in a third terminal window, 🛰 deploy your contract:

```bash
cd scaffold-eth
yarn deploy
```

🌍 You need an RPC key for production deployments/Apps, create an [Alchemy](https://www.alchemy.com/) account and replace the value of `ALCHEMY_KEY = xxx` in `packages/react-app/src/constants.js`

### Deployments

Goerli: 
SwarmMaildeploying "SwarmMail" (tx: 0x981aeaf2ac802ac50fb2e562acf3a58b27c8618de348846fb26894079c259614)...: deployed at 0x4e713E4DdF939CABB6abe53D7783EB3c0AB6AFFc with 2171831 gas
deploying "DataHub" (tx: 0xcce53a7a69ef3a2e65160a66d9324fbf28b512b86b095696c339535f155c2158)...: deployed at 
0xBE41b272e3cDe3aeC8fE4a144C5b7cE71D9e6498 with 3727672 gas

### Access it
https://fairos.staging.fairdatasociety.org/public/3d70d86a08a9e6c92e826d16aaec3ee1fbfbcc34decbca977a66d8efb5476464/
