declare module 'echarts/extension/dataTool/prepareBoxplotData.js' {
  export default function prepareBoxplotData(values: number[][]): {
    boxData: [number, number, number, number, number][];
    outliers: [number, number][];
    axisData: string[];
  };
}
