import LogsClient from "@/components/vanta/LogsClient";
import { getRecentSessions } from "@/app/session/actions";

export const metadata = {
  title: "Recent Sessions",
  description: "Review your recent sessions and outcomes.",
};

export default async function LogsPage() {
  const initialRows = await getRecentSessions("op_legacy", 50);
  return (
    <LogsClient
      initialRows={initialRows}
      operatorId="op_legacy"
      initialLimit={50}
    />
  );
}


