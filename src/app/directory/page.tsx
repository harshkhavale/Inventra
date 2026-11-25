import type { Metadata } from "next";
import { DirectoryView } from "@/components/directory/directory-view";

export const metadata: Metadata = { title: "Customers & suppliers" };

export default function DirectoryPage() {
  return <DirectoryView />;
}
