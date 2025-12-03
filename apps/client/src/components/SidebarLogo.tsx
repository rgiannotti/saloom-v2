import React from "react";
import { Path, Svg } from "react-native-svg";

import { FULL_LOGO, ICON_LOGO } from "../assets/logo";

interface SidebarLogoProps {
  collapsed?: boolean;
  theme?: "light" | "dark";
  widthOverride?: number;
  heightOverride?: number;
  customLogo?: string;
}

export const SidebarLogo = ({
  collapsed = false,
  theme = "light",
  widthOverride,
  heightOverride,
  customLogo
}: SidebarLogoProps) => {
  const isIcon = collapsed;

  if (customLogo) {
    const size = widthOverride ?? (isIcon ? 56 : 140);
    return (
      <img
        src={customLogo}
        alt="Logo"
        style={{
          width: size,
          objectFit: "contain"
        }}
      />
    );
  }

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
