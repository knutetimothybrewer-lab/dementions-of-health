import type { ECharts, EChartsOption } from "echarts";
import { Download, Table2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { csv, download } from "../data/db";
import { useLab } from "./context";
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
      const recolor = (value: unknown): unknown => {
        const colors: Record<string, string> = {
          "#8796a6": settings.theme === "dark" ? "#b1bac6" : "#536174",
          "#33414f": settings.theme === "dark" ? "#354865" : "#c8cdc6",
          "#8796a61c": settings.theme === "dark" ? "#b1bac626" : "#53617426",
          "#659df7": settings.theme === "dark" ? "#8fa6c6" : "#1f3a63",
          "#78d9c5": "#d8ddd6",
          "#263746": "#1f3a63",
        };
        if (typeof value === "string") return colors[value] || value;
        if (Array.isArray(value)) return value.map(recolor);
        if (value && typeof value === "object")
          return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, recolor(item)]),
          );
        return value;
      };
      chart.setOption({
        backgroundColor: "transparent",
        color:
          settings.theme === "dark"
            ? ["#d8ddd6", "#8fa6c6", "#b1bac6", "#ffffff"]
            : ["#1f3a63", "#657b99", "#90998c", "#384454"],
        textStyle: {
          fontFamily: "Arial",
          color: settings.theme === "dark" ? "#b1bac6" : "#536174",
        },
        animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        grid: { left: 56, right: 22, top: 35, bottom: 42 },
        tooltip: {
          trigger: "axis",
          backgroundColor: settings.theme === "dark" ? "#213451" : "#ffffff",
          borderColor: "#6e829f",
          textStyle: {
            color: settings.theme === "dark" ? "#f5f5f0" : "#1f3a63",
          },
        },
        ...(recolor(option) as EChartsOption),
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
                settings.theme === "dark" ? "#18263d" : "#ffffff",
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
