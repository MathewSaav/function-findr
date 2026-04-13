"use client";
import { useEffect } from "react";
import { getWhopSdk, getWhopContext } from "@/lib/whop";

export default function WhopInit() {
  useEffect(() => {
    getWhopSdk().then((s) => {
      if (!s) return;
      getWhopContext().then((ctx) => {
        if (ctx) {
          console.log("[Findr] Running inside Whop:", ctx.viewType, ctx.experienceId);
        }
      });
    });
  }, []);
  return null;
}
