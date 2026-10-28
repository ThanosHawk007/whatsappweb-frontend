import { Outlet } from "react-router-dom";

function AppLayout() {
  console.log("AppLayout");
  return (
    <>
      <Outlet />
    </>
  );
}

export default AppLayout;
