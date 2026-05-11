import { FunnelBody } from "@/components/funnel/funnel-body";

export default function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FunnelBody>{children}</FunnelBody>;
}
