"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedCounterProps {
  value: number;
  /** Format animated number (e.g. currency) */
  formatValue?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCounter({
  value,
  formatValue,
  prefix = "",
  suffix = "",
  duration = 0.45,
  className,
  style,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<number | null>(null);
  const firstRef = useRef(true);
  const tweenRef = useRef<ReturnType<typeof gsap.to> | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const fmt =
      formatValue ??
      ((n: number) => prefix + Math.round(n).toLocaleString("ru-RU") + suffix);

    if (firstRef.current) {
      firstRef.current = false;
      prevRef.current = value;
      ref.current.textContent = fmt(value);
      return;
    }

    const from = prevRef.current ?? value;
    prevRef.current = value;

    tweenRef.current?.kill();
    if (from === value) {
      ref.current.textContent = fmt(value);
      return;
    }

    const obj = { val: from };
    tweenRef.current = gsap.to(obj, {
      val: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = fmt(Math.round(obj.val));
        }
      },
      onComplete: () => {
        if (ref.current) ref.current.textContent = fmt(value);
      },
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [value, formatValue, prefix, suffix, duration]);

  return <span ref={ref} className={className} style={style} />;
}
