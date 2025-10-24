"use client";

import React from "react";
import { HeroUIProvider } from "@heroui/react";

interface HeroUIProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps the HeroUIProvider with your app-wide configuration.
 * Useful for global themes, localization, or global context.
 */
export function HeroUIProviderWrapper({ children }: HeroUIProviderWrapperProps) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}
