import React from 'react';
import Svg, { Circle, G, Line, Path, Polyline, Rect } from 'react-native-svg';

import { colors } from '@/theme';

export type IconName =
  | 'home'
  | 'search'
  | 'library'
  | 'playlist'
  | 'profile'
  | 'play'
  | 'pause'
  | 'next'
  | 'prev'
  | 'shuffle'
  | 'repeat'
  | 'repeat-one'
  | 'heart'
  | 'more'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'close'
  | 'plus'
  | 'minus'
  | 'sliders'
  | 'settings'
  | 'music'
  | 'clock'
  | 'folder'
  | 'disc'
  | 'list'
  | 'trash'
  | 'logout'
  | 'edit'
  | 'external'
  | 'check'
  | 'volume'
  | 'youtube'
  | 'download'
  | 'refresh'
  | 'sparkles'
  | 'bell'
  | 'lock'
  | 'mail'
  | 'eye'
  | 'eye-off'
  | 'queue'
  | 'share'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'mic'
  | 'headphones'
  | 'wifi'
  | 'smartphone'
  | 'globe'
  | 'filter'
  | 'sort'
  | 'star'
  | 'info'
  | 'shield'
  | 'user'
  | 'grid'
  | 'waveform'
  | 'logo';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

const filledIcons: Partial<Record<IconName, (color: string) => React.ReactNode>> = {
  play: (color) => <Path d="M8 4.9v14.2c0 .8.9 1.3 1.6.9l11-7.1c.6-.4.6-1.4 0-1.8l-11-7.1c-.7-.4-1.6.1-1.6.9Z" fill={color} />,
  pause: (color) => (
    <G fill={color}>
      <Rect x="6" y="4" width="4" height="16" rx="1.6" />
      <Rect x="14" y="4" width="4" height="16" rx="1.6" />
    </G>
  ),
  prev: (color) => (
    <G fill={color}>
      <Path d="M18.5 5.3v13.4c0 .9-1 1.4-1.7.9l-9-6.7a1.1 1.1 0 0 1 0-1.8l9-6.7c.7-.5 1.7 0 1.7.9Z" />
      <Rect x="4" y="4.5" width="3" height="15" rx="1.4" />
    </G>
  ),
  next: (color) => (
    <G fill={color}>
      <Path d="M5.5 5.3v13.4c0 .9 1 1.4 1.7.9l9-6.7a1.1 1.1 0 0 0 0-1.8l-9-6.7c-.7-.5-1.7 0-1.7.9Z" />
      <Rect x="17" y="4.5" width="3" height="15" rx="1.4" />
    </G>
  ),
  heart: (color) => (
    <Path
      d="M12 20.6S3.4 15.5 3.4 9.3A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 8.6 3.3c0 6.2-8.6 11.3-8.6 11.3Z"
      fill={color}
    />
  ),
  star: (color) => (
    <Path
      d="m12 3.4 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z"
      fill={color}
    />
  ),
};

export function Icon({ name, size = 22, color = colors.text, strokeWidth = 1.8, filled }: IconProps) {
  const filledContent = filled || name === 'play' || name === 'pause' || name === 'next' || name === 'prev'
    ? filledIcons[name]?.(color)
    : null;

  if (filledContent) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {filledContent}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {renderIcon(name, color)}
      </G>
    </Svg>
  );
}

