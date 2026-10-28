import { Navigate } from "react-router-dom";
import { useChatContext } from "../context/ChatProvider";

/*

! Protect '/chats' when somebody directly reloads that URL :-

*  There is one more important case: the user is already on '/chats' and presses F5. 
*                                    React Router will render the chat route again, 
*                                    so that route must wait for authLoading too. 


*/

function RequireAuth({ children }) {
  const { user, authLoading } = useChatContext();

  if (authLoading) {
    return <div>Restoring your session...</div>;
  }

  if (!user?.id) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireAuth;
