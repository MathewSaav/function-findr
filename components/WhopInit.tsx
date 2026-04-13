"use client";
import { useEffect } from "react";
import { getWhopSdk } from "@/lib/whop";

export default function WhopInit() {
  useEffect(() => {
    getWhopSdk();
  }, []);
  return null;
}
