"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function MouseGlow() {
  const mouseX = useSpring(0, { damping: 20, stiffness: 150 });
  const mouseY = useSpring(0, { damping: 20, stiffness: 150 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="mouse-glow"
      style={{
        x: mouseX,
        y: mouseY,
      }}
    />
  );
}
