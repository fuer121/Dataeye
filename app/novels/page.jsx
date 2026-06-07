import { Suspense } from "react";

import NovelsClient from "@/components/NovelsClient";

export default function NovelsPage() {
  return (
    <Suspense fallback={null}>
      <NovelsClient />
    </Suspense>
  );
}
