import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-screen grid place-items-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-gray-600">페이지 준비 중…</p>
      </div>
    </div>
  );
}
