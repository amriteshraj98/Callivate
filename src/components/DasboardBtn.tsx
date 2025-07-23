"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { SparklesIcon } from "lucide-react";


function DasboardBtn() {
   const isCandidate = false; // Replace with actual logic to determine if the user is a candidate
  const isInterviewer = false; // Replace with actual loading state if applicable
  if (isCandidate ) return null;

  return (
    <Link href={"/dashboard"}>
      <Button className="gap-2 font-medium" size={"sm"}>
        <SparklesIcon className="size-4" />
        Dashboard
      </Button>
    </Link>
  );
}
export default DasboardBtn;