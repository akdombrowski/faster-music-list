"use client";

import { random } from "@/lib/utils";
import { useMemo } from "react";

export default function OverviewStats() {
  const data = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return [
      ...months.map((month) => ({
        "Month": `${month} 23`,
        "Total Visitors": random(20000, 170418),
      })),
      {
        "Month": "Jul 23",
        "Total Visitors": 170418,
      },
    ];
  }, []);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
    </div>
  );
}
