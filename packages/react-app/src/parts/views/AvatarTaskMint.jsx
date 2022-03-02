import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { Button, Input, Checkbox } from "antd";
import { calcPosFromAngles } from "@react-three/drei";

const xp = 0;
export default function AvatarTaskMint(props) {
  const history = useHistory();
  const [seconds, setSeconds] = useState(0);
  const [canMint, setCanMint] = useState(false);
  const [xp, setXp] = useState("5000");
  const [skill, setSkill] = useState("10000000000000");
  const [reputation, setReputation] = useState("10000000000000");
  const [plur, setPlur] = useState("10000000000000");
  const [relatable, setRelatable] = useState("10000000000000");

  const { writeContracts, tx } = props;

  function award(longInt, d) {
    try {
      var num = parseInt(longInt);
      var x = ((num % (d * 100)) / d) % 10;
      return Math.floor(x);
    } catch (e) {}
    return 0;
  }

  function experience(longInt) {
    try {
      var num = parseInt(longInt);
      var x = num % 5001;
      return Math.floor(x);
    } catch (e) {}
    return 0;
  }

  /*  useEffect(() => {
    xps = (
      <>
        Training:{award(xp, 1)} Charisma:{award(xp, 100)} Constitution:{award(xp, 10000)} Dexterity:{award(xp, 1000000)}{" "}
        Intelligence:{award(xp, 100000000)} Strength:{award(xp, 10000000000)} Wisdom:{award(xp, 1000000000000)} Skill:
        {award(xp, 1)}
      </>
    );
  }, [xp]); */

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        marginTop: 16,
        paddingBottom: 16,
        alignItems: "left",
        textAlign: "left",
      }}
    >
      <Input
        style={{ width: "80%" }}
        min={0}
        size="large"
        value={xp}
        placeholder="XP"
        onChange={e => {
          try {
            setXp(e.target.value);
          } catch (e) {
            console.log(e);
          }
        }}
      />
      <br />
      <>
        <>
          XP:{experience(xp)}
          {/*  Charisma:{award(xp, 100)} Constitution:{award(xp, 10000)} Dexterity:
          {award(xp, 1000000)} Intelligence:{award(xp, 100000000)} Strength:{award(xp, 10000000000)} Wisdom:
          {award(xp, 1000000000000)} Skill:{award(xp, 1)} */}
        </>
        <br/>
      </>
      <Input
        style={{ width: "80%" }}
        min={0}
        size="large"
        value={skill}
        placeholder="skill"
        onChange={e => {
          try {
            setSkill(e.target.value);
          } catch (e) {
            console.log(e);
          }
        }}
      />
      <>
        <><br/>
          Training:{award(skill, 1)} Charisma:{award(skill, 100)} Constitution:{award(skill, 10000)}{" "}
          Dexterity:
          {award(skill, 1000000)} Intelligence:{award(skill, 100000000)} Strength:{award(skill, 10000000000)} 
          {/* Level: {award(skill, 1000000000000)}  */}
          {/* Reputation Points:{award(skill, 1)} */}
        </>
        <br/>
      </>
      <Input
        style={{ width: "80%" }}
        min={0}
        size="large"
        value={reputation}
        placeholder="reputation"
        onChange={e => {
          try {
            setReputation(e.target.value);
          } catch (e) {
            console.log(e);
          }
        }}
      />
      <>
        <><br/>
          Reputation:{award(reputation, 1)} Visibility:{award(reputation, 100)} Distinctiveness:
          {award(reputation, 10000)} Authenticity:
          {award(reputation, 1000000)} Transparency:{award(reputation, 100000000)} Consistency:
          {award(reputation, 10000000000)} 
          {/* Vision: {award(reputation, 1000000000000)}  */}
          {/* Reputation Points:{award(reputation, 1)} */}
        </>
        <br/>
      </>
      <Input
        style={{ width: "80%" }}
        min={0}
        size="large"
        value={plur}
        placeholder="plur"
        onChange={e => {
          try {
            setPlur(e.target.value);
          } catch (e) {
            console.log(e);
          }
        }}
      />
      <>
        <><br/>
        Peace:{award(plur, 1)} Love:{award(plur, 100)} Unity:{award(plur, 10000)} Respect:
          {award(plur, 1000000)} Courage:{award(plur, 100000000)} Justice:{award(plur, 10000000000)} 
          {/* Level: {award(plur, 1000000000000)}  */}
          {/* Reputation Points:{award(plur, 1)} */}
        </>
        <br/>
      </>
      <Input
        style={{ width: "80%" }}
        min={0}
        size="large"
        value={relatable}
        placeholder="relatable"
        onChange={e => {
          try {
            setRelatable(e.target.value);
          } catch (e) {
            console.log(e);
          }
        }}
      />
      <>
        <><br/>
          Privacy:{award(relatable, 1)} Interoperability:{award(relatable, 100)} Sovereignty:{award(relatable, 10000)}{" "}
          Force for good:
          {award(relatable, 1000000)} Support:{award(relatable, 100000000)} Symmetry:
          {award(relatable, 10000000000)} 
          {/* Level: {award(relatable, 1000000000000)} Reputation Points:{award(relatable, 1)} */}
        </>
        <br/>
      </>
      <br />
      <Checkbox
            //checked={this.state.checked}
            //disabled={this.state.disabled}
            onChange={(e)=>{setCanMint(e.target.checked); console.log("can mint?", e.target.checked)}}
          >
            Users can mint experience ? 
          </Checkbox>      
      <br />
      <Button
        style={{ width: "20%" }}
        type={"primary"}
        onClick={() => {
          tx(writeContracts.Avatar.prepareMint(canMint, xp, skill, reputation, plur, relatable));
        }}
      >
        Create Mint
      </Button>

      <Button
        style={{ width: "20%" }}
        type={"primary"}
        onClick={() => {
          tx(writeContracts.Avatar.mint());
        }}
      >
        Test Mint
      </Button>
    </div>
  );
}
