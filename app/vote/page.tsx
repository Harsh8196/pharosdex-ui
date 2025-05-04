"use client"

import VoteComponent from "@/components/vote-component";

export default function VotePage() {
  // For demo, assume 100 veTOKEN voting power (replace with actual value from wallet store if available)
  const totalVotingPower = 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto">
        <VoteComponent totalVotingPower={totalVotingPower} />
      </div>
    </div>
  );
} 