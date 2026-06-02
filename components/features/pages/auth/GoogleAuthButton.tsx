"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

type GoogleAuthButtonProps = {
  onSuccess: (response: CredentialResponse) => void;
  onError: () => void;
};

const DEFAULT_BUTTON_WIDTH = 360;

const GoogleAuthButton = ({ onSuccess, onError }: GoogleAuthButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(DEFAULT_BUTTON_WIDTH);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.max(Math.floor(node.getBoundingClientRect().width), 200);
      setButtonWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full [&>div]:!w-full [&_iframe]:!w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width={buttonWidth}
      />
    </div>
  );
};

export { GoogleAuthButton };
