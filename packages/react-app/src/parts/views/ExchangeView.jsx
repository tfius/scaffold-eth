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
  const [numCategoryOrders, setNumCategoryOrders] = useState(); //0
  const [category, setCategory] = useState(); // "0x0000000000000000000000000000000000000000000000000000000000000000"
  const [categories, setCategories] = useState([]);
  const [sellerOrders, setSellerOrders] = useState();

  const [categoryNames, setCategoryNames] = useState([]);
  const [categoryBytes, setCategoryBytes] = useState([]);

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
    getCategories();
    getYourOrdersCount();
  }, []);

  useEffect(() => {
    getAllCategoryOrders();
     getNumOrders();
  }, [seconds]);

  useEffect(() => {
    getOrders();
  }, [numOrders]);
  
  // useEffect(() => {
  //   //    getOrders();
  // }, [numOrders, categories, category, page, pageSize]);

  // useEffect(() => {
  //   //console.log("getting getCategoriesOrdersCount")
  //   //getCategoriesOrdersCount();
  // }, [category]);

  /*
  useEffect(() => {
    getCategoriesOrders();
  }, [category]); */
  useEffect(() => {
    //getCategoriesOrders();
    //getCategoryOrdersCount();
    getCategoryOrders(category);
  }, [category]); 

  const getCategories = useCallback(async () => {
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    var catNames = ["Sellable", "Listed"];
    var cats = [];
    for (var i = 0; i < catNames.length; i++) {
      var catBytes32 = await readContracts.ExchangeDM.bytes32ForCategoryName(catNames[i]);
      cats.push({ name: catNames[i], bytes32: catBytes32 });
    }

    setCategories(cats);
    setCategory(cats[0].bytes32);
    console.log("known categories ", cats);

    var numCategories = await readContracts.ExchangeDM.numCategories();
    console.log("CategoriesCount", numCategories.toString());
    setNumCategories(numCategories.toNumber());
  }, [readContracts, category, numCategories]);

  // const getCategoriesCount = useCallback(async () => {
  //    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
  //    var numCategories = await readContracts.ExchangeDM.numCategories();
  //    console.log("CategoriesCount", numCategories.toString());
  //    setNumCategories(numCategories.toNumber());
  //  });

  // const getCategoryOrdersCount = async () => {
  //   if (readContracts == undefined || readContracts.ExchangeDM == undefined || category==undefined) return;
  //   var categoryOrdersCount = await readContracts.ExchangeDM.numCategoryOrders(category);
  //   console.log("numCategoryOrders", categoryOrdersCount.toString());
  //   setNumCategoryOrders(categoryOrdersCount.toNumber());
  // };

  const getAllCategoryOrders = useCallback(async () => {
    for(var i = 0; i < categories.length; i++) {
       await getCategoryOrders(categories[i].name, categories[i].bytes32);
    }
  });

  const getCategoryOrders = useCallback(async (catName, categoryBytes32) => {
    //console.log("getCategoryOrders", catName);
    if (readContracts == undefined || readContracts.ExchangeDM == undefined || categoryBytes32 == undefined) return;
    
//    setIsLoading(true);
    var categoryOrdersCount = await readContracts.ExchangeDM.numCategoryOrders(categoryBytes32);
    //console.log("numCategoryOrders", categoryOrdersCount.toString());
    setNumCategoryOrders(categoryOrdersCount.toNumber());

    var maxCatOrders = categoryOrdersCount.toNumber();
    var ordersIndexList = [];
    for (var i = 0; i < maxCatOrders; i++) {
      try {
        //console.log("categoryOrders", categoryBytes32, i);
        const orderIndex = await readContracts.ExchangeDM.categoryOrders(categoryBytes32, i);
        //console.log("gotOrderIndex", i, orderIndex.toString());
        ordersIndexList.push(orderIndex.toNumber());
      } catch (error) {
        console.error(error);
        //break;
      }
    }
    console.log("cat " + catName, ordersIndexList);
    /*  
    var ordersList = [];
    for (var i = 0; i < ordersIndexList.length; i++) {
      const order = await getOrder(ordersIndexList[i]);
      if (order != null) ordersList.push(order);
    }
    setOrders(ordersList); */ 
//    setIsLoading(false); 
  });

  const getOrder = async orderIndex => {
    try {
      const orderNE = await readContracts.ExchangeDM.orders(orderIndex);
      var order = Object.assign([], orderNE);
      var hashToOrder = await readContracts.ExchangeDM.hashToOrder(order.tokenHash);
      order.hashToOrder = hashToOrder;
      console.log("order", order);
      return order;
    } catch (error) {
      return null;
    }
  };

  const getYourOrdersCount = useCallback(async () => {
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    var yourOrdersCount = await readContracts.ExchangeDM.numSellerOrders(address);
    console.log("YourOrdersCount", yourOrdersCount.toString());
    setSellerOrders(yourOrdersCount.toNumber());
  });

  const getNumOrders = useCallback(async () => {
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    var orderCount = await readContracts.ExchangeDM.numOrders();
    //console.log("NumOrders", orderCount.toString());
    setNumOrders(orderCount.toNumber());
    setMaxPages(Math.ceil(orderCount.toNumber() / pageSize));
  }, [readContracts, page, pageSize]);

  const getOrders = useCallback(async () => {
    console.log("getOrders", readContracts.ExchangeDM);
    if (readContracts == undefined || readContracts.ExchangeDM == undefined) return;
    setIsLoading(true);
    var ordersList = [];
    for (var i = page * pageSize; i < (page + 1) * pageSize && i <= numOrders; i++) {
      try {
        const orderNE = await readContracts.ExchangeDM.orders(i);
        var order = Object.assign([], orderNE);
        //console.log("order", order);

        var hashToOrder = await readContracts.ExchangeDM.hashToOrder(order.tokenHash);
        order.hashToOrder = hashToOrder;
        //console.log("order", order);

        ordersList.push(order);
      } catch (error) {
        console.error(error);
        break;
      }
    }
    setOrders(ordersList);
    setIsLoading(false);
  }, [readContracts, page, pageSize, categoryNames, numOrders]);

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
  const onCategoryChange = async cat => {
    console.log("onCategoryChange", cat);
    setCategory(cat.bytes32.toString());
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
    <div style={{ maxWidth: 800, margin: "auto", marginTop: 5, paddingBottom: 25, lineHeight: 1.5 }}>
      <h1>{title}</h1>
      {isLoading ? <Spin /> : null}
      <List
        style={{ verticalAlign: "top" }}
        dataSource={orders.filter(order => order.category == category)}
        renderItem={(order, i) => {
          return (
            <List.Item key={i} style={{ maxWidth: "25%", minWidth: "200px", display: "inline-block", padding: "2px" }}>
              <Card key={i} className={order.sellable ? "card-second" : ""}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span>o {order.orderIndex.toString()} </span>
                  <span>c {order.categoryIndex.toString()} </span>
                  <span>s {order.sellerIndex.toString()} </span>
                </div>

                <DMTToken
                  key={"tok" + i}
                  contractAddress={order.nftCollection}
                  tokenId={order.tokenId}
                  deployedContracts={contractConfig.deployedContracts}
                  userSigner={userSigner}
                />
                <br />
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

                {order.sellable && address != order.seller ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      buy(order);
                    }}
                  >
                    Buy
                  </Button>
                ) : null}
                {address == order.seller ? (
                  <Tooltip title="You are owner">
                    <span>*</span>
                  </Tooltip>
                ) : null}
                {/* <Card.Meta title={"Reviews in queue:"} description="" /> */}
              </Card>
            </List.Item>
          );
        }}
      />
      <div style={{ position: "fixed", right: "3rem", top: "8rem", textAlign: "right", zIndex: 10 }}>
        <span style={{ cursor: "pointer" }} onClick={() => prevPage()}>
          ←
        </span>
        {page + 1}/{maxPages}
        <span style={{ cursor: "pointer" }} onClick={() => nextPage()}>
          →
        </span>
        <br />
        <span>
          {orders.length}/{numOrders} offers
        </span>
        <br />
        <span>Yours: {sellerOrders}</span>
        <br />
        <span>Categories: {numCategories}</span>
        <br />
        {categories.map((cat, i) => {
          return (
            <>
              <div key={i} style={{ cursor: "pointer" }} onClick={() => onCategoryChange(cat)}>
                <strong>{cat.name}</strong>
              </div>
            </>
          );
        })}
        {/* <span>{category}</span> */}
      </div>
      <div style={{ marginTop: "10rem" }}>  
        {orders.map((order, i) => {
          return (
            <Card key={i}>
              <div style={{ marginBottom: 0 }}>
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
                  <span>ordIdx {order.orderIndex.toString()} </span>
                  <span>catIdx {order.categoryIndex.toString()} </span>
                  <span>selIdx {order.sellerIndex.toString()} </span>
                  <br />
                  <span>Sell {order.sellable.toString()}</span>
                  <br />
                  <span>hash {order.tokenHash}</span>
                  <br />                  
                </div>
              </div>
              {/* <Card.Meta title={"Reviews in queue:"} description="" /> */}
            </Card>
          );
        })}
      </div>

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
