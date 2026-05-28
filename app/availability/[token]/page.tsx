import { prisma } from "@/lib/db";
import { AvailabilityRespondClient } from "./AvailabilityRespondClient";

export default async function AvailabilityPage({
  params,
}: {
  params: { token: string };
}) {
  const request = await prisma.availabilityRequest.findUnique({
    where: { token: params.token },
    include: { job: true },
  });

  if (!request || request.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <p className="text-muted-foreground">This availability request has expired or is invalid.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <AvailabilityRespondClient
        token={params.token}
        job={request.job}
        requiredSkills={request.requiredSkills}
        message={request.message}
      />
    </div>
  );
}
