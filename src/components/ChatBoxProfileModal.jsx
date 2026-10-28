import { useEffect, useState } from "react";
import styles from "./ChatBoxProfileModal.module.css";
import { useChatContext } from "../context/ChatProvider";
import { Input, Spinner, useToast } from "@chakra-ui/react";
import Axios from "./Auth/axiosConfig";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const cloudinaryAxios = axios.create({
  withCredentials: false,
});

function ChatBoxProfileModal({ onClose }) {
  const [updateGroupChatName, setUpdateGroupChatName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [removeAddLoading, setRemoveAddLoading] = useState(false);

  const toast = useToast();

  /*
  console.log("ChatBoxProfileModal Comp.");
  console.log({ searchResults });
  */

  const {
    selectedChat,
    user,
    setSelectedChat,
    setChats,
    chats,
    socket,
    onlineUsers,
  } = useChatContext();
  console.log({ selectedChat });

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

  async function handleRemoveGroup() {
    if (user.id !== selectedChat.groupAdmin.id) {
      // console.log("Not a Admin");
      toast({
        title: "You are Not a Admin of this Group !!!",
        description: "You can not modify this Group",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });

      return;
    }

    try {
      setDeletingGroup(true);
      const { data } = await Axios.delete(
        `${API_BASE_URL}/api/chat/deletegroup`,
        {
          headers: { "Content-Type": "application/json" },
          data: { chatId: selectedChat.id }, // Pass chatId here
          withCredentials: true,
        },
      );
      // console.log(data);
      setSelectedChat({});
      setChats((chats) => chats.filter((el) => el.id !== data.id));

      // Clear out chatName or set a flag to help backend identify deletion
      const deletedData = { ...data, chatName: null };

      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(deletedData),
      });

      toast({
        title: "Group Successfully Deleted !!",
        status: "success",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
      onClose(false);
    } catch (err) {
      console.log(err.message);
      toast({
        title: "Error Occured !!",
        description: `Unable to Delete the Group (Server Issue)`,
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    } finally {
      setDeletingGroup(false);
    }
  }

  async function handleGroupPicChange(e) {
    e.preventDefault();

    if (user.id !== selectedChat.groupAdmin.id) {
      setImage(null);
      // console.log("Not a Admin");
      toast({
        title: "You are Not a Admin of this Group !!!",
        description: "You can not modify this Group",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });

      return;
    }

    if (image === null) {
      toast({
        title: "Please Upload an image file !!!",
        description: "Image file not uploaded by user !!!",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
      return;
    }

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
        setImage(null);
        toast({
          title: "Image Upload Failed",
          description: "There was an error uploading your image.",
          status: "error",
          duration: 9000,
          isClosable: true,
        });

        return;
      }

      try {
        const { data } = await Axios.put(
          `${API_BASE_URL}/api/chat/changeChatPic`,
          { chatId: selectedChat.id, imageURL: imageUrl },
          { withCredentials: true },
        );

        setSelectedChat(data);
        setChats((chats) => chats.map((el) => (el.id === data.id ? data : el)));

        socket.publish({
          destination: "/app/chat/refetch",
          body: JSON.stringify(data), // data is updated ChatDTOFE
        });

        e.target.reset();

        toast({
          title: "GroupChat's picture got successfully Updatd !!!",
          status: "success",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
      } catch (err) {
        // console.log(err?.message);
        toast({
          title: "Error Occured !!",
          description: `Unable to change the GroupChat's picture (Server Issue)`,
          status: "error",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
      } finally {
        setUploadingPic(false);
      }
    }
  }

  async function handleRemoveUser(userToRemove) {
    if (user.id !== selectedChat.groupAdmin.id) {
      // console.log("Not a Admin");
      toast({
        title: "You are Not a Admin of this Group !!!",
        description: "You can not modify this Group",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });

      return;
    }

    if (selectedChat.groupAdmin.id === userToRemove.id) {
      toast({
        title: "Admin can not be Removed !!!",
        description: "Delete The Group Instead !!",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });

      return;
    }

    try {
      setRemoveAddLoading(true);
      const { data } = await Axios.put(
        `${API_BASE_URL}/api/chat/remove`,
        { chatId: selectedChat.id, userId: userToRemove.id },
        { withCredentials: true },
      );
      // console.log(data);
      setSelectedChat(data);
      setChats((chats) => chats.map((el) => (el.id === data.id ? data : el)));

      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(data), // data is updated ChatDTOFE
      });

      //Notify all other users of curr. group chat, that this particular user just got removed.
      socket.publish({
        destination: "/app/newChat/onlineUsersNotify",
        body: JSON.stringify(data), // data is created ChatDTOFE
      });

      toast({
        title: "User successfully Removed from the Group Chat !!",
        status: "success",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    } catch (err) {
      // console.log(err.message);
      toast({
        title: "Error Occured !!",
        description: `Unable to Remove the User (Server Issue)`,
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    } finally {
      setRemoveAddLoading(false);
    }
  }

  async function handleRename() {
    if (user.id !== selectedChat.groupAdmin.id) {
      // console.log("Not a Admin");
      toast({
        title: "You are Not a Admin of this Group !!!",
        description: "You can not modify this Group",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });

      return;
    }

    if (!updateGroupChatName.trim()) {
      toast({
        title: "Please fill the Group Name field !!",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      setRenameLoading(true);
      const { data } = await Axios.put(
        `${API_BASE_URL}/api/chat/rename`,
        {
          chatId: selectedChat.id,
          chatName: updateGroupChatName,
        },
        { withCredentials: true },
      );
      // console.log(data);
      setSelectedChat(data);
      setUpdateGroupChatName("");
      setChats((chats) => chats.map((el) => (el.id === data.id ? data : el)));

      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(data), // data is updated ChatDTOFE
      });
      toast({
        title: "Group Chat Name Successfully Updated !!",
        status: "success",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
      onClose(false);
    } catch (err) {
      console.log(err.message);
      toast({
        title: "Error Occured !!",
        description: `Group Chat Name could not be updated`,
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    } finally {
      setRenameLoading(false);
    }
  }

  //Add the users to the Group Chat.
  async function handleAddUser(userToAdd) {
    // console.log(userToAdd);

    if (user.id !== selectedChat.groupAdmin.id) {
      // console.log("Not a Admin");
      toast({
        title: "You are Not a Admin of this Group !!!",
        description: "You can not modify this Group",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });

      return;
    }

    if (selectedChat.users.find((el) => el.id === userToAdd.id) !== undefined) {
      toast({
        title: "User already added !!",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
      return;
    }

    //Logic to add a user to the selected Group Chat through backend.
    try {
      setRemoveAddLoading(true);
      const { data } = await Axios.put(
        `${API_BASE_URL}/api/chat/add`,
        { chatId: selectedChat.id, userId: userToAdd.id },
        { withCredentials: true },
      );
      // console.log(data);
      setSelectedChat(data);
      setSearchQuery("");
      setChats((chats) => chats.map((el) => (el.id === data.id ? data : el)));

      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(data), // data is updated ChatDTOFE
      });

      socket.publish({
        destination: "/app/newChat/onlineUsersNotify",
        body: JSON.stringify(data), // data is created ChatDTOFE
      });

      toast({
        title: "User successfully Added to the Group Chat !!",
        status: "success",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    } catch (err) {
      // console.log(err.message);
      toast({
        title: "Error Occured !!",
        description: `Unable to Add the User (Server Issue)`,
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    } finally {
      setRemoveAddLoading(false);
    }
  }

  function isUserOnline(currUser) {
    let userOnline = onlineUsers.includes(currUser?.id?.toString());
    return userOnline;
  }

  useEffect(() => {
    const query = searchQuery.trim();

    // No search query: clear the results
    if (!query) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    // Cancel the previous request if it is still running
    const controller = new AbortController();

    // Used to prevent an older request from updating the UI
    let isActive = true;

    // Wait until the user stops typing for 300ms
    const debounceTimer = setTimeout(async () => {
      try {
        setLoading(true);

        const { data } = await Axios.get(
          `${API_BASE_URL}/api/user?search=${encodeURIComponent(query)}`,
          {
            withCredentials: true,
            signal: controller.signal,
          },
        );

        if (isActive) {
          // console.log("Search Results:", data);
          setSearchResults(data);
        }
      } catch (err) {
        // Ignore errors caused by intentionally cancelled requests
        if (
          err.name !== "CanceledError" &&
          err.name !== "AbortError" &&
          isActive
        ) {
          // console.log(err.message);

          toast({
            title: "Error Occurred!",
            description: "Failed to Load the Search Results",
            status: "error",
            duration: 4000,
            isClosable: true,
            position: "top-left",
          });
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }, 300);

    // Cleanup whenever searchQuery changes or component unmounts
    return () => {
      isActive = false;

      clearTimeout(debounceTimer);

      controller.abort();
    };
  }, [searchQuery]);

  const isSelectedChat = Object.keys(selectedChat).length;

  return (
    <>
      {isSelectedChat && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button
              className={styles.closeButton}
              onClick={() => onClose(false)}
            >
              &times;
            </button>
            <h1 className={styles.profileName}>{selectedChat.chatName}</h1>
            {/* render selected users */}
            {selectedChat.users.length > 0 && (
              <div className={styles.userItemContainer}>
                {selectedChat.users.map((selectUser) => {
                  return (
                    <div
                      key={selectUser.id}
                      className={`${styles.userSelectItem} ${
                        selectedChat.groupAdmin.id === selectUser.id
                          ? styles.AdminUser
                          : ""
                      }`}
                    >
                      {selectUser?.id !== selectedChat.groupAdmin?.id ||
                      (selectUser?.id === selectedChat.groupAdmin?.id &&
                        user?.id !== selectUser?.id) ? (
                        isUserOnline(selectUser) || user.id == selectUser.id ? (
                          <span className={styles.isOnline}>{"on"}</span>
                        ) : (
                          <span className={styles.isOffline}>{"off"}</span>
                        )
                      ) : (
                        ""
                      )}
                      <img
                        src={selectUser?.pic}
                        alt={"profile pic"}
                        className={styles.avatar}
                      />
                      {selectedChat.groupAdmin.id === selectUser.id ? (
                        <span className={styles.AdminContainer}>
                          <span className={styles.AdminName}>(ADMIN)</span>
                          {selectUser.name}
                        </span>
                      ) : (
                        <span>{selectUser.name}</span>
                      )}
                      <button
                        className={styles.userBtn}
                        onClick={() => handleRemoveUser(selectUser)}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {removeAddLoading ? (
              <Spinner
                size="sm"
                thickness="3px"
                speed="0.45s"
                color="#e70621"
                emptyColor="gray.200"
                // position="absolute"
                className={styles.spinnerMessage}
              />
            ) : (
              ""
            )}
            <div className={styles.modalBody}>
              <div className={styles.updateGroupName}>
                <input
                  type="text"
                  placeholder="Group Name"
                  className={styles.inputField}
                  value={updateGroupChatName}
                  onChange={(e) => setUpdateGroupChatName(e.target.value)}
                />
                {renameLoading ? (
                  <Spinner
                    size="sm"
                    thickness="3px"
                    speed="0.45s"
                    color="#e70621"
                    emptyColor="gray.200"
                    position="absolute"
                    className={styles.spinnerMessage}
                  />
                ) : (
                  <button className={styles.updateBtn} onClick={handleRename}>
                    Update
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Add Users eg. John, Jenny, etc..."
                className={styles.inputField}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <form onSubmit={handleGroupPicChange} className={styles.imageBOX}>
                <label> 📷 Upload Group Profile image</label>
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
                  <button className={styles.imageBtn}>
                    Upload new Image ▶
                  </button>
                )}
              </form>
            </div>
            {/* Render searched users */}
            {loading ? (
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
              />
            ) : (
              searchResults.length > 0 && (
                <ul className={styles.userList}>
                  {searchResults.map((user) => (
                    <li
                      key={user.id}
                      className={styles.userItem}
                      onClick={() => handleAddUser(user)}
                    >
                      <img
                        src={user.pic}
                        alt={user.name}
                        className={styles.avatar}
                      />
                      <div>
                        <p className={styles.userName}>{user.name}</p>
                        <p className={styles.userEmail}>Email: {user.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            <div className={styles.deleteBox}>
              {deletingGroup ? (
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
                <button
                  className={styles.BtnProfile}
                  onClick={handleRemoveGroup}
                >
                  Delete Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBoxProfileModal;
