"use client";

import Link from "next/link";

export const AppLogo = () => (
  <Link href="/" className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        {/* Top Left Section */}
        <polygon points="16,6 21,9 16,16 11,9" fill="#f5e9c9" />
        {/* Top Right Section */}
        <polygon points="21,9 26,12 16,16 16,16" fill="#ff759a" />
        {/* Bottom Right Section */}
        <polygon points="26,12 26,22 16,28 16,16" fill="#b43666" />
        {/* Bottom Left Section */}
        <polygon points="16,16 16,28 6,22 6,12" fill="#f5e9c9" />
        {/* Center Circle */}
        <circle cx="16" cy="16" r="4" fill="white" />
      </svg>
    </span>
    <h2 className="font-mono text-xl font-bold tracking-wide text-black dark:text-white">
      Gradio
    </h2>
  </Link>
);
