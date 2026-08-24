import type { CSSProperties, ElementType, ReactNode } from "react";
import "./StarBorder.css";

export interface StarBorderProps {
  as?: ElementType;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children: ReactNode;
  style?: CSSProperties;
  [key: string]: unknown;
}

const StarBorder = ({
  as: Component = "div",
  className = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps) => {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...style,
      }}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
        aria-hidden="true"
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
        aria-hidden="true"
      />
      <div className="inner-content">{children}</div>
    </Component>
  );
};

export default StarBorder;
