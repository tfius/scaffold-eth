// main component for SocialGraph message display
import React from "react";
import Blockies from "react-blockies";
import { AddressSimple } from "../components";
import { Collapse, Layout, Tooltip } from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { formatNumber, timeAgo } from "../views/datetimeutils";

const { Header, Content, Footer, Sider } = Layout;
const { Panel } = Collapse;

const IconText = ({ icon, tooltip, text }) => (
  <Tooltip title={tooltip}>
    {React.createElement(icon)}
    {text}
  </Tooltip>
);

const TextWithLinks = ({ text }) => {
  // Function to convert @mentions and #hashtags into clickable links
  const convertTextToLinks = text => {
    const mentionRegex = /(@\w+)/g;
    const hashtagRegex = /(#\w+)/g;
    // Replace @mentions with links
    const withMentionLinks = text.replace(mentionRegex, '<a href="https://twitter.com/$1">$1</a>');
    // Replace #hashtags with links
    const withHashtagLinks = withMentionLinks.replace(hashtagRegex, '<a href="https://twitter.com/hashtag/$1">$1</a>');
    return withHashtagLinks;
  };
  // Convert text to links and set as inner HTML
  const createMarkup = () => {
    return { __html: convertTextToLinks(text) };
  };

  return <div dangerouslySetInnerHTML={createMarkup()} />;
};
const TextWithInteractiveMentionsAndTags = ({ text, onMentionClick, onHashtagClick }) => {
  // Function to split the text into parts and identify @mentions and #hashtags
  const parseText = text => {
    // Split the text by space and process each word
    return text.split(/\s/).map((word, index) => {
      // Check if the word is a mention or a hashtag
      if (word.startsWith("@")) {
        return (
          <span key={index}>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                onMentionClick(word);
              }}
            >
              {word}
            </a>{" "}
          </span>
        );
      } else if (word.startsWith("#")) {
        return (
          <span key={index}>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                onHashtagClick(word);
              }}
            >
              {word}
            </a>{" "}
          </span>
        );
      } else {
        // Just a normal word, return it as is
        return <span key={index}>{word} </span>;
      }
    });
  };

  return <div>{parseText(text)}</div>;
};

const TextInteractive = ({ text, onMentionClick, onHashtagClick, onUrlClick, onTokenClick, expanded }) => {
  // Function to detect URLs using a simple regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  if (expanded === false) {
    // strip text to 140 characters
    text = text.substring(0, 240);
  }

  // Function to split the text into parts and identify @mentions, #hashtags, and URLs
  const parseText = text => {
    // Split by new lines first
    return text.split(/\n/).map((line, lineIndex) => (
      <div key={lineIndex}>
        {
          // Then process each line
          line.split(/\s+/).map((word, wordIndex) => {
            // Generate a unique key for each word
            const key = `${lineIndex}-${wordIndex}`;
            if (word.startsWith("@")) {
              return (
                <span key={key}>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      onMentionClick(word);
                    }}
                  >
                    {word}
                  </a>{" "}
                </span>
              );
            } else if (word.startsWith("#")) {
              return (
                <span key={key}>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      onHashtagClick(word);
                    }}
                  >
                    {word}
                  </a>{" "}
                </span>
              );
            } else if (word.startsWith("$")) {
              return (
                <span key={key}>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      onTokenClick(word);
                    }}
                  >
                    {word}
                  </a>{" "}
                </span>
              );
            } else if (urlPattern.test(word)) {
              const url = word.match(urlPattern)[0];
              return (
                <span key={key}>
                  <a
                    href={url}
                    onClick={e => {
                      e.preventDefault();
                      onUrlClick(url);
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {word}
                  </a>{" "}
                </span>
              );
            } else {
              return <span key={key}>{word} </span>;
            }
          })
        }
      </div>
    ));
  };

  return <div style={{ whiteSpace: "pre-wrap" }}>{parseText(text)}</div>;
};

