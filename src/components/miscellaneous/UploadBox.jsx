import { Input, useToast, Spinner } from "@chakra-ui/react";
import { useState } from "react";
import styles from "./UploadBox.module.css";
import Axios from "../Auth/axiosConfig";
import axios from "axios";
import { useChatContext } from "../../context/ChatProvider";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Dedicated Axios instance for Cloudinary.
// No authentication cookies and no backend CSRF interceptor.
const cloudinaryAxios = axios.create({
  withCredentials: false,
});

function UploadBox({ onCloseBox, messages, onSetMessages }) {
  const [image, setImage] = useState(null);
  const [sendingImageMessage, setSendingImageMessage] = useState(false);

  // console.log("UploadBox Component");
  // console.log({ image });

  const {
    selectedChat,
    fetchChatsAgain,
    setFetchChatsAgain,
    setNotificationFromBackend,
    socket,
    onlineUsers,
    user,
  } = useChatContext();

  const toast = useToast();

  async function createNotificationRecord(messObj, otherUserId, flag) {
    // console.log(
    //   `Creating a new Notification for userId: ${otherUserId} having content: ${messObj}`,
    // );

    // console.log({ messageId: messObj?.id });

    try {
      const { data } = await Axios.post(
        `${API_BASE_URL}/api/notification/create`,
        { messageId: messObj?.id, userId: otherUserId },
        { withCredentials: true },
      );

      // console.log({ notificationCreated: data });
      if (flag) {
        setNotificationFromBackend((prev) => [data, ...prev]);
      }
    } catch (err) {
      // console.log(err.message);
    }
  }

  async function handleNotificationsForOfflineUsers(
    onlineUsersArr,
    messObj,
    loggedInUser,
  ) {
    // console.log("Inside UploadBox's handleNotificationForOfflineUsers method");
    // console.log({ messObj });
    // console.log({ users: messObj.chat.users });

    let otherUserId =
      loggedInUser?.id === messObj.chat.users[0]?.id
        ? messObj.chat.users[1].id
        : messObj.chat.users[0].id;

    // console.log({ otherUserId });

    let userOnline = onlineUsersArr.includes(otherUserId.toString());

    if (!userOnline) {
      //Logic for creating a Notification document.

      createNotificationRecord(messObj, otherUserId, false);
    }
  }

  async function uploadImageToCloudinary() {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "chat-app"); // Use your Cloudinary upload preset
    formData.append("cloud_name", "dizk5mov0");

    const cloud_name = "dizk5mov0";

    try {
      const response = await cloudinaryAxios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, // Your Cloudinary endpoint
        formData,
      );

      return response.data.secure_url; // Get the uploaded image URL
    } catch (error) {
      // console.error("Error uploading image", error);
      return null;
    }
  }

  async function sendImageMessage(e) {
    e.preventDefault();

    if (image === null) return;

    //Extract data from the form fields.
    const formdata = new FormData(e.currentTarget);

    //Converting the form data into actual JS object.
    const data = Object.fromEntries(formdata);

    // console.log({ imageData: data });

    // Check if the 'pic' is a valid File object or not.
    if (data.pic instanceof File && data.pic?.name) {
      setSendingImageMessage(true);

      let imageUrl = await uploadImageToCloudinary();

      // console.log({ imageUrl });

      if (!imageUrl) {
        setSendingImageMessage(false);
        toast({
          title: "Problem Occured while uploading Image File to Cloudinary !!",
          status: "error",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
        onCloseBox(false);
        return;
      }

      //Logic to create a 'message' doc. containing 'imageUrl' & hence updating the coressp. 'chat' doc.
      try {
        const { data } = await Axios.post(
          `${API_BASE_URL}/api/message/imgmessage`,
          { content: "", chatId: selectedChat.id, imageURL: imageUrl },
          { withCredentials: true },
        );

        // console.log({ messageImage: data });
        localStorage.setItem("messages", JSON.stringify([...messages, data]));
        onSetMessages([...messages, data]);
        setFetchChatsAgain(!fetchChatsAgain);

        socket.publish({
          destination: "/app/chat/send",
          body: JSON.stringify(data), // `data` is your `MessageDTOFE` object
        });

        handleNotificationsForOfflineUsers(onlineUsers, data, user);

        toast({
          title: "Message with Image sent Successfully !!",
          status: "success",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
        onCloseBox(false);
        e.target.reset();
      } catch (err) {
        // console.log(err.message);
        toast({
          title: "Error Occured !!",
          description: `Unable to send the Message (Server Issue)`,
          status: "error",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
      } finally {
        setSendingImageMessage(false);
      }
    } else {
      toast({
        title: "Warning alert !!",
        description: `Please upload an appropriate Image File !!!`,
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.innerModal}>
          <form onSubmit={sendImageMessage} className={styles.imageBOX}>
            <label>📷 Upload Image</label>
            <Input
              type="file"
              p={1.5}
              accept="image/*"
              name="pic"
              onChange={(e) => setImage(e.target.files[0])}
            />
            {sendingImageMessage ? (
              <Spinner
                size="sm"
                thickness="3px"
                speed="0.45s"
                color="#63E6BE"
                emptyColor="gray.200"
                position="absolute"
                className={styles.spinnerMessage}
              />
            ) : (
              <button className={styles.imageBtn}>Send Image ▶ </button>
            )}
          </form>
          <button className={styles.closeBtn} onClick={() => onCloseBox(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadBox;
