import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import Blockies from "react-blockies";
import { ethers } from "ethers";
import {
  Button,
  List,
  Card,
  Descriptions,
  Divider,
  Drawer,
  InputNumber,
  Modal,
  notification,
  Row,
  Col,
  Select,
  Space,
  Tooltip,
  Typography,
  Input,
  Form,
  Badge,
} from "antd";

const { Meta } = Card;
const { Text } = Typography;

import { RequestsReviewList, RequestsReviewFinalizeList } from "./";

const contractName = "COPRequestReviewRegistry";
const tabList = [
  {
    key: "reviews",
    tab: "Review Requests",
  },
  {
    key: "finalizations",
    tab: "Finalizations",
  },
  {
    key: "administration",
    tab: "Administration",
  },
  {
    key: "approved",
    tab: "Approved",
  },
  {
    key: "norights",
    tab: "Insufficient privileges",
  },
];

function ViewUserRoles({
  readContracts,
  address,
  role_finalizer,
  role_reviewer,
  role_admin,
  onRolesGathered,
  reviewRequestCount,
  finalizationsCount,
  tabChange,
  activeTabKey,
}) {
  const isFinalizer = useContractReader(readContracts, contractName, "hasRole", [role_finalizer, address]);
  const isReviewer = useContractReader(readContracts, contractName, "hasRole", [role_reviewer, address]);
  const isAdmin = useContractReader(readContracts, contractName, "hasRole", [role_admin, address]);

  const [tabListing, setTabListing] = useState([]);
  const [tabKey, setTabKey] = useState("");

  useEffect(() => {
    if (isFinalizer != undefined && isReviewer != undefined && isAdmin != undefined) {
      console.log("finalizer", isFinalizer, "reviewer", isReviewer, "admin", isAdmin);
      onRolesGathered(isReviewer, isFinalizer, isAdmin);

      var list = [];
      if (isReviewer)
        list.push({
          key: tabList[0].key,
          tab: (
            <Badge count={reviewRequestCount} offset={[12, 0]}>
              Reviews Pending
            </Badge>
          ),
        });
      if (isFinalizer)
        list.push({
          key: tabList[1].key,
          tab: (
            <Badge count={finalizationsCount} offset={[12, 0]}>
              Finalizations Waiting
            </Badge>
          ),
        });
      if (isAdmin)
        list.push({
          key: tabList[2].key,
          tab: (
            <Badge count={0} offset={[12, 0]}>
              Administration
            </Badge>
          ),
        });
      if (isAdmin)
        list.push({
          key: tabList[3].key,
          tab: (
            <Badge count={0} offset={[12, 0]}>
              Approved
            </Badge>
          ),
        });

      if (isFinalizer == false && isReviewer == false && isAdmin == false) {
        list.push({
          key: tabList[4].key,
          tab: (
            <Badge count={0} offset={[12, 0]}>
              Insufficient privileges
            </Badge>
          ),
        });
        tabChange(tabList[4].key);
        setTabKey(tabList[4].key);
        console.log("noprivileges", tabList[4].key);
      }

      setTabListing(list);
    }
  }, [isFinalizer, isReviewer, isAdmin, activeTabKey]);

  useEffect(() => {}, [tabListing, tabKey]);

  const contentList = {
    reviews: <>{isReviewer ? <>{reviewRequestCount} Review Request(s) waiting</> : "No"}</>,
    finalizations: <>{isFinalizer ? <>{finalizationsCount} Finalization Review(s) waiting</> : "No"}</>,
    administration: <>{isAdmin ? "Yes" : "No"}</>,
  };

  console.log("activeKey", tabKey);
  return (
    <Card
      tabList={tabListing}
      onTabChange={key => {
        tabChange(key);
        setTabKey(key);
      }}
    >
      <Card.Meta title={contentList[tabKey]} />
      {/* <Card.Meta title="Assigned roles" description="Depending on your roles you can influence application request review status"/> */}
    </Card>
  );
}

