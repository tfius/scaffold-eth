import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Select, Button, Card, Spin, Col, Input, List, Menu, Row, Progress, Tooltip, notification } from "antd";
import FText from "../../components/FText";
import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import * as helpers from "./../helpers";
import { uploadJsonToBee } from "./../SwarmUpload/BeeService";
import DMTToken from "./DMTToken";

// function TokenVoteView(props) {
//   const { index, token, onVote, canVote } = props;
//   return (
//     <Card size="large" hoverable>
//       <div style={{ display: "block", alignItems: "right" }}>
//         <div style={{ float: "left", textAlign: "center" }}>
//           <small>{index}.</small> &nbsp;&nbsp;&nbsp; <strong>{token.name}</strong> &nbsp;&nbsp;&nbsp; votes: {token.votes}
//         </div>

//         <div style={{ float: "right" }}>
//           {canVote ? (
//             <span style={{ /*textDecoration: "underline",*/ cursor: "pointer" }} onClick={e => onVote(token)}>
//               <FText>vote</FText>
//             </span>
//           ) : null}
//         </div>
//       </div>
//     </Card>
//   );
// }

export default function ExchangeView(props) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState(null);

  const [start, setStart] = useState(0);
  const [numOrders, setNumOrders] = useState();
  const [page, setPage] = useState(0);
  const [maxPages, setMaxPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [orders, setOrders] = useState([]);

  const [numCategories, setNumCategories] = useState();
  const [numCategoryOrders, setNumCategoryOrders] = useState();
  const [category, setCategory] = useState("0x0000000000000000000000000000000000000000000000000000000000000000");
  const [categories, setCategories] = useState();
  const [sellerOrders, setSellerOrders] = useState();

  /*  
  const [contract, setContract] = useState(null);
  const [tokenData, setTokenData] = useState({ name: "", links: [], parents: [], uri: "", posts: [] });
  const [avatarToken, setAvatarToken] = useState({ name: "", links: [], parents: [], uri: "", posts: [] });
  const [postText, setPostText] = useState("");
  const [canVote, setCanVote] = useState();

  //const [posts, setPosts] = useState([]);
  const [links, setLinks] = useState([]);
  const [parentLinks, setParentLinks] = useState([]);

  let { contractAddress, id } = useParams();*/

  const {
    yourDmBalance,
    dmCollections,
    localProvider,
    contractConfig,
    writeContracts,
    readContracts,
    userSigner,
    mainnetProvider,
    userProviderAndSigner,
    gasPrice,
    address,
    tx,
    title,
  } = props;

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 5000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => {
    getNumOrders();
    getYourOrdersCount();
    getCategoriesCount();
    //getOrders();
  }, []);

  useEffect(() => {
    getNumOrders();
  }, [seconds]);

  useEffect(() => {
    getOrders();
  }, [numOrders]);

  

  const getYourOrdersCount = useCallback(async () => {
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    var yourOrdersCount = await readContracts.ExchangeDM.numSellerOrders(address);
    console.log("YourOrdersCount", yourOrdersCount.toString());
    setSellerOrders(yourOrdersCount.toNumber());
  }, [readContracts, address]);

  const getCategoriesCount = useCallback(async () => {
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    var numCategories = await readContracts.ExchangeDM.numCategories();
    console.log("CategoriesCount", numCategories.toString());
    setNumCategories(numCategories.toNumber());

    var categoryOrdersCount = await readContracts.ExchangeDM.numCategoryOrders(category);
    console.log("CategoryOrders", categoryOrdersCount.toString());
    setNumCategoryOrders(categoryOrdersCount.toNumber());
  }, [readContracts, address]);

  const getNumOrders = useCallback(async () => {
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    var orderCount = await readContracts.ExchangeDM.numOrders();
    console.log("orderCount", orderCount);
    setNumOrders(orderCount.toNumber());
    setMaxPages(Math.ceil(orderCount.toNumber() / pageSize));
  });

  const getOrders = useCallback(async () => {
    console.log("getOrders", readContracts.ExchangeDM);
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    setIsLoading(true);
    var ordersList = [];
    for (var i = page * pageSize; i < (page + 1) * pageSize; i++) {
      try {
        const orderNE = await readContracts.ExchangeDM.orders(i);
        var order = Object.assign([], orderNE);
        // console.log("order", order);
        // this is debug only 
        var hashToOrder = await readContracts.ExchangeDM.hashToOrder(order.tokenHash);
        order.hashToOrder = hashToOrder;

        console.log("order", order);
        ordersList.push(order);
      } catch (error) {
        console.error(error);
        break;
      }
    }

    setOrders(ordersList);
    setIsLoading(false);
  }, [readContracts]);

  const nextPage = () => {
    if (page < maxPages - 1) {
      setPage(page + 1);
      getOrders();
    }
  };
  const prevPage = () => {
    if (page > 0) {
      setPage(page - 1);
      getOrders();
    }
  };

  const buy = useCallback(async order => {
    var metadata = {};
    //console.log("buy", order);
    metadata.value = order.askPrice;
    metadata.gasPrice = gasPrice;
    tx(writeContracts.ExchangeDM.buy(order.tokenHash, metadata));
  });

  //console.log("exchange", tokenData.posts);
  //tokenData.posts.map((d, i) => {console.log(d.text)});
  return (
    <div style={{ maxWidth: "70.5rem", margin: "auto", marginTop: 5, paddingBottom: 25, lineHeight: 1.5 }}>
      <h1>{title}</h1>
      <div style={{ position: "fixed", right: "3rem", top: "8rem", textAlign:"right" }}>
        <span style={{ cursor: "pointer" }} onClick={() => prevPage()}>
          ←
        </span>
        {page + 1}/{maxPages}
        <span style={{ cursor: "pointer" }} onClick={() => nextPage()}>
          →
        </span>
        <br/>
        <span>{orders.length}/{numOrders} offers</span>
        <br />
        <span>Yours: {sellerOrders}</span><br/>
        <span>Categories: {numCategories}</span><br/>


        {/* <span>{category}</span> */}
      </div>

      {isLoading ? <Spin /> : null}
      <List
        style={{ verticalAlign: "top" }}
        dataSource={orders}
        renderItem={(order, i) => {
          return (
            <List.Item key={i} style={{ maxWidth: "25%", minWidth: "200px", display: "inline-block", padding: "2px" }}>
              <Card key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div></div>
                </div>

                <DMTToken
                  key={"tok" + i}
                  contractAddress={order.nftCollection}
                  tokenId={order.tokenId}
                  deployedContracts={contractConfig.deployedContracts}
                  userSigner={userSigner}
                />
                <br />
                <Button
                  type="primary"
                  onClick={() => {
                    buy(order);
                  }}
                >
                  Buy
                </Button>

                {address == order.seller ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      tx(writeContracts.ExchangeDM.cancelOrder(order.tokenHash));
                    }}
                  >
                    Delist
                  </Button>
                ) : null}
                {/* <Card.Meta title={"Reviews in queue:"} description="" /> */}
              </Card>
            </List.Item>
          );
        }}
      />

      {orders.map((order, i) => {
        return (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <span>ID {order.tokenId.toString()}</span>
                <br />
                <span>Collection {order.nftCollection}</span>
                <br />
                <span>Seller {order.seller}</span>
                <br />
                <span>Price {order.askPrice.toString()}</span>
                <br />
                <span>Category {order.category}</span>
                <br />
                <span>hash {order.tokenHash}</span>
                <br />
                <span>ordIdx {order.categoryIndex.toString()}</span>
                <br />
                <span>catIdx {order.categoryIndex.toString()}</span>
                <br />
                <span>usrIdx {order.sellerIndex.toString()}</span>
                <br />

                <span>hToO {order.hashToOrder.toString()}</span>
                <br />
              </div>
            </div>
            {/* <Card.Meta title={"Reviews in queue:"} description="" /> */}
          </Card>
        );
      })}

      {/* <Card
        title={
          <>
            <h1 onClick={()=>{
                helpers.speak(avatarToken.name+"'s"+  tokenData.name);
            }}>
              {avatarToken.name}'s {tokenData.name}
            </h1>

            <div style={{ position: "absolute", right: "5px", top: "1px" }}>
              <Tooltip title="Click to vote.">
                <small onClick={()=>voteForToken(tokenData)}>▲{tokenData.numVotes}</small>
              </Tooltip>
            </div>
          </>
        }
      >
        <Input
          style={{ width: "80%" }}
          min={0}
          size="large"
          value={postText}
          placeholder={"What are you creating, " + avatarToken.name + " ?"}
          onChange={e => {
            try {
              setPostText(e.target.value);
            } catch (e) {
              console.log(e);
            }
          }}
        />
        <Button
          onClick={e => {
            addPostToToken();
          }}
        >
          Post
        </Button>
        <br />
      </Card>

      {tokenData.posts.map((d, i) => (
        <div className="">
          <div style={{ textAlign: "left" }}>
            <small>{d.avatarName}</small>
          </div>
          <div style={{ textAlign: "center" }}>{d.title}</div>
          <div
            className="ant-card-body"
            style={{ textAlign: "left", paddingLeft: "20px", paddingTop: "0px", paddingBottom: "0px" }}
          >
            {d.text}
          </div>
        </div>
      ))}
 */}
    </div>
  );
}