function renderIcon(name: IconName, color: string): React.ReactNode {
  switch (name) {
    case 'home':
      return (
        <>
          <Path d="M3.5 9.5 12 3l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6.5h-5V21h-5a1 1 0 0 1-1-1Z" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="7.2" />
          <Line x1="20.5" y1="20.5" x2="16.4" y2="16.4" />
        </>
      );
    case 'library':
      return (
        <>
          <Path d="M4 19.4A2.4 2.4 0 0 1 6.4 17H20" />
          <Path d="M6.4 2H20v20H6.4A2.4 2.4 0 0 1 4 19.6V4.4A2.4 2.4 0 0 1 6.4 2Z" />
          <Line x1="8" y1="7" x2="16" y2="7" />
        </>
      );
    case 'playlist':
      return (
        <>
          <Line x1="3.5" y1="6" x2="14" y2="6" />
          <Line x1="3.5" y1="11" x2="14" y2="11" />
          <Line x1="3.5" y1="16" x2="10" y2="16" />
          <Line x1="18" y1="11" x2="18" y2="19" />
          <Line x1="14.5" y1="15.5" x2="21.5" y2="15.5" />
        </>
      );
    case 'profile':
    case 'user':
      return (
        <>
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7.5" r="3.8" />
        </>
      );
    case 'shuffle':
      return (
        <>
          <Polyline points="16.5 3.5 21 8 16.5 12.5" />
          <Path d="M3 8h3.6c1.6 0 3 .8 3.9 2.1l3 4.3a4.6 4.6 0 0 0 3.9 2.1H21" />
          <Polyline points="16.5 15.5 21 20 16.5 24.5" />
          <Path d="M3 20h3.6c1.6 0 3-.8 3.9-2.1l.7-1" />
          <Path d="m14.2 9.2.3-.4A4.6 4.6 0 0 1 18.4 6.1H21" />
        </>
      );
    case 'repeat':
      return (
        <>
          <Polyline points="17 2.5 21 6.5 17 10.5" />
          <Path d="M3 11.5V10a3.5 3.5 0 0 1 3.5-3.5H21" />
          <Polyline points="7 21.5 3 17.5 7 13.5" />
          <Path d="M21 12.5V14a3.5 3.5 0 0 1-3.5 3.5H3" />
        </>
      );
    case 'repeat-one':
      return (
        <>
          <Polyline points="17 2.5 21 6.5 17 10.5" />
          <Path d="M3 11.5V10a3.5 3.5 0 0 1 3.5-3.5H21" />
          <Polyline points="7 21.5 3 17.5 7 13.5" />
          <Path d="M21 12.5V14a3.5 3.5 0 0 1-3.5 3.5H3" />
          <Path d="M12 9.5v5M11 10.4l1-.9" />
        </>
      );
    case 'more':
      return (
        <G fill={color} stroke="none">
          <Circle cx="5" cy="12" r="1.75" />
          <Circle cx="12" cy="12" r="1.75" />
          <Circle cx="19" cy="12" r="1.75" />
        </G>
      );
    case 'chevron-left':
      return <Polyline points="15 4.5 7.5 12 15 19.5" />;
    case 'chevron-right':
      return <Polyline points="9 4.5 16.5 12 9 19.5" />;
    case 'chevron-down':
      return <Polyline points="4.5 8.5 12 16 19.5 8.5" />;
    case 'chevron-up':
      return <Polyline points="4.5 15.5 12 8 19.5 15.5" />;
    case 'arrow-left':
      return (
        <>
          <Line x1="20" y1="12" x2="4" y2="12" />
          <Polyline points="10 6 4 12 10 18" />
        </>
      );
    case 'arrow-right':
      return (
        <>
          <Line x1="4" y1="12" x2="20" y2="12" />
          <Polyline points="14 6 20 12 14 18" />
        </>
      );
    case 'arrow-up-right':
      return (
        <>
          <Line x1="6.5" y1="17.5" x2="17.5" y2="6.5" />
          <Polyline points="8.5 6.5 17.5 6.5 17.5 15.5" />
        </>
      );
    case 'close':
      return (
        <>
          <Line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
          <Line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
        </>
      );
    case 'plus':
      return (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </>
      );
    case 'minus':
      return <Line x1="5" y1="12" x2="19" y2="12" />;
    case 'sliders':
      return (
        <>
          <Line x1="4" y1="7" x2="20" y2="7" />
          <Line x1="4" y1="17" x2="20" y2="17" />
          <Circle cx="9" cy="7" r="2.2" fill={colors.background} />
          <Circle cx="15" cy="17" r="2.2" fill={colors.background} />
        </>
      );
    case 'settings':
      return (
        <>
          <Circle cx="12" cy="12" r="3.2" />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </>
      );
    case 'music':
      return (
        <>
          <Path d="M9 18V5.5l11-2V16" />
          <Circle cx="6" cy="18" r="3" />
          <Circle cx="17" cy="16" r="3" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Polyline points="12 7.5 12 12 15.5 14" />
        </>
      );
    case 'folder':
      return (
        <Path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18Z" />
      );
    case 'disc':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Circle cx="12" cy="12" r="2.4" />
        </>
      );
    case 'list':
    case 'queue':
      return (
        <>
          <Line x1="4" y1="6" x2="20" y2="6" />
          <Line x1="4" y1="11.5" x2="20" y2="11.5" />
          <Line x1="4" y1="17" x2="14" y2="17" />
        </>
      );
    case 'trash':
      return (
        <>
          <Polyline points="4 6.5 20 6.5" />
          <Path d="M8.5 6.5V4.8A1.3 1.3 0 0 1 9.8 3.5h4.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
          <Path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
        </>
      );
    case 'logout':
      return (
        <>
          <Path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
          <Polyline points="16 16.5 20.5 12 16 7.5" />
          <Line x1="20" y1="12" x2="9" y2="12" />
        </>
      );
    case 'edit':
      return (
        <>
          <Path d="M12 20h9" />
          <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4.5 1.5L5 15Z" />
        </>
      );
    case 'external':
      return (
        <>
          <Path d="M18 13v5.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H11" />
          <Polyline points="15 3.5 20.5 3.5 20.5 9" />
          <Line x1="10" y1="14" x2="20.5" y2="3.5" />
        </>
      );
    case 'check':
      return <Polyline points="4.5 12.5 9.5 17.5 20 6.5" />;
    case 'volume':
      return (
        <>
          <Path d="M11 5 6.5 8.8H3v6.4h3.5L11 19Z" />
          <Path d="M15.2 8.8a4.5 4.5 0 0 1 0 6.4" />
          <Path d="M18 6a8.5 8.5 0 0 1 0 12" />
        </>
      );
    case 'youtube':
      return (
        <>
          <Rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <Path d="m10 9.2 5 2.8-5 2.8Z" fill={color} stroke="none" />
        </>
      );
    case 'download':
      return (
        <>
          <Path d="M12 3.5v11" />
          <Polyline points="7.5 10 12 14.5 16.5 10" />
          <Path d="M4.5 17.5v1.5A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
        </>
      );
    case 'refresh':
      return (
        <>
          <Polyline points="20 4.5 20 10 14.5 10" />
          <Path d="M19.2 15a8 8 0 1 1-1.7-8.5L20 9" />
        </>
      );
    case 'sparkles':
      return (
        <>
          <Path d="M12 3.5 13.7 8l4.5 1.7-4.5 1.7L12 16l-1.7-4.6L5.8 9.7 10.3 8Z" />
          <Path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M18 8.6a6 6 0 0 0-12 0c0 6-2.5 7.4-2.5 7.4h17S18 14.6 18 8.6" />
          <Path d="M10.3 20a2 2 0 0 0 3.4 0" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x="4.5" y="10" width="15" height="10.5" rx="2.2" />
          <Path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
        </>
      );
    case 'mail':
      return (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="2.2" />
          <Polyline points="3.5 6.5 12 13 20.5 6.5" />
        </>
      );
    case 'eye':
      return (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <Circle cx="12" cy="12" r="2.8" />
        </>
      );
    case 'eye-off':
      return (
        <>
          <Path d="M3 3l18 18" />
          <Path d="M10.6 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.3 4" />
          <Path d="M6.6 7.4A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.2-1" />
        </>
      );
    case 'share':
      return (
        <>
          <Circle cx="17.5" cy="5.5" r="2.7" />
          <Circle cx="6.5" cy="12" r="2.7" />
          <Circle cx="17.5" cy="18.5" r="2.7" />
          <Line x1="8.9" y1="10.7" x2="15.1" y2="6.8" />
          <Line x1="8.9" y1="13.3" x2="15.1" y2="17.2" />
        </>
      );
    case 'mic':
      return (
        <>
          <Rect x="9" y="2.5" width="6" height="11" rx="3" />
          <Path d="M5.5 10.5a6.5 6.5 0 0 0 13 0" />
          <Line x1="12" y1="17" x2="12" y2="21" />
        </>
      );
    case 'headphones':
      return (
        <>
          <Path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <Rect x="2.5" y="13.5" width="4" height="7" rx="2" />
          <Rect x="17.5" y="13.5" width="4" height="7" rx="2" />
        </>
      );
    case 'wifi':
      return (
        <>
          <Path d="M2.5 8.5a14 14 0 0 1 19 0" />
          <Path d="M5.5 12a9.5 9.5 0 0 1 13 0" />
          <Path d="M8.5 15.4a5 5 0 0 1 7 0" />
          <Circle cx="12" cy="19" r="1.2" fill={color} />
        </>
      );
    case 'smartphone':
      return (
        <>
          <Rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <Line x1="10.5" y1="18.5" x2="13.5" y2="18.5" />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Line x1="3.5" y1="12" x2="20.5" y2="12" />
          <Path d="M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17Z" />
        </>
      );
    case 'filter':
      return <Path d="M4 5h16l-6.2 7.3V19l-3.6 1.5v-8.2Z" />;
    case 'sort':
      return (
        <>
          <Line x1="4" y1="7" x2="14" y2="7" />
          <Line x1="4" y1="12" x2="11" y2="12" />
          <Line x1="4" y1="17" x2="8" y2="17" />
          <Polyline points="17 7 20 4 23 7" />
          <Line x1="20" y1="4" x2="20" y2="20" />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Line x1="12" y1="11" x2="12" y2="16.5" />
          <Circle cx="12" cy="7.8" r="0.9" fill={color} />
        </>
      );
    case 'shield':
      return (
        <Path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6Z" />
      );
    case 'grid':
      return (
        <G fill={color} stroke="none">
          <Rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <Rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <Rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <Rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </G>
      );
    case 'waveform':
      return (
        <G stroke={color} strokeWidth={2.2} strokeLinecap="round">
          <Line x1="3" y1="10" x2="3" y2="14" />
          <Line x1="7.5" y1="6" x2="7.5" y2="18" />
          <Line x1="12" y1="3" x2="12" y2="21" />
          <Line x1="16.5" y1="6" x2="16.5" y2="18" />
          <Line x1="21" y1="10" x2="21" y2="14" />
        </G>
      );
    case 'logo':
      return (
        <>
          <Path d="M4 16V8l4 8V8" />
          <Path d="M11 16V8" />
          <Path d="M11 12h3.5" />
          <Path d="M11 8l5.5 8V8" />
          <Path d="M20 8v6.5a2.5 2.5 0 0 1-5 0" />
        </>
      );
    default:
      return <Circle cx="12" cy="12" r="8.5" />;
  }
}
