import { useChatContext } from "../context/ChatProvider";
import ProfilePicChange from "./miscellaneous/ProfilePicChange";
import styles from "./ProfileModal.module.css";
import { useState } from "react";

function ProfileModal({ onClose }) {
  const { user } = useChatContext();

  const [profilePicChangeModal, setShowProfilePicChangeModal] = useState(false);

  let loggedUser =
    Object.keys(user || {}).length === 0
      ? JSON.parse(localStorage.getItem("userInfo"))
      : user;

  // console.log("ProfileModal", loggedUser?.pic);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={() => onClose(false)}>
          &times;
        </button>
        <h1 className={styles.profileName}>{loggedUser.name}</h1>
        <div className={styles.modalBody}>
          <img
            src={loggedUser.pic}
            alt={`${loggedUser.name}'s profile`}
            className={styles.profilePic}
          />
          <h2 className={styles.Emailheader}>Email:</h2>
          <h2 className={styles.userEmail}>{loggedUser.email}</h2>
          <button
            onClick={() => setShowProfilePicChangeModal((prev) => !prev)}
            className={styles.profileChangeBtn}
          >
            Change the profile pic
          </button>
          {profilePicChangeModal ? (
            <ProfilePicChange onCloseModal={setShowProfilePicChangeModal} />
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
