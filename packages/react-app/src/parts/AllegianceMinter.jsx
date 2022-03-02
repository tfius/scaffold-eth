import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import { SendOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useState } from "react";
import { Select, Button, Card, Col, Input, List, Menu, Row } from "antd";
//const { ethers } = require("ethers");
import { ethers } from "ethers";
import FText  from "../components/FText";

export default function AllegianceMinter(props) {
  return (
    <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
      <div>
        <FText>Members can mint Allegiance.</FText>
        <FText>You can choose <strong>&nbsp;ONLY 3&nbsp;</strong> so choose wisely. </FText>
        <FText>You will NOT receive any <strong>&nbsp;DMT</strong>s.</FText>
        <FText>Required to use billboard, crafting, marketplace, quests and exchange.</FText>
      </div>
    </div>
  );
}
