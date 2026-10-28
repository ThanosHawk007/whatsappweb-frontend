import { useState } from "react";
import styles from "./ProfilePicChange.module.css";
import { Input, useToast, Spinner } from "@chakra-ui/react";
import Axios from "../Auth/axiosConfig";
import { useChatContext } from "../../context/ChatProvider";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const cloudinaryAxios = axios.create({
  withCredentials: false,
});

function ProfilePicChange({ onCloseModal }) {
  const [image, setImage] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  // console.log("UploadBox Component");
  // console.log({ image });

  const {
    selectedChat,
    fetchChatsAgain,
    setFetchChatsAgain,
    socket,
    onlineUsers,
    user,
    setUser,
    chats,
  } = useChatContext();

  const toast = useToast();

  function findOnlineChatUserIds() {
    const chattedUserIds = new Set(); // To store unique userIds

    // 1. Gather all userIds from your chats (excluding yourself)
    chats.forEach((chat) => {
      chat.users.forEach((u) => {
        if (u.id !== user.id) {
          chattedUserIds.add(u.id);
        }
      });
    });

    // 2. Filter the onlineUsers array to get only those who are in your chattedUserIds
    const onlineChattedUserIds = onlineUsers
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && chattedUserIds.has(id));

    // console.log({ onlineChattedUserIds });

    // 3. Publish refetch events only for those online & chatted-with users
    socket.publish({
      destination: "/app/chat/refetch/updatedpic",
      body: JSON.stringify({ onlineChattedUserIds }), // onlineChattedUserIds is an array of Longs
    });
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
      console.error("Error uploading image", error);
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
      setUploadingPic(true);
      let imageUrl = await uploadImageToCloudinary();

      // console.log({ imageUrl });

      if (!imageUrl) {
        setUploadingPic(false);
        toast({
          title: "Image Upload Failed",
          description: "There was an error uploading your image.",
          status: "error",
          duration: 9000,
          isClosable: true,
        });

        return;
      }

      //Logic to create a 'message' doc. containing 'imageUrl' & hence updating the coressp. 'chat' doc.
      try {
        const res = await Axios.post(
          `${API_BASE_URL}/api/user/changepic`,
          { userId: user.id, imageURL: imageUrl },
          { withCredentials: true },
        );

        const { user: userInfo } = res.data;

        // console.log({ UpdatedUserDoc: userInfo });

        setFetchChatsAgain(!fetchChatsAgain);

        // socket.emit("refetchingChats", data.chat);
        findOnlineChatUserIds();

        localStorage.removeItem("userInfo");
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        setUser(userInfo);

        onCloseModal(false);
        e.target.reset();

        toast({
          title: "Profile Pic Successfully updated !!",
          status: "success",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
      } catch (err) {
        // console.log(err.message);
        toast({
          title: "Error Occured !!",
          description: `Unable to update the Profile Pic (Server Issue)`,
          status: "error",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
      } finally {
        setUploadingPic(false);
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
            <label>📷 Upload Profile image</label>
            <Input
              type="file"
              p={1.5}
              accept="image/*"
              name="pic"
              onChange={(e) => setImage(e.target.files[0])}
            />
            {uploadingPic ? (
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
              <button className={styles.imageBtn}>Upload new Image ▶</button>
            )}
          </form>
          <button
            className={styles.closeBtn}
            onClick={() => onCloseModal(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePicChange;
