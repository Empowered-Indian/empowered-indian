import { Svg, Path, Circle } from "@react-pdf/renderer";

export const PaymentIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"
      fill="#007AFF"
    />
    <Circle cx="8" cy="10" r="1" fill="#34C759" />
    <Circle cx="12" cy="10" r="1" fill="#34C759" />
    <Circle cx="16" cy="10" r="1" fill="#34C759" />
  </Svg>
);

export const CompletedWorkIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      fill="#30D158"
    />
    <Path
      d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"
      fill="#30D158"
      opacity="0.3"
    />
  </Svg>
);

export const RecommendedWorkIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="#FF9500"
    />
    <Path
      d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"
      fill="#FF9500"
      opacity="0.3"
    />
  </Svg>
);

export const ChartIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
      fill="#FF3B30"
    />
  </Svg>
);

export const MPIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      fill="#007AFF"
    />
  </Svg>
);
