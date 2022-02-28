import React, { useCallback, useEffect, useState } from "react";
import { Card, Spin, Tooltip } from "antd";
import { ethers } from "ethers";
import * as helpers from "./../helpers";

export default function DMTToken(props) {
  const [loading, setLoading] = useState(true);
  const [ contract, setContract] = useState(true);
  const { contractAddress, tokenId, deployedContracts, userSigner } = props;
  const [tokenInfo, setTokenInfo] = useState(); 
  const [tokenUri, setTokenUri] = useState();

  const fromContractContract = useCallback(async () => {
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", deployedContracts);
    const contract = new ethers.Contract(contractAddress, contracts.DMCollection.abi, userSigner);

    if (contract != null) {
      try {
        var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
        var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
        console.log("DMTToken", tokenInfo, tokenUri);
        //console.log("DMTToken", tokenUri);
        setTokenInfo(tokenInfo);
        setTokenUri(tokenUri);
      } catch (e) {
        console.log(e);
      }
    }
  });

  useEffect(() => {
    getTokenData();
  }, []);
  useEffect(() => {}, [loading]);

  const getTokenData = useCallback(async e => {
    //console.log("fbx load", e);
    setLoading(true);
    //setLoading(false);
    fromContractContract();
    setLoading(false);
  });



  return (
    <div>
      {loading ? <Spin/> : <>
         <img
              src={tokenUri}
              style={{ width: "10rem", height: "10rem", maxWidth:"100%", objectFit:"contain", top: 0 }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/1772/1772485.png";  
              }}
         ></img>    
         <div style={{   textAlign:"center" }}> 
            {tokenId.toString()}
        </div>

      </>}


    </div>
  );
}
