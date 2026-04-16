import LogsClient from "@/components/vanta/LogsClient";

export const metadata = {
  title: "Recent Sessions",
  description: "Review your recent sessions and outcomes.",
};

export default function LogsPage() {
  return (
    <LogsClient
      initialRows={[]}
      initialLimit={50}
    />
  );
}


