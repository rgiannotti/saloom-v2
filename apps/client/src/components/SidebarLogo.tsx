import React from "react";
import { Path, Svg } from "react-native-svg";

import { FULL_LOGO, ICON_LOGO } from "../assets/logo";

interface SidebarLogoProps {
  collapsed?: boolean;
  theme?: "light" | "dark";
}

export const SidebarLogo = ({ collapsed = false, theme = "light" }: SidebarLogoProps) => {
  const isIcon = collapsed;
  const color = theme === "dark" ? "#f3f2f1" : "#ff3636";
  const data = isIcon ? ICON_LOGO : FULL_LOGO;

  return (
    <Svg
      width={isIcon ? 56 : 140}
      height={isIcon ? 56 : 36}
      viewBox={data.viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      <Path d={data.path} fill={color} />
    </Svg>
  );
};
