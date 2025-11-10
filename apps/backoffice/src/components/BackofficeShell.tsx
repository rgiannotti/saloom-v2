import React from "react";
import { Outlet } from "react-router-dom";

import { DashboardLayout } from "./DashboardLayout";

export const BackofficeShell = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};
