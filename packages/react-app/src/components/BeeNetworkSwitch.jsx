import React from "react";
import { Button, Dropdown, Menu, Tooltip } from "antd";

function BeeNetworkSwitch({ networkOptions, selectedNetwork, setSelectedNetwork }) {
  const menu = (
    <Menu>
      {networkOptions
        .filter(i => i !== selectedNetwork)
        .map(i => (
          <Menu.Item key={i}>
            <a onClick={() => setSelectedNetwork(i)}>
              <span style={{ textTransform: "capitalize" }}>{i}</span>
            </a>
          </Menu.Item>
        ))}
    </Menu>
  );

  return (
    <Tooltip title="Select bee endpoint" placement="left">
      <Dropdown.Button overlay={menu} placement="bottomRight" trigger={["click"]}>
        <span style={{ textTransform: "capitalize" }}>{selectedNetwork}</span>
      </Dropdown.Button>
    </Tooltip>
  );
}

export default BeeNetworkSwitch;
