import { useState, useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 0.8,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const springValue = useSpring(0, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });
  
  const displayValue = useTransform(springValue, (v) => {
    if (decimals > 0) {
      return `${prefix}${v.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(v)}${suffix}`;
  });
  
  const [displayString, setDisplayString] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (v) => {
      setDisplayString(v);
    });
    return () => unsubscribe();
  }, [displayValue]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.3 }}
      key={value}
    >
      {displayString}
    </motion.span>
  );
}

interface AnimatedDollarCounterProps {
  value: number;
  className?: string;
}

export function AnimatedDollarCounter({ value, className = "" }: AnimatedDollarCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      prefix="$"
      decimals={2}
      className={className}
    />
  );
}

interface AnimatedPercentCounterProps {
  value: number;
  className?: string;
}

export function AnimatedPercentCounter({ value, className = "" }: AnimatedPercentCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      suffix="%"
      decimals={1}
      className={className}
    />
  );
}
