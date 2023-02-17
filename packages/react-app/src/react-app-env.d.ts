/// <reference types="react-scripts" />
interface Window {
  go?: any
  connect (beeEndpoint: string, stampId: string, rpc: string, network: string): Promise<string>
  stop (): void
  login (username: string, password: string): Promise<user>
  userPresent (username: string): Promise<present>
  userIsLoggedIn (username: string): Promise<loggedin>
  userLogout (sessionId: string): Promise<string>
  userDelete (sessionId: string, password: string): Promise<string>
  userStat (sessionId: string): Promise<userStat>
  podNew (sessionId: string, podName: string): Promise<string>
  podOpen (sessionId: string, podName: string): Promise<string>
  podClose (sessionId: string, podName: string): Promise<string>
  podSync (sessionId: string, podName: string): Promise<string>
  podDelete (sessionId: string, podName: string): Promise<string>
  podList (sessionId: string): Promise<podList>
  podStat (sessionId: string, podName: string): Promise<podStat>
  podShare (sessionId: string, podName: string, shareAs: string): Promise<podShare>
  podReceive (sessionId: string, podName: string, podSharingReference: string): Promise<string>
  podReceiveInfo (sessionId: string, podSharingReference: string): Promise<podShareInfo>
  dirPresent (sessionId: string, podName: string, dirPath: string): Promise<present>
  dirMake (sessionId: string, podName: string, dirPath: string): Promise<string>
  dirRemove (sessionId: string, podName: string, dirPath: string): Promise<string>
  dirList (sessionId: string, podName: string, dirPath: string): Promise<dirList>
  dirStat (sessionId: string, podName: string, dirPath: string): Promise<dirList>
  fileDownload (sessionId: string, podName: string, filePath: string): Promise<Uint8Array>
  fileUpload (sessionId: string, podName: string, dirPath: string, content: Uint8Array, fileName: string, size: number, blockSize: string, compression: string): Promise<string>
  fileShare (sessionId: string, podName: string, dirPath: string, destinationUser: string): Promise<fileShare>
  fileReceive (sessionId: string, podName: string, dirPath: string, fileSharingReference: string): Promise<fileReceive>
  fileReceiveInfo (sessionId: string, fileSharingReference: string): Promise<fileShareInfo>
  fileDelete (sessionId: string, podName: string, filePath: string): Promise<string>
  fileStat (sessionId: string, podName: string, filePath: string): Promise<fileStat>
}

interface user {
  user: string
  sessionId: string
}

interface present {
  present: boolean
}

interface loggedin {
  loggedin: boolean
}

interface userStat {
  userName: string
  address: string
}

interface podList {
  pods: string[]
  sharedPods: string[]
}

interface podStat {
  podName: string
  podAddress: string
}

interface podShare {
  podSharingReference: string
}

interface fileShare {
  fileSharingReference: string
}

interface fileReceive {
  fileName: string
}

interface podShareInfo {
  podName: string
  podAddress: string
  password: string
  userAddress: string
}

interface fileShareInfo {
  name: string
  size: string
  blockSize: string
  numberOfBlocks: string
  contentType: string
  compression: string
  sourceAddress: string
  destAddress: string
  sharedTime: string
}

interface dirList {
  files: string[]
  dirs: string[]
}

interface dirStat {
  podName: string
  dirPath: string
  dirName: string
  mode: string
  creationTime: string
  modificationTime: string
  accessTime: string
  noOfDirectories: string
  noOfFiles: string
}

interface fileStat {
  podName: string
  mode: string
  filePath: string
  fileName: string
  fileSize: string
  blockSize: string
  compression: string
  contentType: string
  creationTime: string
  modificationTime: string
  accessTime: string
  blocks: block[]
}

interface block {
  reference: string
  size: string
  compressedSize: string
}