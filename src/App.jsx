/* 
~ Setting up the vite:-

  1] npm i --> install all the npm packages 

  2] Use the snippet rfc.

  3] npm install vite-plugin-eslint --save-dev

  4] Add these two lines of code in rules: {...} of .eslintrc.cjs file, to show yellow underline instead of red:
     'no-unused-vars': 'warn',
     'react/prop-types': 'off', 

~ Vite setup:- 
  
  ✅ Environment Variable Behavior

     Command	         Environment file loaded
     npm run dev	     .env, .env.development
     npm run build	   .env, .env.production
     npm run preview	 .env, .env.production

*/

// import { Button } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";

import ChatProvider from "./context/ChatProvider";
import AppLayout from "./components/AppLayout";
import OAuthSuccess from "./components/Auth/OAuthSuccess";
import RequireAuth from "./pages/RequireAuth";

function App() {
  console.log("App component");
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <ChatProvider>
                <AppLayout />
              </ChatProvider>
            }
          >
            <Route path="/" index element={<HomePage />} />
            {/* <Route path="/chats" element={<ChatPage />} /> */}
            <Route
              path="/chats"
              element={
                <RequireAuth>
                  <ChatPage />
                </RequireAuth>
              }
            />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
