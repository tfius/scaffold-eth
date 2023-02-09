import { ethers } from "ethers";

export const PUBLIC_KEY_LENGTH = 132;
export const PUBLIC_KEY_PART_LENGTH = (PUBLIC_KEY_LENGTH - 4) / 2 + 2;
export const emptyHash = "0000000000000000000000000000000000000000000000000000000000000000";
export const oneHash = "0000000000000000000000000000000000000000000000000000000000000001";

export const stringToHex = s => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
export const hexToString = h => ethers.utils.toUtf8String(h);

export function joinPublicKey(x, y) {
  return "0x04" + x.substring(2) + y.substring(2);
}
export async function splitPublicKey(pk) {
  const x = "0x" + pk.substring(4, PUBLIC_KEY_PART_LENGTH + 2);
  const y = "0x" + pk.substring(PUBLIC_KEY_PART_LENGTH + 2, PUBLIC_KEY_LENGTH + 2);
  return { x, y };
}
