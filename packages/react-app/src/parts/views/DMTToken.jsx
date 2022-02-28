import React, { useCallback, useEffect, useState } from "react";
import { Card, Spin, Tooltip } from "antd";
import { ethers } from "ethers";
import * as helpers from "./../helpers";

export default function DMTToken(props) {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(true);
  const { contractAddress, tokenId, deployedContracts, userSigner } = props;
  const [tokenInfo, setTokenInfo] = useState();
  const [tokenUri, setTokenUri] = useState();

  const [details, setDetails] = useState();
  const [post, setPost] = useState({ title: "", type: "", text: "", mimeType: "" });

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

        var json = { title: "", type: "", text: "", mimeType: "" };
        try {
          var token = JSON.parse(tokenInfo);
          if (token.m != 0x0000000000000000000000000000000000000000000000000000000000000000) {
            var url = helpers.downloadGateway + token.m.substring(2) + "/";
            json = await (await fetch(url)).json();
            console.log("gotPost", json);
            //setPost(json);
          }
        } catch (e) {}
        setPost(json);
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
      {loading ? (
        <Spin />
      ) : (
        <>
          <div
            hoverable
            onMouseEnter={e => {
              setDetails(true);
            }}
            onMouseLeave={e => {
              setDetails(false);
            }}
          >
            <div style={{ position: "relative", maxHeight: "250px" }}>
              {details && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      textAlign: "center",
                      top: "0px",
                      bottom: "0px",
                      left: "0px",
                      right: "0px",
                      background: "#000000bb",
                    }}
                  ></div>
                  <div style={{ position: "absolute", textAlign: "center", top: "1rem", width: "100%" }}>
                    <h3>{post.title}</h3>

                    <div style={{ position: "relative", maxHeight: "100px", overflow: "hidden" }}>{post.type}</div>
                    <div style={{ position: "relative", maxHeight: "50px", overflow: "hidden", fontSize:"0.5rem" }}>{post.text}</div>
                    
                  </div>
                </>
              )}
            </div>
            <img
              src={tokenUri}
              style={{ width: "10rem", height: "10rem", maxWidth: "100%", objectFit: "contain", top: 0 }}
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/1772/1772485.png";
              }}
            ></img>
            <div style={{ textAlign: "center" }}>{tokenId.toString()}</div>
          </div>
        </>
      )}
    </div>
  );
}
