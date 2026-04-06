import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  Brush,
  LineChart,
  Line,
} from "recharts";
import { MetricsService, MetricsData } from "../services/metricsService";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { DashboardService } from "../services/dashboardService";

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-2">
          {label}
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Avg Latency
            </span>
            <span className="text-xs font-black text-white">
              {data.latency.toFixed(1)}ms
            </span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              System Uptime
            </span>
            <span className="text-xs font-black text-emerald-400">
              {data.uptime.toFixed(3)}%
            </span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Critical Errors
            </span>
            <span
              className={`text-xs font-black ${data.errors > 8 ? "text-rose-400" : "text-slate-200"}`}
            >
              {data.errors}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.value / total) * 100).toFixed(1);

    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: data.color }}
          ></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {data.name}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-[11px] text-slate-400 font-bold">
              Total Events
            </span>
            <span className="text-xs font-black text-white">{data.value}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[11px] text-slate-400 font-bold">
              Contribution
            </span>
            <span className="text-xs font-black text-indigo-400">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const used = payload.find((p: any) => p.dataKey === "used")?.value || 0;
    const wasted = payload.find((p: any) => p.dataKey === "wasted")?.value || 0;
    const efficiency = ((used / (used + wasted)) * 100).toFixed(1);

    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-700 pb-2">
          {label}
        </p>
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">
                Utilized
              </span>
            </div>
            <span className="text-xs font-black text-white">{used}%</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">
                Wasted
              </span>
            </div>
            <span className="text-xs font-black text-rose-400">{wasted}%</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-black uppercase">
              Core Efficiency
            </span>
            <span className="text-sm font-black text-indigo-400">
              {efficiency}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d" | "custom">(
    "7d",
  );
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [resourceData, setResourceData] = useState<any[]>([]);
  const [errorData, setErrorData] = useState<any[]>([]);
  const [errorTrendData, setErrorTrendData] = useState<any[]>([]);

  const [currentMetrics, setCurrentMetrics] = useState<MetricsData | null>(
    null,
  );
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "xlsx" | "json">("pdf");

  const fetchAnalytics = async () => {
    const result = await DashboardService.getAnalytics(dateRange);
    if (result.success && result.data) {
      setPerformanceData(result.data.performanceData);
      setResourceData(result.data.regionalData);
      setErrorData(result.data.errorData);
    }
    
    const logsResult = await DashboardService.getLogs();
    if (logsResult.success && logsResult.data) {
        const errorLogs = logsResult.data.filter((l: any) => l.level === 'ERROR');
        const grouped: Record<string, number> = {};
        errorLogs.forEach((l: any) => {
            const d = new Date(l.time);
            const key = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
            grouped[key] = (grouped[key] || 0) + 1;
        });
        const trend = Object.keys(grouped).map(k => ({ time: k, errors: grouped[k] }));
        setErrorTrendData(trend.reverse()); // Reverse to chronological order assuming logs are newest first
    }
  };

  React.useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics (including logs) every 30s
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchLatestMetrics = async () => {
    const result = await MetricsService.getMetrics();
    if (result.success && result.data) {
      setCurrentMetrics(result.data);
      // Update the last entry in performance data with live metrics
      setPerformanceData((prev) => {
        const newData = [...prev];
        const lastIdx = newData.length - 1;
        newData[lastIdx] = {
          ...newData[lastIdx],
          uptime:
            result.data!.systemDowntime > 0
              ? 100 - result.data!.systemDowntime
              : 99.99,
          latency: 35 + result.data!.errorRate * 5, // Simulated latency mapping
          errors: Math.floor(result.data!.errorRate * 10),
        };
        return newData;
      });
    }
  };

  React.useEffect(() => {
    fetchLatestMetrics();
    const interval = setInterval(fetchLatestMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredPerformanceData = useMemo(() => {
    if (dateRange === "custom") {
      const startTs = new Date(customStart).getTime();
      const endTs = new Date(customEnd).getTime();
      return performanceData.filter(
        (d) => d.timestamp >= startTs && d.timestamp <= endTs,
      );
    }
    const sliceCount = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
    return performanceData.slice(-sliceCount);
  }, [dateRange, customStart, customEnd, performanceData]);

  const filteredResourceData = useMemo(() => {
    return resourceData;
  }, [resourceData]);

  const filteredErrorData = useMemo(() => {
    return errorData;
  }, [errorData]);

  const errorTotal = useMemo(() => {
    return filteredErrorData.reduce((acc, item) => acc + item.value, 0);
  }, [filteredErrorData]);

  const handleExport = () => {
    if (exportFormat === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Analytics Report - ${dateRange}`, 14, 15);
      
      doc.setFontSize(12);
      doc.text("Performance Data", 14, 25);
      autoTable(doc, {
        startY: 30,
        head: [['Day', 'Uptime (%)', 'Latency (ms)', 'Errors']],
        body: filteredPerformanceData.map(d => [d.day, d.uptime.toFixed(3), d.latency.toFixed(1), d.errors]),
      });

      const finalY1 = (doc as any).lastAutoTable.finalY || 30;
      doc.text("Resource Allocation", 14, finalY1 + 10);
      autoTable(doc, {
        startY: finalY1 + 15,
        head: [['Region', 'Utilized (%)', 'Wasted (%)']],
        body: filteredResourceData.map(d => [d.name, d.used, d.wasted]),
      });

      const finalY2 = (doc as any).lastAutoTable.finalY || finalY1 + 15;
      doc.text("Incident Taxonomy", 14, finalY2 + 10);
      autoTable(doc, {
        startY: finalY2 + 15,
        head: [['Error Type', 'Events']],
        body: filteredErrorData.map(d => [d.name, d.value]),
      });

      doc.save(`analytics_report_${dateRange}.pdf`);
    } else if (exportFormat === "xlsx") {
      const wb = XLSX.utils.book_new();
      
      const perfSheetData = [
        ['Day', 'Uptime (%)', 'Latency (ms)', 'Errors'],
        ...filteredPerformanceData.map(d => [d.day, d.uptime, d.latency, d.errors])
      ];
      const perfWs = XLSX.utils.aoa_to_sheet(perfSheetData);
      XLSX.utils.book_append_sheet(wb, perfWs, "Performance Data");

      const resourceSheetData = [
        ['Region', 'Utilized (%)', 'Wasted (%)'],
        ...filteredResourceData.map(d => [d.name, d.used, d.wasted])
      ];
      const resWs = XLSX.utils.aoa_to_sheet(resourceSheetData);
      XLSX.utils.book_append_sheet(wb, resWs, "Resources");

      const errorSheetData = [
        ['Error Type', 'Events'],
        ...filteredErrorData.map(d => [d.name, d.value])
      ];
      const errWs = XLSX.utils.aoa_to_sheet(errorSheetData);
      XLSX.utils.book_append_sheet(wb, errWs, "Incidents");

      XLSX.writeFile(wb, `analytics_report_${dateRange}.xlsx`);
    } else if (exportFormat === "json") {
      const exportData = {
        dateRange,
        performance: filteredPerformanceData,
        resources: filteredResourceData,
        errors: filteredErrorData
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `analytics_report_${dateRange}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  const handleRecalculate = () => {
    setIsRecalculating(true);
    // Simulate model recalculation
    setTimeout(() => {
      fetchLatestMetrics();
      setIsRecalculating(false);
    }, 1500);
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Predictive Analytics
          </h1>
          <p className="text-slate-400 text-sm">
            Advanced telemetry analysis and operational forecasting.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Custom Date Inputs */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 p-1.5 rounded-2xl animate-in zoom-in-95 duration-300">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-slate-300 outline-none px-2 py-1 border border-slate-700/50 rounded-lg focus:border-indigo-500 transition-colors cursor-pointer"
              />
              <span className="text-[10px] font-black text-slate-600 uppercase">
                to
              </span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-slate-300 outline-none px-2 py-1 border border-slate-700/50 rounded-lg focus:border-indigo-500 transition-colors cursor-pointer"
              />
            </div>
          )}

          {/* Date Range Selector */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-inner">
            {(["7d", "14d", "30d", "custom"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  dateRange === range
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block"></div>

          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-inner">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as "pdf" | "xlsx" | "json")}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none px-2 py-1 cursor-pointer appearance-none"
              >
                <option value="pdf">PDF</option>
                <option value="xlsx">XLSX</option>
                <option value="json">JSON</option>
              </select>
              <div className="w-px h-4 bg-slate-800"></div>
              <button 
                onClick={handleExport}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
              >
                Export
              </button>
            </div>
            <button 
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRecalculating ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Recalculating...
                </>
              ) : 'Recalculate Models'}
            </button>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "MTTR (Resolution)",
            value: "18m",
            trend: "-4m",
            desc: "Mean Time To Recovery",
            color: "text-emerald-400",
          },
          {
            label: "SLA Availability",
            value: "99.982%",
            trend: "+0.01%",
            desc: "30-Day Rolling Window",
            color: "text-indigo-400",
          },
          {
            label: "Cost Efficiency",
            value: "84.2%",
            trend: "+2.4%",
            desc: "Resource Utilization Score",
            color: "text-amber-400",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] relative overflow-hidden group"
          >
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              {kpi.label}
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-white">
                {kpi.value}
              </span>
              <span
                className={`text-[10px] font-bold ${kpi.trend.startsWith("+") ? "text-emerald-500" : "text-rose-500"}`}
              >
                {kpi.trend}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{kpi.desc}</p>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full group-hover:bg-indigo-500/10 transition-all"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trends */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              Network Latency vs Uptime
            </h2>
            <div className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              {filteredPerformanceData.length} observations found
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPerformanceData} margin={{ bottom: 20 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#1e293b"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                  animationDuration={1000}
                />
                <Brush
                  dataKey="day"
                  height={30}
                  stroke="#475569"
                  fill="#0f172a"
                  travellerWidth={10}
                  gap={5}
                >
                  <AreaChart>
                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </Brush>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Taxonomy */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              Incident Taxonomy
            </h2>
            <div className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              {dateRange} View
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 h-80 md:h-64">
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredErrorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    animationDuration={1500}
                  >
                    {filteredErrorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip total={errorTotal} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 shrink-0 pr-4">
              {filteredErrorData.map((item, idx) => {
                const perc =
                  errorTotal > 0
                    ? ((item.value / errorTotal) * 100).toFixed(0)
                    : "0";
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 rounded-md">
                          {perc}%
                        </span>
                      </div>
                      <div className="text-xs font-black text-white">
                        {item.value} Events
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Error Trend Analytics */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              Error Trend Analytics (Hourly)
            </h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorTrendData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="errors" 
                  name="Error Count"
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#1e293b' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">
        {/* Resource Efficiency */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Cluster Resource Allocation Efficiency
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              Reactive Regional Scaling
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredResourceData} margin={{ bottom: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#1e293b"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Legend
                  verticalAlign="top"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    paddingBottom: "20px",
                  }}
                />
                <Bar
                  dataKey="used"
                  name="Utilized Resource"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  animationDuration={1000}
                />
                <Bar
                  dataKey="wasted"
                  name="Idle Over-provision"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  animationDuration={1000}
                />
                <Brush
                  dataKey="name"
                  height={30}
                  stroke="#334155"
                  fill="#0f172a"
                  travellerWidth={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
