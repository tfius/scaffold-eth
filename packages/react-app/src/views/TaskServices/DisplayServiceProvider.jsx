import React, { useState } from "react";
import { List } from "antd";

export function DisplayServiceProvider({ serviceProvider, onSetSelectedService }) {
  const [seeDetail, setSeeDetail] = useState(false);
  return (
    <div>
      <h3>{serviceProvider.name}</h3>
      <img
        style={{ width: "128px", height: "128px", marginRight: "0ox", position: "absolute", top: "5px", left: "60%" }}
        src={serviceProvider.logo}
        alt={serviceProvider.name}
      />
      <p>{serviceProvider.description}</p>

      {/* <h4>Services</h4> */}
      <List
        itemLayout="horizontal"
        dataSource={serviceProvider.services
          .map((service, i) => {
            return {
              key: i,
              name: service.name,
              description: service.description,
              cost: service.cost,
              service: service,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name))}
        // renderItem={item => (
        //   <List.Item>
        //     <List.Item.Meta
        //       title={item.name}
        //       description={item.description}
        //       style={{ cursor: "pointer" }}
        //       onClick={() => onSetSelectedService(item.service.name)}
        //     />
        //     <div>{item.cost} &nbsp; &nbsp; &nbsp; &nbsp;</div>
        //   </List.Item>
        //)}
      />
    </div>
  );
}
