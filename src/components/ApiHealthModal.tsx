import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Copy, 
  Check, 
  Server, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Key, 
  Clock, 
  ExternalLink,
  Sliders,
  RefreshCw,
  Code
} from 'lucide-react';
import { ApiEndpointHealth, ApiHealthStatus, ApiProbeLog } from '../types';

interface ApiHealthModalProps {
  endpoint: ApiEndpointHealth;
  isOpen: boolean;
  onClose: () => void;
  onRunProbe: (endpointId: string, simulatedStatus?: ApiHealthStatus) => Promise<void>;
  isProbing: boolean;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({
  endpoint,
  isOpen,
  onClose,
  onRunProbe,
  isProbing
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'synthetic' | 'spec' | 'simulation'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customPayload, setCustomPayload] = useState<string>(endpoint.sampleRequestPayload || '{}');
  const [lastProbeResult, setLastProbeResult] = useState<{
    httpStatus: number;
    latencyMs: number;
    status: ApiHealthStatus;
    timestamp: string;
    responseBody: string;
  } | null>(null);
  const [simulatedFailureType, setSimulatedFailureType] = useState<ApiHealthStatus>('Healthy');

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExecuteLiveProbe = async () => {
    await onRunProbe(endpoint.id, simulatedFailureType !== 'Healthy' ? simulatedFailureType : undefined);
    setLastProbeResult({
      httpStatus: simulatedFailureType === 'Down' ? 503 : simulatedFailureType === 'Degraded' ? 200 : endpoint.httpStatus,
      latencyMs: simulatedFailureType === 'Degraded' ? Math.floor(Math.random() * 400 + 450) : Math.floor(Math.random() * 20 + 15),
      status: simulatedFailureType,
      timestamp: new Date().toLocaleTimeString('en-GB') + ' (UTC)',
      responseBody: simulatedFailureType === 'Down' 
        ? JSON.stringify({ error: "SERVICE_UNAVAILABLE", message: "Upstream dependency failed health check", code: 503 }, null, 2)
        : endpoint.sampleResponsePayload || '{}'
    });
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

  const getStatusBadge = (status: ApiHealthStatus) => {
    switch (status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational (Healthy)
          </span>
        );
      case 'Degraded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={12} className="text-amber-600" />
            Performance Degraded
          </span>
        );
      case 'Down':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-600" />
            Service Outage (Down)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-black font-mono rounded border ${getMethodBadgeClass(endpoint.method)}`}>
              {endpoint.method}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{endpoint.name}</h2>
                {getStatusBadge(endpoint.status)}
              </div>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{endpoint.path}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-gray-200 bg-white flex items-center gap-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Activity size={14} /> Health & Dependencies
          </button>
          <button
            onClick={() => setActiveTab('synthetic')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'synthetic'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Play size={14} /> Live Synthetic Probe
          </button>
          <button
            onClick={() => setActiveTab('spec')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'spec'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Code size={14} /> Request / Response Spec
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'simulation'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sliders size={14} /> Fault Simulation & SLA
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Tab 1: Overview & Dependencies */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* High-level Description */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">API Purpose & Application Context:</span>
                {endpoint.description}
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-[11px] font-semibold text-gray-500">Current Latency</p>
                  <p className="text-xl font-black text-gray-900 font-mono mt-1">{endpoint.latencyMs} <span className="text-xs text-gray-500 font-normal">ms</span></p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Optimal response</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-[11px] font-semibold text-gray-500">24h Uptime</p>
                  <p className="text-xl font-black text-emerald-600 font-mono mt-1">{endpoint.uptimePercent}%</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">SLA Target: 99.95%</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-[11px] font-semibold text-gray-500">HTTP Status Code</p>
                  <p className="text-xl font-black text-blue-600 font-mono mt-1">{endpoint.httpStatus}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Expected Success</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-[11px] font-semibold text-gray-500">Rate Limit Quota</p>
                  <p className="text-sm font-bold text-gray-800 font-mono mt-2 truncate">{endpoint.rateLimit}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Per client tenant</p>
                </div>
              </div>

              {/* Latency History Sparkline */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Recent Latency Checks (ms)</h3>
                    <p className="text-[11px] text-gray-400">Response time sampled across consecutive probes</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    p50: ~{Math.round(endpoint.recentLatencies.reduce((a, b) => a + b, 0) / endpoint.recentLatencies.length)}ms
                  </span>
                </div>
                <div className="h-16 flex items-end gap-1.5 pt-2 border-b border-gray-100">
                  {endpoint.recentLatencies.map((lat, idx) => {
                    const maxLat = Math.max(...endpoint.recentLatencies, 100);
                    const heightPercent = Math.max(15, Math.min(100, (lat / maxLat) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div 
                          className="w-full bg-teal-500 rounded-t-xs transition-all duration-300 group-hover:bg-teal-700" 
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-7 text-[10px] font-mono font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded pointer-events-none transition-opacity">
                          {lat}ms
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                  <span>-10 probes ago</span>
                  <span>Latest ({endpoint.lastChecked})</span>
                </div>
              </div>

              {/* Downstream Sub-System Dependencies */}
              <div>
                <h3 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                  <Server size={14} className="text-teal-600" />
                  Subsystem Dependencies & Internal Infrastructure
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {endpoint.dependencies.map((dep, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-slate-50/50 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{dep.name}</p>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{dep.type}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Ping latency:</span>
                        <span className="font-mono font-bold text-gray-800">{dep.latencyMs} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Live Synthetic Probe Runner */}
          {activeTab === 'synthetic' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                <Play size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Live Synthetic Probe Execution:</span>
                  Trigger an on-demand synthetic test request to verify API endpoint responsiveness, credential authentication, and downstream directory connectivity in real time.
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold font-mono rounded border ${getMethodBadgeClass(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-800">
                      https://sso.osttra.com{endpoint.path}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExecuteLiveProbe}
                    disabled={isProbing}
                    className="accent-button text-xs py-2 px-4 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isProbing ? 'animate-spin' : ''} />
                    {isProbing ? 'Sending Probe...' : 'Execute Probe Request'}
                  </button>
                </div>

                {endpoint.method !== 'GET' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Request Body (JSON Payload)
                    </label>
                    <textarea
                      rows={5}
                      value={customPayload}
                      onChange={(e) => setCustomPayload(e.target.value)}
                      className="w-full font-mono text-xs p-2.5 border border-gray-300 rounded bg-slate-900 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                {/* Probe Result Box */}
                {lastProbeResult ? (
                  <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                          lastProbeResult.httpStatus < 300 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          HTTP {lastProbeResult.httpStatus}
                        </span>
                        <span className="text-xs font-mono text-gray-600">
                          Latency: <strong>{lastProbeResult.latencyMs} ms</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {lastProbeResult.timestamp}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-gray-700">Response Payload:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(lastProbeResult.responseBody, 'last_response')}
                          className="text-[10px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                        >
                          {copiedKey === 'last_response' ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                          {copiedKey === 'last_response' ? 'Copied' : 'Copy JSON'}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded overflow-x-auto max-h-48 border border-slate-800">
                        {lastProbeResult.responseBody}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    Click &quot;Execute Probe Request&quot; above to run a synthetic test against this endpoint.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Request & Response Spec */}
          {activeTab === 'spec' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Authorization Scheme:</span>
                  <span className="font-mono text-teal-700 font-semibold">{endpoint.authRequired}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Target Environment:</span>
                  <span className="font-semibold text-gray-700">{endpoint.environment} (Base URL: https://sso.osttra.com)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Rate Limit:</span>
                  <span className="font-mono text-gray-700">{endpoint.rateLimit}</span>
                </div>
              </div>

              {endpoint.sampleRequestPayload && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-700">Sample Request Body</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(endpoint.sampleRequestPayload || '', 'spec_req')}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                    >
                      {copiedKey === 'spec_req' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      {copiedKey === 'spec_req' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg overflow-x-auto max-h-56 border border-slate-800">
                    {endpoint.sampleRequestPayload}
                  </pre>
                </div>
              )}

              {endpoint.sampleResponsePayload && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-700">Sample Response (HTTP {endpoint.httpStatus})</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(endpoint.sampleResponsePayload || '', 'spec_res')}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                    >
                      {copiedKey === 'spec_res' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      {copiedKey === 'spec_res' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-56 border border-slate-800">
                    {endpoint.sampleResponsePayload}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Fault Simulation & Alerting */}
          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <span className="font-bold block mb-1">Chaos Engineering & Fault Injection Simulation:</span>
                Test how the SSO portal, health blotter, and operations teams react when this API experiences performance degradation or service outages.
              </div>

              <div className="p-4 border border-gray-200 rounded-lg space-y-4 bg-white">
                <h4 className="text-xs font-bold text-gray-800">Select Endpoint Condition:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSimulatedFailureType('Healthy')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      simulatedFailureType === 'Healthy'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-800 block">Normal (Healthy)</span>
                    <span className="text-[11px] text-gray-500 block mt-0.5">&lt;50ms response, 200 OK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimulatedFailureType('Degraded')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      simulatedFailureType === 'Degraded'
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-amber-800 block">Degraded (High Latency)</span>
                    <span className="text-[11px] text-gray-500 block mt-0.5">~500ms delay, upstream queue delay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimulatedFailureType('Down')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      simulatedFailureType === 'Down'
                        ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-rose-800 block">Outage (HTTP 503)</span>
                    <span className="text-[11px] text-gray-500 block mt-0.5">Service Unavailable, timeout</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await onRunProbe(endpoint.id, simulatedFailureType);
                      onClose();
                    }}
                    className="accent-button text-xs py-2 px-4 shadow-sm"
                  >
                    Apply State & Trigger Probe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">
            Endpoint ID: <code className="font-mono text-gray-700">{endpoint.id}</code>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExecuteLiveProbe}
              disabled={isProbing}
              className="accent-button text-xs py-2 px-3.5 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isProbing ? 'animate-spin' : ''} />
              {isProbing ? 'Checking...' : 'Run Probe'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