function RequestsReview({ writeContracts, readContracts, address, tx, localProvider }) {
  const [reviewsRequestList, setReviewsRequestList] = useState([]);
  const [finalizationList, setFinalizationList] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState("reviews");
  const [isLoading, setIsLoading] = useState(false);

  const [contents, setContents] = useState([]);

  const [viewRoles, setViewRoles] = useState(null); // component to init
  const [userRoles, setUserRoles] = useState([false, false, false]); // component to init

  const [isReviewer, setIsReviewer] = useState(false);
  const [isFinalizer, setIsFinalizer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [viewAddress, setViewAddress] = useState();

  const isReviewed = useContractReader(readContracts, contractName, "isAddressReviewed", [address]);
  const isInReview = useContractReader(readContracts, contractName, "isInReview", [address]);
  const isFinalized = useContractReader(readContracts, contractName, "isInFinalization", [address]);

  const reviewRequestCount = useContractReader(readContracts, contractName, "getReviewRequestsCount");
  const reviewRequests = useContractReader(readContracts, contractName, "getReviewRequests");

  const finalizationsCount = useContractReader(readContracts, contractName, "getFinalizationCount");
  const finalizations = useContractReader(readContracts, contractName, "getFinalizations");

  // get roles
  const role_finalizer = useContractReader(readContracts, contractName, "ROLE_FINALIZER");
  const role_reviewer = useContractReader(readContracts, contractName, "ROLE_REVIEWER");
  const role_admin = useContractReader(readContracts, contractName, "DEFAULT_ADMIN_ROLE");
  // get users address roles

  const requestEvents = useEventListener(readContracts, contractName, "RequestReview", localProvider, 1);
  const reviewEvents = useEventListener(readContracts, contractName, "ApproveReview", localProvider, 1);
  const rejectEvents = useEventListener(readContracts, contractName, "RejectReview", localProvider, 1);
  const completeEvents = useEventListener(readContracts, contractName, "CompletedReview", localProvider, 1);

  //console.log("Address", address, "reviewCount", reviewCount);

  const updateRequestReviews = useCallback(async () => {
    if (reviewRequests == undefined) return; //console.log("reviewRequests", reviewRequests);
    var data = [];

    for (var i = 0; i < reviewRequests.length; i++) {
      var d = await readContracts.COPRequestReviewRegistry.getReviewRequest(reviewRequests[i]);
      data.push(d);
    }
    setReviewsRequestList(data);
    console.log("ReviewRequest List", data);
  });

  const updateFinalizations = useCallback(async () => {
    if (finalizations == undefined) return; //console.log("finalizations", finalizations);
    var data = [];

    for (var i = 0; i < finalizations.length; i++) {
      var d = await readContracts.COPRequestReviewRegistry.getReviewRequest(finalizations[i]);
      data.push(d); //console.log("ReviewRequest", i, d);
    }
    setFinalizationList(data);
    console.log("Finalizations List", data);
  });

  const onGotUserRoles = useCallback(async (isReviewer, isFinalizer, isAdmin) => {
    setIsAdmin(isAdmin);
    setIsReviewer(isReviewer);
    setIsFinalizer(isFinalizer);
  });

  useEffect(() => {
    if (role_admin && role_finalizer && role_reviewer) {
      //console.log("role hashes", "finalizer", role_finalizer, "reviewer", role_reviewer, "admin", role_admin);
      setViewRoles(
        <ViewUserRoles
          readContracts={readContracts}
          address={address}
          role_finalizer={role_finalizer}
          role_admin={role_admin}
          role_reviewer={role_reviewer}
          onRolesGathered={onGotUserRoles}
          reviewRequestCount={reviewRequestCount != undefined ? reviewRequestCount.toNumber() : 0}
          finalizationsCount={finalizationsCount != undefined ? finalizationsCount.toNumber() : 0}
          tabChange={onTabChange}
          activeTabKey={activeTabKey}
        />,
      );
    }
  }, [role_finalizer, role_reviewer, role_admin]);

  useEffect(() => {
    updateRequestReviews();
    updateFinalizations();
  }, []);

  useEffect(() => {}, [address]);

  useEffect(() => {
    updateRequestReviews();
  }, [reviewRequests]);

  useEffect(() => {
    updateFinalizations();
  }, [finalizations]);

  useEffect(() => {}, [reviewsRequestList, finalizationList]);
  useEffect(() => {}, [userRoles]);
  useEffect(() => {}, [isAdmin, isReviewer, isFinalizer, activeTabKey]);

  if (address == undefined || reviewRequestCount == undefined) return <h2>Connecting...</h2>;

  const onTabChange = key => {
    setActiveTabKey(key);
    //console.log(key)
    setContents({
      reviews: (
        <RequestsReviewList items={reviewsRequestList} onApprove={onApprove} onReject={onReject} address={address} />
      ),
      finalizations: (
        <RequestsReviewFinalizeList
          items={finalizationList}
          onApprove={onFinalize}
          onRejectFinalize={onRejectFinalize}
          address={address}
        />
      ),
      administration: <p>Administration content</p>,
      approved: <>Approved</>,
    });
  };

  const onApprove = async (item, i, hash) => {
    console.log("Sending approve", item.candidate);

    var rr = reviewsRequestList;
    rr = rr.slice(i, 1);
    setReviewsRequestList(rr);

    await tx(
      writeContracts.COPRequestReviewRegistry.approveReview(
        item.candidate,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
      ),
    );
  };
  const onReject = async (item, i, hash) => {
    console.log("Sending reject", item.candidate);

    await tx(
      writeContracts.COPRequestReviewRegistry.rejectReview(
        item.candidate,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
      ),
    );
  };
  const onFinalize = async (item, i, hash) => {
    console.log("Sending complete", item.candidate);

    await tx(
      writeContracts.COPRequestReviewRegistry.finalizeReview(
        item.candidate,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
      ),
    );
  };
  const onRejectFinalize = async (item, i, hash) => {
    console.log("Sending reject", item.candidate);

    await tx(
      writeContracts.COPRequestReviewRegistry.rejectFinalization(
        item.candidate,
        "0x" + hash, //"0x0000000000000000000000000000000000000000000000000000000000000000",
      ),
    );
  };
  /* var contents1 = {
    reviews: <RequestsReviewList items={reviewsRequestList} onApprove={onApprove} onReject={onReject} />,
    finalization: (
      <RequestsReviewFinalizeList items={finalizationList} onFinalize={onFinalize} onReject={onRejectFinalize} />
    ),
    administration: <p>Administration content</p>,
    approved: <>Approved</>,
  };*/

  return (
    <div style={{ margin: "auto", width: "90vw" }}>
      <Row gutter={16} type="flex">
        <Col span={24}>{viewRoles}</Col>

        {isLoading ? <Spin /> : null}

        {/* <Col span={24}>{contents[activeTabKey]} </Col> */}

        <Col span={12}>
          <h2>Pending Reviews</h2>
          {isReviewer == true ? (
            <RequestsReviewList
              items={reviewsRequestList}
              onApprove={onApprove}
              onReject={onReject}
              address={address}
            />
          ) : null}
        </Col>

        <Col span={12}>
          <h2>Pending Finalizations</h2>
          {isFinalizer == true ? (
            <RequestsReviewFinalizeList
              items={finalizationList}
              onFinalize={onFinalize}
              onRejectFinalize={onRejectFinalize}
              address={address}
            />
          ) : null}
        </Col>
      </Row>
    </div>
  );
}

export default RequestsReview;
