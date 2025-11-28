import React from "react";
import { Path, Svg } from "react-native-svg";

import { FULL_LOGO, ICON_LOGO } from "../assets/logo";

interface SidebarLogoProps {
  collapsed?: boolean;
  theme?: "light" | "dark";
  widthOverride?: number;
  heightOverride?: number;
}

export const SidebarLogo = ({
  collapsed = false,
  theme = "light",
  widthOverride,
  heightOverride
}: SidebarLogoProps) => {
  const isIcon = collapsed;
  const color = theme === "dark" ? "#f3f2f1" : "#ff3636";
  const data = isIcon ? ICON_LOGO : FULL_LOGO;
  const width = widthOverride ?? (isIcon ? 56 : 140);
  const height = heightOverride ?? (isIcon ? 56 : 36);

  return (
    <Svg width={width} height={height} viewBox={data.viewBox} preserveAspectRatio="xMidYMid meet">
      <Path d={data.path} fill={color} />
    </Svg>
  );
};
