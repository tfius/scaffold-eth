/// <reference types="react-scripts" />
interface Window {
  go?: Go;
  ethereum: any;
  web3: any;
  connect(
    beeEndpoint: string,
    stampId: string,
    rpc: string,
    network: string,
    subRpc: string,
    subAddr: string,
  ): Promise<string>;
  stop(): void;
  login(username: string, password: string): Promise<user>;
  connectWallet(username: string, password: string, walletAddress: string, signature: string): Promise<string>;
  walletLogin(addressHex: string, signature: string): Promise<user>;
  userPresent(username: string): Promise<present>;
  userIsLoggedIn(username: string): Promise<loggedin>;
  userLogout(sessionId: string): Promise<string>;
  userDelete(sessionId: string, password: string): Promise<string>;
  userStat(sessionId: string): Promise<userStat>;
  getNameHash(sessionId: string, username: string): Promise<namehash>;
  podNew(sessionId: string, podName: string): Promise<string>;
  podOpen(sessionId: string, podName: string): Promise<string>;
  podClose(sessionId: string, podName: string): Promise<string>;
  podSync(sessionId: string, podName: string): Promise<string>;
  podDelete(sessionId: string, podName: string): Promise<string>;
  podList(sessionId: string): Promise<podList>;
  podStat(sessionId: string, podName: string): Promise<podStat>;
  podShare(sessionId: string, podName: string, shareAs: string): Promise<podShare>;
  podReceive(sessionId: string, podName: string, podSharingReference: string): Promise<string>;
  podReceiveInfo(sessionId: string, podSharingReference: string): Promise<podShareInfo>;
  dirPresent(sessionId: string, podName: string, dirPath: string): Promise<present>;
  dirMake(sessionId: string, podName: string, dirPath: string): Promise<string>;
  dirRemove(sessionId: string, podName: string, dirPath: string): Promise<string>;
  dirList(sessionId: string, podName: string, dirPath: string): Promise<dirList>;
  dirStat(sessionId: string, podName: string, dirPath: string): Promise<dirList>;
  fileDownload(sessionId: string, podName: string, filePath: string): Promise<Uint8Array>;
  fileUpload(
    sessionId: string,
    podName: string,
    dirPath: string,
    content: Uint8Array,
    fileName: string,
    size: number,
    blockSize: string,
    compression: string,
  ): Promise<string>;
  fileShare(sessionId: string, podName: string, dirPath: string, destinationUser: string): Promise<fileShare>;
  fileReceive(sessionId: string, podName: string, dirPath: string, fileSharingReference: string): Promise<fileReceive>;
  fileReceiveInfo(sessionId: string, fileSharingReference: string): Promise<fileShareInfo>;
  fileDelete(sessionId: string, podName: string, filePath: string): Promise<string>;
  fileStat(sessionId: string, podName: string, filePath: string): Promise<fileStat>;

  encryptSubscription(sessionId: string, podName: string, subscriberNameHash: string): Promise<reference>;
  getSubscriptions(sessionId: string): Promise<subscriptions>;
  openSubscribedPod(sessionId: string, subHashStr: string): Promise<string>;
  openSubscribedPodFromReference(sessionId: string, reference: string, sellerNameHash: string): Promise<string>;
  getSubscribablePods(sessionId: string): Promise<subscribablePods>;
  getSubRequests(sessionId: string): Promise<subRequests>;
  getSubscribablePodInfo(sessionId: string): Promise<subInfo>;

  kvNewStore(sessionId: string, podName: string, tableName: string, indexType: string): Promise<string>;
  kvList(sessionId: string, podName: string): Promise<list>;
  kvOpen(sessionId: string, podName: string, tableName: string): Promise<string>;
  kvDelete(sessionId: string, podName: string, tableName: string): Promise<string>;
  kvCount(sessionId: string, podName: string, tableName: string): Promise<tableCount>;
  kvEntryPut(sessionId: string, podName: string, tableName: string, key: string, value: string): Promise<string>;
  kvEntryGet(sessionId: string, podName: string, tableName: string, key: string): Promise<kvResponse>;
  kvEntryDelete(sessionId: string, podName: string, tableName: string, key: string): Promise<string>;
  kvSeek(
    sessionId: string,
    podName: string,
    tableName: string,
    start: string,
    end: string,
    limit: number,
  ): Promise<string>;
  kvSeekNext(sessionId: string, podName: string, tableName: string): Promise<kvResponse>;
}

interface user {
  user: string;
  nameHash: string;
  sessionId: string;
}

interface present {
  present: boolean;
}

interface loggedin {
  loggedin: boolean;
}

interface userStat {
  userName: string;
  address: string;
}

interface namehash {
  namehash: string;
}

interface reference {
  reference: string;
}

interface list {
  list: string[];
}

interface podList {
  pods: string[];
  sharedPods: string[];
}

interface podStat {
  podName: string;
  podAddress: string;
}

interface podShare {
  podSharingReference: string;
}

interface fileShare {
  fileSharingReference: string;
}

interface fileReceive {
  fileName: string;
}

interface podShareInfo {
  podName: string;
  podAddress: string;
  password: string;
  userAddress: string;
}

interface fileShareInfo {
  name: string;
  size: string;
  blockSize: string;
  numberOfBlocks: string;
  contentType: string;
  compression: string;
  sourceAddress: string;
  destAddress: string;
  sharedTime: string;
}

interface listItem {
  name: string;
  size: string;
  blockSize: string;
  contentType: string;
  creationTime: string;
  modificationTime: string;
  accessTime: string;
  mode: string;
}

interface dirList {
  files: listItem[];
  dirs: listItem[];
}

interface dirStat {
  podName: string;
  dirPath: string;
  dirName: string;
  mode: string;
  creationTime: string;
  modificationTime: string;
  accessTime: string;
  noOfDirectories: string;
  noOfFiles: string;
}

interface fileStat {
  podName: string;
  mode: string;
  filePath: string;
  fileName: string;
  fileSize: string;
  blockSize: string;
  compression: string;
  contentType: string;
  creationTime: string;
  modificationTime: string;
  accessTime: string;
  blocks: block[];
}

interface block {
  reference: string;
  size: string;
  compressedSize: string;
}

interface subInfo {
  category: string;
  description: string;
  fdpSellerNameHash: string;
  imageUrl: string;
  podAddress: string;
  podName: string;
  price: string;
  title: string;
}

interface subRequest {
  subHash: string;
  buyerNameHash: string;
  buyer: string;
  requestHash: string;
}

interface subRequests {
  requests: subRequest[];
}

interface subscribablePod {
  subHash: string;
  sellerNameHash: string;
  seller: string;
  swarmLocation: string;
  price: number;
  active: boolean;
  earned: number;
  bids: number;
  sells: number;
  reports: number;
}

interface subscribablePods {
  subscribablePods: subscribablePod[];
}

interface subscription {
  podName: string;
  subHash: string;
  podAddress: string;
  validTill: number;
  infoLocation: string;
}

interface subscriptions {
  subscriptions: subscription[];
}

interface tableCount {
  tableName: string;
  count: number;
}

interface kvResponse {
  key: string;
  value: string;
}
