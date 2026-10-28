import { Avatar, Tooltip } from "@chakra-ui/react";
import React from "react";
import { useChatContext } from "../context/ChatProvider";
import styles from "./ScrollableChat.module.css";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import Axios from "./Auth/axiosConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ScrollableChat({ messages, OnSetMessages }) {
  const { user, fetchChatsAgain, setFetchChatsAgain, socket } =
    useChatContext();

  const isSameSenderMargin = (messages, m, i, userId) => {
    if (
      i < messages.length - 1 &&
      messages[i + 1].sender.id === m.sender.id &&
      messages[i].sender.id !== userId
    )
      return 33;
    else if (
      (i < messages.length - 1 &&
        messages[i + 1].sender.id !== m.sender.id &&
        messages[i].sender.id !== userId) ||
      (i === messages.length - 1 && messages[i].sender.id !== userId)
    )
      return 0;
    else return "auto";
  };

  //Jyanne Malla(Logged In User La) Message send kela ahe (toh)
  function isSameSender(messages, m, i, userId) {
    return (
      i < messages.length - 1 &&
      (messages[i + 1].sender.id !== m.sender.id ||
        messages[i + 1].sender.id === undefined) &&
      messages[i].sender.id !== userId
    );
  }

  //Jyane Malla(Logged In User la) message pathavalla, tyachach last message ahe ka(in messages[])
  const isLastMessage = (messages, i, userId) => {
    return (
      i === messages.length - 1 &&
      messages[messages.length - 1].sender.id !== userId &&
      messages[messages.length - 1].sender.id
    );
  };

  const isSameUser = (messages, m, i) => {
    return i > 0 && messages[i - 1].sender.id === m.sender.id;
  };

  function extractAndFormatDate(isoString, i) {
    // Convert the ISO string to a Date object
    const date = new Date(isoString);

    // Extract and format the date (e.g., "25 Aug 2024")
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return formattedDate;
  }

  function extractDateAsNum(isoString) {
    // Convert the ISO string to a Date object
    const date = new Date(isoString);

    // Extract the day as an integer
    const day = date.getDate();

    return day;
  }

  function dateChanged(messages, i, m) {
    if (i === 0) {
      return true;
    }

    return (
      i < messages.length &&
      extractDateAsNum(m.createdAt) !==
        extractDateAsNum(messages[i - 1].createdAt)
    );
  }

  function extractTime(isoString) {
    // Convert the ISO string to a Date object
    const date = new Date(isoString);

    // Extract and format the time (e.g., "6:41 pm" or "1:09 am")
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return formattedTime;
  }

  //Deleting a particular message document.
  async function handleDeleteMessage(messObj, i) {
    try {
      let isLastMessage = false;
      let prevMessObjId = null;

      // console.log({
      //   messObjId: messObj?.id,
      //   messagesLastMessId: messages[messages.length - 1]?.id,
      // });

      if (
        messages[messages.length - 1]?.id?.toString() ===
        messObj?.id?.toString()
      ) {
        isLastMessage = true;
        prevMessObjId = messages[i - 1]?.id || null;
      }

      // console.log("handleDeleteMessage method called");
      // console.log({ isLastMessage, prevMessObjId });

      const { data } = await Axios.delete(
        `${API_BASE_URL}/api/message/deletemessage/${messObj.id}`,
        {
          data: { lastMessage: isLastMessage, prevMessObjId },
          withCredentials: true,
        },
      );

      // console.log({ data });
      OnSetMessages((messages) =>
        messages.filter((el) => el.id !== messObj.id),
      );
      setFetchChatsAgain(!fetchChatsAgain);

      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(data.chat), // data.chat is updated ChatDTOFE
      });

      socket.publish({
        destination: "/app/message/refetch",
        body: JSON.stringify(data.chat),
      });

      // Refetch notifications for otherUser(with whom I am chatting with one on  one), whose
      // notifications may still have this deleted message as notification.
      socket.publish({
        destination: "/app/notifications/refetch",
        body: JSON.stringify(messObj),
      });
    } catch (err) {
      // console.log(err.message);
    }
  }

  return (
    <div style={{ overflowX: "hidden", overflowY: "auto" }}>
      {messages.length > 0 &&
        messages?.map((m, i) => (
          <React.Fragment key={m.id}>
            {dateChanged(messages, i, m) ? (
              <p className={styles.dateContainer}>
                {extractAndFormatDate(m.createdAt, i)}
              </p>
            ) : (
              ""
            )}
            <div
              style={{ display: "flex", alignItems: "center" }} /* key={m.id} */
            >
              {(isSameSender(messages, m, i, user.id) ||
                isLastMessage(messages, i, user.id)) && (
                <Tooltip
                  label={m.sender.name}
                  placement="bottom-start"
                  hasArrow
                >
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
              <span
                style={{
                  backgroundColor: `${
                    m.sender.id === user.id ? "#BEE3F8" : "#B9F5D0"
                  }`,
                  marginLeft: isSameSenderMargin(messages, m, i, user.id),
                  marginTop: isSameUser(messages, m, i, user.id) ? 3.5 : 14,
                  borderRadius: "20px",
                  padding: "5px 15px",
                  maxWidth: "75%",
                }}
              >
                {!m.content ? (
                  <PhotoProvider>
                    <PhotoView src={m.imgUrl}>
                      <img
                        style={{
                          height: "80px",
                          width: "80px",
                          cursor: "pointer",
                        }}
                        src={m.imgUrl}
                        alt="Zoomable"
                      />
                    </PhotoView>
                  </PhotoProvider>
                ) : (
                  m.content
                )}
                <span className={styles.timeContainer}>
                  {extractTime(m.createdAt)}
                </span>

                {String(m.sender.id) === String(user.id) && (
                  <span
                    className={`${styles.readStatus} ${
                      m.readByAllRecipients ? styles.readStatusRead : ""
                    }`}
                    title={m.readByAllRecipients ? "Read" : "Sent"}
                    aria-label={
                      m.readByAllRecipients
                        ? "Message read"
                        : "Message not yet read by everyone"
                    }
                  >
                    <i className="fa-solid fa-check-double" />
                  </span>
                )}
                <span
                  className={styles.deleteContainer}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(m, i);
                  }}
                >
                  <i className="fa-solid fa-trash"></i>
                </span>
              </span>
            </div>
          </React.Fragment>
        ))}
    </div>
  );
}

export default ScrollableChat;

/*
1] npm install react-medium-image-zoom --force
   npm uninstall react-medium-image-zoom --force

2] Description: Another React library that provides a photo viewer with zoom capabilities. It's 
                lightweight and very responsive.

   Installation:
   npm install react-photo-view --force   

*/
