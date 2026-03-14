export interface ActualDataPoint {
  startTime: string;
  generation: number;
}

export interface ForecastDataPoint {
  startTime: string;
  generation: number;
  publishTime: string;
}

export interface ChartDataPoint {
  time: string;
  displayTime: string;
  actual: number | null;
  forecast: number | null;
}

export interface ErrorStats {
  mae: number;
  rmse: number;
  mape: number;
  maxError: number;
  count: number;
  totalPoints: number;
}
