/**
 * 공통 상수 모음
 * - 프론트 전역에서 재사용되는 API URL, 엔드포인트, 선택 옵션 등을 제공합니다.
 * - 환경 변수: NEXT_PUBLIC_API_BASE_URL (예: http://localhost:8000)
 */
export const API_BASE_URL =  "https://7bb49888d546.ngrok-free.app"

// 백엔드 엔드포인트
export const ENDPOINTS = {
  COMPRESS: "/compress",
  AUTO_BATCH_COMPRESS: "/auto-batch-compress",
  RESTORE: "/restore",
  BATCH_RESTORE: "/batch-restore",
} as const

// 다운스케일 배율 옵션
export const SCALER_OPTIONS = [
  { value: "2", label: "2배" },
  { value: "3", label: "3배" },
  { value: "4", label: "4배" },
] as const

// 복원(업스케일) 방식 옵션
export const MRS3_MODE_OPTIONS = [
  { value: "-1", label: "EDSR (고품질 AI 업스케일)", description: "AI 기반 고품질 업스케일링" },
  { value: "0", label: "OpenCV", description: "빠른 처리 속도" },
] as const
