// helper functions to parts
// MAINNET 

// export const downloadGateway = "https://fairos-mainnet.fairdatasociety.org/bzz/"; 
// export const uploadGateway   = "https://fairdrive-mainnet.fairdatasociety.org/proxy/"; 

// mainnet 
// export const downloadGateway = "https://gateway.fairdatasociety.org/bzz/"; 
// export const uploadGateway   = "https://gateway.fairdatasociety.org/proxy"; 
// testnet 
export const downloadGateway = "https://gw-testnet.fairdatasociety.org/bzz/"; 
export const uploadGateway   = "https://gw-testnet.fairdatasociety.org/proxy"; 
// https://gw-testnet.fairdatasociety.org/proxy/health
// https://gw-testnet.fairdatasociety.org/proxy/readiness 
// https://gw-testnet.fairdatasociety.org/access/e75defedaf98ff89100ae0b514237b871939aee2553e6a108f618d7ffe9e42a6
// e75defedaf98ff89100ae0b514237b871939aee2553e6a108f618d7ffe9e42a6
// get data from https://gw-testnet.fairdatasociety.org/bzz/109dfe7be464b749bd2d29db0f1ba2b3229973c1b9b3b5fffed289766c4a88ae/

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
