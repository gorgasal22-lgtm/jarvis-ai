'use client';

interface Props {
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function GeorgianFlag({ width, height, className, style }: Props) {
  return (
    <div
      className={`flag3d${className ? ' ' + className : ''}`}
      style={{ width, height, ...style }}
    >
      <div className="cloth">
        <svg viewBox="0 0 30 20" preserveAspectRatio="none">
          <rect width="30" height="20" fill="#fff" />
          <rect x="12.6" width="4.8" height="20" fill="#c8102e" />
          <rect y="7.6" width="30" height="4.8" fill="#c8102e" />
          <g fill="#c8102e">
            <g transform="translate(6.3,3.8) scale(.3) translate(-6,-6)">
              <rect x="5" width="2" height="12" /><rect y="5" width="12" height="2" />
              <rect x="3" width="6" height="2" /><rect x="3" y="10" width="6" height="2" />
              <rect y="3" width="2" height="6" /><rect x="10" y="3" width="2" height="6" />
            </g>
            <g transform="translate(23.7,3.8) scale(.3) translate(-6,-6)">
              <rect x="5" width="2" height="12" /><rect y="5" width="12" height="2" />
              <rect x="3" width="6" height="2" /><rect x="3" y="10" width="6" height="2" />
              <rect y="3" width="2" height="6" /><rect x="10" y="3" width="2" height="6" />
            </g>
            <g transform="translate(6.3,16.2) scale(.3) translate(-6,-6)">
              <rect x="5" width="2" height="12" /><rect y="5" width="12" height="2" />
              <rect x="3" width="6" height="2" /><rect x="3" y="10" width="6" height="2" />
              <rect y="3" width="2" height="6" /><rect x="10" y="3" width="2" height="6" />
            </g>
            <g transform="translate(23.7,16.2) scale(.3) translate(-6,-6)">
              <rect x="5" width="2" height="12" /><rect y="5" width="12" height="2" />
              <rect x="3" width="6" height="2" /><rect x="3" y="10" width="6" height="2" />
              <rect y="3" width="2" height="6" /><rect x="10" y="3" width="2" height="6" />
            </g>
          </g>
        </svg>
        <div className="fold-shade" />
        <div className="sheen" />
      </div>
    </div>
  );
}
