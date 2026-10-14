import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Play, 
  Search, 
  Filter, 
  Download, 
  Server, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Key, 
  Clock, 
  Copy, 
  Check, 
  FileText, 
  Sliders, 
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  Zap
} from 'lucide-react';
import { ApiEndpointHealth, ApiHealthStatus, ApiCategory, ApiProbeLog } from '../types';
import { ApiHealthModal } from './ApiHealthModal';

interface ApiHealthViewProps {
  endpoints: ApiEndpointHealth[];
  onUpdateEndpoints: React.Dispatch<React.SetStateAction<ApiEndpointHealth[]>>;
  probeLogs: ApiProbeLog[];
  onAddProbeLog: (log: ApiProbeLog) => void;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const ApiHealthView: React.FC<ApiHealthViewProps> = ({
  endpoints,
  onUpdateEndpoints,
  probeLogs,
  onAddProbeLog,
  showMessage
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [environment, setEnvironment] = useState<'PROD' | 'UAT'>('PROD');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 15, 30, 60
  const [countdown, setCountdown] = useState<number>(0);
  const [isProbingAll, setIsProbingAll] = useState<boolean>(false);
  const [probingEndpointId, setProbingEndpointId] = useState<string | null>(null);
  const [inspectingEndpoint, setInspectingEndpoint] = useState<ApiEndpointHealth | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'dependencies' | 'logs'>('endpoints');
  const [copiedEndpointId, setCopiedEndpointId] = useState<string | null>(null);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval === 0) {
      setCountdown(0);
      return;
    }

    setCountdown(autoRefreshInterval);
    const intervalId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleProbeAll(false);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval]);

  // Handle probe single endpoint
  const handleProbeEndpoint = async (endpointId: string, simulatedStatus?: ApiHealthStatus) => {
    setProbingEndpointId(endpointId);
    
    // Simulate real network request delay
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 300 + 200)));

    const nowFormatted = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (UTC)';
    const nowFull = new Date().toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }) + ' (UTC)';

    let newStatus: ApiHealthStatus = 'Healthy';
    let newHttpStatus = 200;
    let newLatency = Math.floor(Math.random() * 25 + 15);

    if (simulatedStatus) {
      newStatus = simulatedStatus;
      if (simulatedStatus === 'Degraded') {
        newHttpStatus = 200;
        newLatency = Math.floor(Math.random() * 350 + 350); // 350-700ms
      } else if (simulatedStatus === 'Down') {
        newHttpStatus = 503;
        newLatency = Math.floor(Math.random() * 1000 + 1200); // 1200ms+ timeout
      }
    } else {
      // Natural health simulation (default healthy, with rare slight jitter)
      const rand = Math.random();
      if (rand > 0.96) {
        newStatus = 'Degraded';
        newLatency = Math.floor(Math.random() * 200 + 180);
      }
    }

    onUpdateEndpoints(prev => prev.map(ep => {
      if (ep.id === endpointId) {
        const updatedRecent = [...ep.recentLatencies.slice(1), newLatency];
        return {
          ...ep,
          status: newStatus,
          httpStatus: newHttpStatus,
          latencyMs: newLatency,
          lastChecked: 'Just now',
          recentLatencies: updatedRecent
        };
      }
      return ep;
    }));

    const targetEp = endpoints.find(e => e.id === endpointId);
    if (targetEp) {
      const newLog: ApiProbeLog = {
        id: `prb-${Date.now()}`,
        endpointId: targetEp.id,
        endpointName: targetEp.name,
        method: targetEp.method,
        path: targetEp.path,
        timestamp: nowFull,
        status: newStatus,
        httpStatus: newHttpStatus,
        latencyMs: newLatency,
        message: newStatus === 'Healthy' 
          ? `HTTP ${newHttpStatus} OK — Probed successfully in ${newLatency}ms.`
          : newStatus === 'Degraded'
          ? `HTTP ${newHttpStatus} Warning — High latency threshold exceeded (${newLatency}ms).`
          : `HTTP ${newHttpStatus} Error — Upstream service unavailable / connection timeout.`
      };
      onAddProbeLog(newLog);
    }

    setProbingEndpointId(null);
  };

  // Handle probe all endpoints
  const handleProbeAll = async (showToast: boolean = true) => {
    setIsProbingAll(true);

    // Realistic staggered probe
    await new Promise(r => setTimeout(r, 600));

    const nowFull = new Date().toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }) + ' (UTC)';

    onUpdateEndpoints(prev => prev.map(ep => {
      const variance = (Math.random() - 0.5) * 8;
      const baseLat = ep.category === 'Domain Setup & Migration' ? 45 : 25;
      const newLat = Math.max(8, Math.round(baseLat + variance));
      const updatedRecent = [...ep.recentLatencies.slice(1), newLat];
      return {
        ...ep,
        status: ep.status === 'Down' ? 'Down' : 'Healthy', // preserve manual outage tests
        latencyMs: ep.status === 'Down' ? 1200 : newLat,
        lastChecked: 'Just now',
        recentLatencies: updatedRecent
      };
    }));

    const newLog: ApiProbeLog = {
      id: `prb-batch-${Date.now()}`,
      endpointId: 'all',
      endpointName: 'Comprehensive Synthetic Health Sweep',
      method: 'PROBE_ALL',
      path: '/api/v1/*',
      timestamp: nowFull,
      status: 'Healthy',
      httpStatus: 200,
      latencyMs: 32,
      message: `Probed ${endpoints.length} endpoints successfully across SSO domain and identity stack.`
    };
    onAddProbeLog(newLog);

    setIsProbingAll(false);
    if (showToast) {
      showMessage(`Completed live health check sweep across ${endpoints.length} SSO APIs.`, 'success');
    }
  };

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      // Category filter
      if (selectedCategory !== 'All' && ep.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'All' && ep.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = ep.name.toLowerCase().includes(q);
        const matchPath = ep.path.toLowerCase().includes(q);
        const matchMethod = ep.method.toLowerCase().includes(q);
        const matchDesc = ep.description.toLowerCase().includes(q);
        if (!matchName && !matchPath && !matchMethod && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [endpoints, selectedCategory, selectedStatus, searchQuery]);

  // Overall system summary
  const summary = useMemo(() => {
    const total = endpoints.length;
    const healthyCount = endpoints.filter(e => e.status === 'Healthy').length;
    const degradedCount = endpoints.filter(e => e.status === 'Degraded').length;
    const downCount = endpoints.filter(e => e.status === 'Down').length;
    const avgLatency = Math.round(endpoints.reduce((acc, e) => acc + e.latencyMs, 0) / (total || 1));
    const avgUptime = (endpoints.reduce((acc, e) => acc + e.uptimePercent, 0) / (total || 1)).toFixed(2);

    let systemStatus: ApiHealthStatus = 'Healthy';
    if (downCount > 0) systemStatus = 'Down';
    else if (degradedCount > 0) systemStatus = 'Degraded';

    return { total, healthyCount, degradedCount, downCount, avgLatency, avgUptime, systemStatus };
  }, [endpoints]);

  const handleCopyPath = (path: string, id: string) => {
    navigator.clipboard.writeText(`https://sso.osttra.com${path}`);
    setCopiedEndpointId(id);
    setTimeout(() => setCopiedEndpointId(null), 2000);
  };

  const handleExportReport = () => {
    const reportData = {
      portal: "OSTTRA SSO Central API Health Report",
      generatedAt: new Date().toISOString(),
      environment,
      systemSummary: summary,
      endpoints: endpoints.map(e => ({
        name: e.name,
        method: e.method,
        path: e.path,
        category: e.category,
        status: e.status,
        latencyMs: e.latencyMs,
        uptimePercent: e.uptimePercent,
        httpStatus: e.httpStatus,
        rateLimit: e.rateLimit,
        authRequired: e.authRequired
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sso-api-health-report-${environment.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage("API Health Report exported successfully.", 'success');
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'POST': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DELETE': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'PUT':
      case 'PATCH': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const categories: ApiCategory[] = [
    'User Management',
    'Active Directory & Groups',
    'Domain Setup & Migration',
    'Authentication & Federation',
    'Security & Whitelisting'
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-main-bg)] overflow-y-auto">
      {/* Top Banner & Metric Cards */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Title and Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                <Activity size={22} className="text-teal-700" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  SSO API Health & Status Monitor
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                    REST & Graph APIs
                  </span>
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time health monitoring, synthetic probing, latency metrics, and SLA telemetry for SSO application endpoints.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Environment Toggle */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEnvironment('PROD')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  environment === 'PROD'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                PROD
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('UAT')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  environment === 'UAT'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                UAT
              </button>
            </div>

            {/* Auto-refresh selector */}
            <div className="flex items-center text-xs border border-gray-300 rounded-lg bg-white px-2.5 py-1.5 gap-1.5">
              <Clock size={13} className="text-gray-400" />
              <span className="text-gray-500 text-[11px] font-semibold">Refresh:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={0}>Manual</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
              {autoRefreshInterval > 0 && (
                <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                  {countdown}s
                </span>
              )}
            </div>

            {/* Probe All button */}
            <button
              type="button"
              onClick={() => handleProbeAll(true)}
              disabled={isProbingAll}
              className="accent-button text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isProbingAll ? 'animate-spin' : ''} />
              {isProbingAll ? 'Checking APIs...' : 'Check All APIs'}
            </button>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExportReport}
              className="text-xs font-semibold px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              title="Download API Health Report (JSON)"
            >
              <Download size={13} className="text-gray-500" />
              Export
            </button>
          </div>
        </div>

        {/* System Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: System Status */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Overall System Status</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  summary.systemStatus === 'Healthy' 
                    ? 'bg-emerald-500 animate-pulse' 
                    : summary.systemStatus === 'Degraded' 
                    ? 'bg-amber-500' 
                    : 'bg-rose-500 animate-bounce'
                }`} />
                <span className="text-base font-extrabold text-gray-900">
                  {summary.systemStatus === 'Healthy' 
                    ? 'All Systems Operational' 
                    : summary.systemStatus === 'Degraded' 
                    ? 'Performance Degraded' 
                    : 'Service Disruption'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {summary.healthyCount}/{summary.total} APIs fully healthy
              </p>
            </div>
            <div className={`p-2.5 rounded-lg border ${
              summary.systemStatus === 'Healthy' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {summary.systemStatus === 'Healthy' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
          </div>

          {/* Card 2: Average Latency */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Average Latency (RTT)</p>
              <p className="text-2xl font-black text-gray-900 font-mono mt-1">
                {summary.avgLatency} <span className="text-xs font-normal text-gray-500">ms</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Well within SLA limit (&lt;100ms)
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Clock size={24} />
            </div>
          </div>

          {/* Card 3: Availability & Uptime */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Monthly Availability</p>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {summary.avgUptime}%
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Target: 99.95% high-availability
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <ShieldCheck size={24} />
            </div>
          </div>

          {/* Card 4: Endpoints Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Monitored Endpoints</p>
              <p className="text-2xl font-black text-gray-900 font-mono mt-1">
                {summary.total} <span className="text-xs font-normal text-gray-500">Endpoints</span>
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
                <span className="text-emerald-700">{summary.healthyCount} normal</span>
                {summary.degradedCount > 0 && <span className="text-amber-700">{summary.degradedCount} degraded</span>}
                {summary.downCount > 0 && <span className="text-rose-700">{summary.downCount} outage</span>}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
              <Server size={24} />
            </div>
          </div>
        </div>

        {/* View Sub-Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 rounded-t-xl">
          <div className="flex items-center gap-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('endpoints')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'endpoints'
                  ? 'border-teal-700 text-teal-900 font-extrabold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Server size={15} />
              API Endpoints & Probe Tests
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-700">
                {endpoints.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dependencies')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'dependencies'
                  ? 'border-teal-700 text-teal-900 font-extrabold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Database size={15} />
              Subsystem & Directory Infrastructure
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-700">
                5 Core Services
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'border-teal-700 text-teal-900 font-extrabold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Activity size={15} />
              Recent Probes & Audit Telemetry
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-700">
                {probeLogs.length}
              </span>
            </button>
          </div>

          {activeTab === 'endpoints' && (
            <div className="flex items-center gap-1.5 py-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded border transition-colors ${
                  viewMode === 'table' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'border-gray-200 text-gray-400 hover:text-gray-700'
                }`}
                title="Table view"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded border transition-colors ${
                  viewMode === 'cards' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'border-gray-200 text-gray-400 hover:text-gray-700'
                }`}
                title="Cards view"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: API Endpoints & Probes */}
        {activeTab === 'endpoints' && (
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-xs p-5 space-y-5">
            {/* Filter Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Categories ({endpoints.length})
                </button>
                {categories.map(cat => {
                  const count = endpoints.filter(e => e.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Status and Search */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-teal-600 font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Healthy">Healthy (Normal)</option>
                  <option value="Degraded">Degraded</option>
                  <option value="Down">Outage (Down)</option>
                </select>

                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by endpoint, name or path..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-56 text-xs border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-teal-600 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Endpoints Table View */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Method & API Endpoint</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Health Status</th>
                      <th className="py-3 px-4">Latency (RTT)</th>
                      <th className="py-3 px-4">Uptime</th>
                      <th className="py-3 px-4">Last Checked</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs">
                    {filteredEndpoints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          No matching API endpoints found for current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredEndpoints.map(endpoint => {
                        const isThisProbing = probingEndpointId === endpoint.id;
                        return (
                          <tr key={endpoint.id} className="hover:bg-slate-50/70 transition-colors group">
                            {/* Method & Endpoint Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-2.5">
                                <span className={`px-2 py-0.5 text-[11px] font-black font-mono rounded border shrink-0 mt-0.5 ${getMethodBadgeClass(endpoint.method)}`}>
                                  {endpoint.method}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-900 group-hover:text-teal-900">
                                      {endpoint.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <code className="text-[11px] font-mono text-gray-500 select-all">
                                      {endpoint.path}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPath(endpoint.path, endpoint.id)}
                                      className="text-gray-400 hover:text-gray-700 transition-colors"
                                      title="Copy full URL"
                                    >
                                      {copiedEndpointId === endpoint.id ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {endpoint.category}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {endpoint.status === 'Healthy' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  Operational (200)
                                </span>
                              )}
                              {endpoint.status === 'Degraded' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle size={11} className="text-amber-600" />
                                  Degraded
                                </span>
                              )}
                              {endpoint.status === 'Down' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle size={11} className="text-rose-600" />
                                  Outage (503)
                                </span>
                              )}
                            </td>

                            {/* Latency & Sparkline */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${
                                  endpoint.latencyMs < 50 
                                    ? 'text-emerald-700' 
                                    : endpoint.latencyMs < 150 
                                    ? 'text-amber-700' 
                                    : 'text-rose-700'
                                }`}>
                                  {endpoint.latencyMs} ms
                                </span>
                                {/* Mini sparkline dots */}
                                <div className="flex items-center gap-0.5">
                                  {endpoint.recentLatencies.slice(-5).map((l, i) => (
                                    <div 
                                      key={i} 
                                      className={`w-1 rounded-full ${
                                        l < 50 ? 'bg-emerald-400' : l < 150 ? 'bg-amber-400' : 'bg-rose-400'
                                      }`}
                                      style={{ height: `${Math.max(6, Math.min(16, (l / 100) * 16))}px` }}
                                      title={`${l}ms`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>

                            {/* Uptime */}
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                              {endpoint.uptimePercent}%
                            </td>

                            {/* Last Checked */}
                            <td className="py-3.5 px-4 text-[11px] text-gray-500 font-mono">
                              {endpoint.lastChecked}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleProbeEndpoint(endpoint.id)}
                                  disabled={isThisProbing}
                                  className="text-xs font-bold px-2.5 py-1 rounded bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Probe this endpoint immediately"
                                >
                                  <RefreshCw size={11} className={isThisProbing ? 'animate-spin' : ''} />
                                  {isThisProbing ? 'Probing...' : 'Probe'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInspectingEndpoint(endpoint)}
                                  className="text-xs font-semibold px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="View endpoint specs, sample requests, and dependencies"
                                >
                                  Inspect
                                  <ChevronRight size={12} className="text-gray-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Endpoints Card Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEndpoints.map(endpoint => {
                  const isThisProbing = probingEndpointId === endpoint.id;
                  return (
                    <div 
                      key={endpoint.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2 py-0.5 text-[11px] font-black font-mono rounded border ${getMethodBadgeClass(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          {endpoint.status === 'Healthy' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Operational
                            </span>
                          )}
                          {endpoint.status === 'Degraded' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertTriangle size={11} className="text-amber-600" />
                              Degraded
                            </span>
                          )}
                          {endpoint.status === 'Down' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle size={11} className="text-rose-600" />
                              Outage
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 mt-2.5">
                          {endpoint.name}
                        </h3>
                        <code className="text-xs font-mono text-gray-500 block mt-1 break-all bg-slate-50 p-1.5 rounded border border-slate-100">
                          {endpoint.path}
                        </code>

                        <p className="text-[11px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                          {endpoint.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-gray-500">Latency: <strong className="font-mono text-gray-800">{endpoint.latencyMs} ms</strong></span>
                          <span className="text-gray-500">Uptime: <strong className="font-mono text-gray-800">{endpoint.uptimePercent}%</strong></span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleProbeEndpoint(endpoint.id)}
                            disabled={isThisProbing}
                            className="flex-1 text-xs font-bold py-1.5 rounded bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw size={11} className={isThisProbing ? 'animate-spin' : ''} />
                            {isThisProbing ? 'Probing...' : 'Probe'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectingEndpoint(endpoint)}
                            className="flex-1 text-xs font-semibold py-1.5 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Inspect
                            <ExternalLink size={11} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Subsystem & Directory Infrastructure */}
        {activeTab === 'dependencies' && (
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Core Identity & Directory Subsystems
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Upstream and downstream enterprise backbones providing user directory sync, database persistence, and crypto key signing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Service 1: Active Directory LDAP */}
              <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                      <Server size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">Active Directory LDAP</h3>
                      <p className="text-[10px] text-gray-500">DC-01, DC-02 Cluster</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Healthy (14ms)
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Handles user authentication, group assignment verification, and on-premise Active Directory domain replication.
                </p>
                <div className="text-[11px] text-gray-500 border-t border-gray-200/60 pt-2 flex justify-between">
                  <span>Replication Delta:</span>
                  <span className="font-mono font-bold text-gray-800">&lt;2 seconds</span>
                </div>
              </div>

              {/* Service 2: Azure Entra ID Graph */}
              <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">Azure Entra ID Graph API</h3>
                      <p className="text-[10px] text-gray-500">Cloud Directory Tenant</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Healthy (28ms)
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Provides Microsoft Entra federation sync, passwordless token authorization, and automated guest invitation flows.
                </p>
                <div className="text-[11px] text-gray-500 border-t border-gray-200/60 pt-2 flex justify-between">
                  <span>Microsoft API Quota:</span>
                  <span className="font-mono font-bold text-gray-800">4% used</span>
                </div>
              </div>

              {/* Service 3: Primary SSO PostgreSQL DB */}
              <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Database size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">SSO Primary PostgreSQL</h3>
                      <p className="text-[10px] text-gray-500">High-Availability Replica</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Healthy (3ms)
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Durable store for registered domains, SAML metadata configurations, IP whitelists, and audit compliance logs.
                </p>
                <div className="text-[11px] text-gray-500 border-t border-gray-200/60 pt-2 flex justify-between">
                  <span>Active Connections:</span>
                  <span className="font-mono font-bold text-gray-800">28 / 500</span>
                </div>
              </div>

              {/* Service 4: Redis Session & IP Cache */}
              <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
                      <Zap size={18} className="text-rose-700" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">Redis Distributed Cache</h3>
                      <p className="text-[10px] text-gray-500">Low-latency In-Memory Cluster</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Healthy (1ms)
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Powers ultra-fast IP whitelist evaluation, active token revocation checks, and rate-limiting enforcement.
                </p>
                <div className="text-[11px] text-gray-500 border-t border-gray-200/60 pt-2 flex justify-between">
                  <span>Memory Utilization:</span>
                  <span className="font-mono font-bold text-gray-800">1.2 GB / 8 GB</span>
                </div>
              </div>

              {/* Service 5: Hardware Security Module (HSM) */}
              <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                      <Key size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">HSM & Token Key Vault</h3>
                      <p className="text-[10px] text-gray-500">FIPS 140-2 Level 3</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Healthy (4ms)
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Performs cryptographic signing of SAML 2.0 assertions, JWT issuance, and verification of customer certificates.
                </p>
                <div className="text-[11px] text-gray-500 border-t border-gray-200/60 pt-2 flex justify-between">
                  <span>Active Signing Cert:</span>
                  <span className="font-mono font-bold text-gray-800">SHA-256 (Valid 2029)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Recent Probes & Audit Telemetry */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Recent Synthetic Probes & Telemetry History
                </h2>
                <p className="text-xs text-gray-500">
                  Audit log of automatic and on-demand health probes executed against the SSO application endpoints.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-gray-500">
                {probeLogs.length} events recorded
              </span>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Endpoint</th>
                    <th className="py-2.5 px-4">HTTP Status</th>
                    <th className="py-2.5 px-4">Latency</th>
                    <th className="py-2.5 px-4">Diagnostic Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {probeLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-black rounded border ${getMethodBadgeClass(log.method)}`}>
                            {log.method}
                          </span>
                          <span className="font-bold text-gray-800">{log.endpointName}</span>
                        </div>
                        <code className="text-[10px] font-mono text-gray-500">{log.path}</code>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          log.httpStatus < 300 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.httpStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-700">
                        {log.latencyMs} ms
                      </td>
                      <td className="py-2.5 px-4 text-gray-600 text-xs">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Inspect / Probe Modal */}
      {inspectingEndpoint && (
        <ApiHealthModal
          endpoint={inspectingEndpoint}
          isOpen={!!inspectingEndpoint}
          onClose={() => setInspectingEndpoint(null)}
          onRunProbe={handleProbeEndpoint}
          isProbing={probingEndpointId === inspectingEndpoint.id}
        />
      )}
    </div>
  );
};