export function DisplayMessages({
  messages,
  tx,
  writeContracts,
  readContracts,
  ensProvider,
  history,
  onNotifyClick,
  onComment,
  setReplyTo,
}) {
  const handleMentionClick = mention => {
    console.log(`Mention clicked: ${mention}`);
    history.push("/sociomat?mention=" + mention.substring(1));
    onNotifyClick();
    // Handle mention click (e.g., navigate to user profile)
  };
  const handleHashtagClick = hashtag => {
    console.log(`Hashtag clicked: ${hashtag}`);
    // remove trailing # from hashtag
    history.push("/sociomat?tag=" + hashtag.substring(1));
    onNotifyClick();
    // Handle hashtag click (e.g., search for hashtag)
  };
  const handleTokenClick = token => {
    console.log(`Token clicked: ${token}`);
    // Handle post click (e.g., navigate to post)
    history.push("/sociomat?token=" + token.substring(1));
    onNotifyClick();
  };
  const handleUrlClick = url => {
    console.log(`URL clicked: ${url}`);
    // Handle URL click (e.g., open URL with browser)
  };
  const handleUserClick = post => {
    console.log(`User clicked: ${post}`);
    // Handle post click (e.g., navigate to post)
    history.push("/sociomat?userId=" + post.creator);
    onNotifyClick();
  };

  const handlePostClick = post => {
    //console.log(`Post clicked: ${post}`);
    console.log("Post clicked: ", post);
    // Handle post click (e.g., navigate to post)
    history.push("/sociomat?postId=" + post.postId);
    onNotifyClick();
  };
  const getUpdateMessage = async message => {
    console.log("update", message);
    var newTx = await readContracts.SocialGraph.getPostStats(message.postId);
    console.log("postStats", newTx);
  };
  const share = async message => {
    console.log("share", message);
    var newTx = await tx(writeContracts.SocialGraph.share(message.postId));
    await newTx.wait();
  };
  const like = async message => {
    console.log("like", message);
    await getUpdateMessage(message);
    var newTx = await tx(writeContracts.SocialGraph.like(message.postId));
    await newTx.wait();
  };
  const comment = async message => {
    console.log("comment", message);
    // var newTx = await tx(writeContracts.SocialGraph.comment(message.postId, commentContentLocation));
    onComment(message);
    //await newTx.wait();
  };
  const bookmark = async message => {
    console.log("bookmark", message);
    var newTx = await tx(writeContracts.SocialGraph.bookmark(message.postId));
    await newTx.wait();
  };
  const handleBackgroundClick = event => {
    if (event.target == event.currentTarget) {
      console.log("background clicked"); // display post in full and its comments
      //setReplyTo("", false);
    }
  };

  return (
    <div style={{ width: "70%" }}>
      {messages.map((p, i) => {
        return (
          <div
            key={i}
            style={{ width: "100%", marginLeft: p.parentPost ? p.level + "px" : "0px" }}
            className="post-card-body"
          >
            <div className="post-layout" onClick={() => handlePostClick(p)}>
              <Tooltip
                title={
                  <>
                    View profile of user &nbsp;
                    <AddressSimple address={p.creator} ensProvider={ensProvider} />
                  </>
                }
              >
                <div className="post-blockie" style={{ cursor: "pointer" }} onClick={() => handleUserClick(p)}>
                  <Blockies seed={p.creator.toLowerCase()} size={16} scale={2} />
                </div>
              </Tooltip>

              <div className="post-text">
                <strong className="post-creator">
                  <small>{timeAgo(p.sendTime)}</small>
                </strong>
                <TextInteractive
                  text={p.message}
                  onMentionClick={handleMentionClick}
                  onHashtagClick={handleHashtagClick}
                  onTokenClick={handleTokenClick}
                  onUrlClick={handleUrlClick}
                  expanded={p.expanded || i === 0}
                />
              </div>
            </div>
            <div className="post-footer">
              <small
                style={{ margin: "3px 10px 0px", cursor: "pointer", scale: "100%" }}
                onClick={() => setReplyTo(p.creator, true)}
              >
                <IconText icon={ArrowLeftOutlined} tooltip="Send message" key="list-vertical-reply-o" />
              </small>
              <Tooltip title="Comment">
                <span onClick={() => comment(p)} style={{ cursor: "pointer" }}>
                  {" "}
                  🗨 <small style={{ opacity: "0.5" }}>{formatNumber(p.commentCount.toString())}</small> &nbsp;
                </span>
              </Tooltip>
              <Tooltip title="Like">
                <span onClick={() => like(p)} style={{ cursor: "pointer" }}>
                  {" "}
                  ♡ <small style={{ opacity: "0.5" }}>{formatNumber(p.likeCount.toString())}</small> &nbsp;
                </span>
              </Tooltip>
              <Tooltip title="Share">
                <span onClick={() => share(p)} style={{ cursor: "pointer" }}>
                  {" "}
                  ☄ <small style={{ opacity: "0.5" }}>{formatNumber(p.shareCount.toString())}</small> &nbsp;
                </span>
              </Tooltip>
              <Tooltip title="Bookmark">
                <span onClick={() => bookmark(p)} style={{ cursor: "pointer" }}>
                  {" "}
                  🕮 <small style={{ opacity: "0.5" }}>{formatNumber(p.totalEngagement.toString())}</small> &nbsp;
                </span>
              </Tooltip>
              <Tooltip title="Engagement">
                <span> ⚭</span> <small style={{ opacity: "0.5" }}>{formatNumber(p.totalEngagement.toString())}</small>{" "}
                &nbsp;
              </Tooltip>
            </div>
            <div className="post-footer-tokens">
              {p.tokens.map((t, i) => {
                return (
                  <span key={"tkn" + i} onClick={() => handleTokenClick(t.symbol)} style={{ cursor: "pointer" }}>
                    {t.name}: {t.price}$&nbsp;
                  </span>
                );
              })}
            </div>

            {/* <br />
              <div>Creator: {p.creator} </div>
              <div>Sender: {p.sender}</div>
              <div>SendTime: {p.sendTime}</div>
              <div>Toxicity: {JSON.stringify(p.toxicity)}</div>
              <div>Embeddings: {JSON.stringify(p.embeddings)}</div>
              <div>Shape: {JSON.stringify(p.shape)}</div>
              <div>Sentences: {JSON.stringify(p.sentences)}</div>
              <div>Attachments: {JSON.stringify(p.attachments)}</div>
              <div>Tags: {JSON.stringify(p.tags)}</div>
              <div>Ats: {JSON.stringify(p.ats)}</div> */}
            {/* </Panel> */}
            {/* </Card> */}
          </div>
        );
      })}
    </div>
  );
}
export default DisplayMessages;
