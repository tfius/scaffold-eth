import React, { useCallback, useEffect, useState } from "react";
import { Card, Spin, Tooltip } from "antd";
import { ethers } from "ethers";
import * as helpers from "./../helpers";
import AudioPlayer from "./../AudioPlayer";

export default function DMTToken(props) {
  const [loading, setLoading] = useState(true);
  const { contractAddress, tokenId, userSigner, onGotPost, orderIdx } = props;
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
        // console.log("DMTToken", tokenInfo, tokenUri);
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
            var data = {};
            data.post = json;
            data.tokenInfo = tokenInfo;
            data.uri = tokenUri;
            //setPost(json);
            if(onGotPost!=undefined) {
               onGotPost(orderIdx, data);
            }
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
          <div>
            <span
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
                      <div style={{ position: "relative", maxHeight: "50px", overflow: "hidden", fontSize: "0.5rem" }}>
                        {post.text}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* post.type==="Image" && */}
              {
                <img
                  src={tokenUri}
                  style={{ width: "10rem", height: "10rem", maxWidth: "100%", objectFit: "contain", top: 0 }}
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/1772/1772485.png";
                  }}
                ></img>
              }
            </span>

            <div style={{ textAlign: "center" }}>
                {post.type === "Audio" && <>🔉</>}
                {post.type === "Image" && <>🖼</>}
                {post.type === "Video" && <>📹</>}
                {/* {tokenId.toString()} */}
            </div>

            {/* <div style={{ position: "absolute", top: "115px", right: "0px", left: "0px", textAlign: "center" }}>
            <AudioPlayer url={tokenUri} fontSize="1rem" />
             </div>             */}
          </div>
        </>
      )}
    </div>
  );
}
