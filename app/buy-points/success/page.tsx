// app/buy-points/success/page.tsx
import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-5">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
