// helper functions to parts
export const downloadGateway = "https://fairos-mainnet.fairdatasociety.org/bzz/"; 
export const uploadGateway   = "https://fairdrive-mainnet.fairdatasociety.org/proxy/"; //https://gw-testnet.fairdatasociety.org/proxy";


export const makeCall = async (callName, contract, args, metadata = {}) => {
  try {
    if (contract[callName]) {
      let result;
      if (args) {
        result = await contract[callName](...args, metadata);
      } else {
        result = await contract[callName]();
      }
      return result;
    }
  } catch (e) {
    console.log("makeCall", callName, contract, args, metadata, e); 
  }
  return undefined;
  console.log("no call of that name!");
};

// deep find
export function findPropertyInObject(propertyName, object) {
  if (object === undefined) return null;
  if (object.hasOwnProperty(propertyName)) return object[propertyName];

  for (var i = 0; i < Object.keys(object).length; i++) {
    if (typeof object[Object.keys(object)[i]] == "object") {
      var o = findPropertyInObject(propertyName, object[Object.keys(object)[i]]);
      if (o != null) return o;
    }
  }
  return null;
}

export function randomString(length) {
  var result = "";
  var characters = "abcdef0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
