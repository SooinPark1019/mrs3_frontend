/**
 * 기하 타입 모음 (프론트 전역 공유)
 */
export interface Point {
  x: number
  y: number
}

export type Polygon = Point[]
export type Polygons = Polygon[]