"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type AxisBootScreenProps = {
  onFinish?: () => void;
};

const FADE_IN_MS = 700;
const HOLD_MS = 1600;
const FADE_OUT_MS = 700;

export default function AxisBootScreen({ onFinish }: AxisBootScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [isVisible, setIsVisible] = useState(true);
  const finishCalled = useRef(false);

  useEffect(() => {
    const fadeInTimer = window.setTimeout(() => {
      setPhase("hold");
    }, FADE_IN_MS);

    const fadeOutTimer = window.setTimeout(() => {
      setPhase("exit");
    }, FADE_IN_MS + HOLD_MS);

    const finishTimer = window.setTimeout(() => {
      setIsVisible(false);
      if (!finishCalled.current) {
        finishCalled.current = true;
        onFinish?.();
      }
    }, FADE_IN_MS + HOLD_MS + FADE_OUT_MS);

    return () => {
      window.clearTimeout(fadeInTimer);
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  const isExiting = phase === "exit";
  const logoActive = phase !== "enter";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`transition-all duration-700 ${
          logoActive ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${isExiting ? "scale-[0.985] opacity-0" : ""}`}
      >
        <Image
          src="/axis-logo.png"
          alt="AXIS"
          width={900}
          height={900}
          priority
          className="h-auto w-[70vw] max-w-[720px]"
        />
      </div>
    </div>
  );
}
