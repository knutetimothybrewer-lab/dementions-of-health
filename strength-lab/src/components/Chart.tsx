import { useEffect, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import { Download, Table2 } from "lucide-react";
import { useLab } from "./context";
import { csv, download } from "../data/db";
export default function Chart({
  option,
  rows,
  title,
  height = 270,
}: {
  option: EChartsOption;
  rows: Record<string, unknown>[];
  title: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null),
    instance = useRef<ECharts | null>(null);
  const { settings } = useLab();
  const [table, setTable] = useState(false);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    import("./chartEngine").then((lib) => {
      if (disposed || !ref.current) return;
      const chart = lib.init(ref.current);
      instance.current = chart;
      chart.setOption({
        backgroundColor: "transparent",
        color: ["#78d9c5", "#6399f8", "#d6ad70", "#b79bde"],
        textStyle: {
          fontFamily: "Arial",
          color: settings.theme === "dark" ? "#8796a6" : "#61707b",
        },
        animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        grid: { left: 56, right: 22, top: 35, bottom: 42 },
        tooltip: {
          trigger: "axis",
          backgroundColor: settings.theme === "dark" ? "#18232e" : "#ffffff",
          borderColor: "#425568",
          textStyle: {
            color: settings.theme === "dark" ? "#edf2f6" : "#18232e",
          },
        },
        ...option,
      });
      observer = new ResizeObserver(() => chart.resize());
      observer.observe(ref.current);
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      instance.current?.dispose();
      instance.current = null;
    };
  }, [option, settings.theme]);
  return (
    <div className="chart-wrap">
      <div
        ref={ref}
        style={{ height }}
        role="img"
        aria-label={`${title}. ${rows.length} observations. Accessible values in data table below.`}
      />
      <div className="chart-tools">
        <button onClick={() => setTable((v) => !v)}>
          <Table2 size={13} />
          {table ? "Hide" : "View"} data
        </button>
        <button
          onClick={() => download(title + ".csv", csv(rows), "text/csv")}
          disabled={!rows.length}
        >
          <Download size={13} />
          CSV
        </button>
        <button
          onClick={() => {
            const url = instance.current?.getDataURL({
              type: "png",
              pixelRatio: 2,
              backgroundColor:
                settings.theme === "dark" ? "#141f2a" : "#ffffff",
            });
            if (url) {
              const a = document.createElement("a");
              a.download = title + ".png";
              a.href = url;
              a.click();
            }
          }}
        >
          PNG
        </button>
      </div>
      {table && (
        <div className="table-wrap">
          <table>
            <caption>{title}</caption>
            <thead>
              <tr>
                {Object.keys(rows[0] || {}).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {Object.values(r).map((v, j) => (
                    <td key={j}>{v === null ? "—" : String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export function lineOption(
  labels: string[],
  series: { name: string; values: (number | null)[]; area?: boolean }[],
  yLabel: string,
): EChartsOption {
  return {
    legend: {
      top: 0,
      textStyle: { color: "#8796a6" },
      icon: "roundRect",
      itemWidth: 12,
      itemHeight: 3,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: "#33414f" } },
      axisTick: { show: false },
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: yLabel,
      nameTextStyle: { fontSize: 10 },
      splitLine: { lineStyle: { color: "#8796a61c" } },
      axisLabel: { fontSize: 10 },
    },
    series: series.map((s) => ({
      name: s.name,
      type: "line",
      data: s.values,
      symbol: "circle",
      symbolSize: 6,
      connectNulls: false,
      smooth: false,
      lineStyle: { width: 2 },
      areaStyle: s.area ? { opacity: 0.07 } : undefined,
    })),
  };
}
