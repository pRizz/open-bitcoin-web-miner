import React from "react";
import { useParams } from "react-router-dom";
import { SubmissionDetails } from "@/components/submission/SubmissionDetails";

export default function SubmissionPage() {
  const { hash } = useParams<{ hash: string }>();

  if (!hash) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">Invalid submission hash</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <SubmissionDetails hash={hash} />
    </div>
  );
}