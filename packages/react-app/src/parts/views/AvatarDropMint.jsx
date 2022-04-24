import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import * as helpers from "./../helpers";
import * as tokens from "./tokenDrop"; 

/*
 Construct json like: 
   nftData = {
     description: "",
     "external_url": "",
     "image": "",
     "name": "",
     "attributes": [
       { 
         "trait_type": "BackgroundColor", 
         "value": "Some color" 
        },
     ]
   }
 */
const delay = ms => new Promise(res => setTimeout(res, ms));

export default function AvatarDropMint (props) {
  const history = useHistory();
  const [ receivers,setReceivers ] = useState([]);
  const { writeContracts, readContracts, tx } = props;
  async function drop(r,i) {
    try {
      tokens.tokenDrop[i].state = "X";  
      // tokenDrop[i].balance = (await readContracts.Avatar.balanceOf(tokenDrop[i].addr)).toString();
      //setReceivers(tokenDrop);

      //console.log(r.addr, r.hash);
      //const hasToken = await writeContracts.Avatar.ownerToToken(r.addr); 
      //console.log("has"+  r.addr, hasToken);
      //if(hasToken) { alert("hastoken"); return; }
        
      //return;
      tx(writeContracts.Avatar.create(r.addr, r.hash),
      update => {
            console.log("tx", update)
            if (update?.error?.toString()) {
               tokens.tokenDrop[i].status = update?.error?.toString();
               helpers.speak("FAIL");
            }
            if (update && (update.status === "confirmed" || update.status === 1)) {
               console.log(" 🍾 Transaction " + update);
               tokens.tokenDrop[i].status = "OK"; 
               helpers.speak("OK");
            }
         }, 
      );
       
    
    } catch (e) {
        console.error(e);
        tokens.tokenDrop[i].status = "ERROR";
    }
    setReceivers(tokens.tokenDrop);
    return 0;
  }
  /*
  function getNumTokens = (async () => {
    console.log("avatar contract", readContracts.Avatar);
    
    for (let i = 0; i < tokenDrop.length; i++) {
        try{
        tokenDrop[i].balance = (await readContracts.Avatar.balanceOf(tokenDrop[i].addr)).toString();
        await delay(1000);
        console.log(i, tokenDrop[i].balance);
        } catch(e) {
            console.error("getting balance", tokenDrop[i].addr, i);
        }
    }
  });*/
  
  const fetchAll = useCallback(async () => {
    // console.log("avatar contract", readContracts.Avatar);

    /* 
    for (let i = 0; i < tokenDrop.length; i++) {
        if(tokenDrop[i].addr.includes("Batch")) continue;

        try{
        tokenDrop[i].balance = (await readContracts.Avatar.balanceOf(tokenDrop[i].addr)).toString();
        await delay(100);
        console.log(i, tokenDrop[i].balance);
        } catch(e) {
            console.error("getting balance", tokenDrop[i].addr, i);
        }
    } */
  }, [readContracts]); 
  // console.log(receivers);
  async function getBalance(i) {
    try{
        if(tokens.tokenDrop[i].addr.includes("Batch")) return;

        tokens.tokenDrop[i].balance = (await readContracts.Avatar.balanceOf(tokens.tokenDrop[i].addr)).toString();
        console.log(i, tokens.tokenDrop[i].balance);
        setReceivers(tokens.tokenDrop);
    } catch(e) {
        console.error("getting balance", tokens.tokenDrop[i].addr, i);
    }
  }
  useEffect(() => {
    setReceivers(tokens.tokenDrop);
    fetchAll();
  }, []);
  useEffect(() => {
  }, [receivers]);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        marginTop: 16,
        paddingBottom: 16,
        alignItems: "left",
        textAlign: "left",
      }}>
      <h1>Avatar Drop</h1>      

      {receivers.map((p, i) => (
          <div
            style={{lineHeight:"1.5rem"}}
            key={"parent_" + i}
            
          >
            {i%6==0 && <br/>}

            <span onClick={e=>{ getBalance(i); }}>{i.toString()}</span>: <span onClick={e => {
                drop(p,i);
            }}><strong>{p.addr}</strong> {p.state} </span> <span>{p.balance}</span> <span style={{fontSize:"0.5rem", width:"100px", overflow:"hidden", textOverflow:"ellipsis"}}> {p.status} </span>
          </div>
        ))}

      <div>
      </div>
     </div>
  )
}

