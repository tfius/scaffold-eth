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

export default function AllegianceMinter(props) {
  return (
    <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
      <p>
        Members can mint Allegiance. <br />
        You can choose <strong>ONLY 3</strong> so choose wisely. <br/>
        You will NOT receive any <strong>DM</strong>s. <br />
        Required to use billboard, crafting, marketplace, quests and exchange.
      </p>
    </div>
  );
}
