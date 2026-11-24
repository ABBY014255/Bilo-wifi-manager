import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Power,
  Radar,
  RefreshCw,
  RotateCcw,
  Router,
  Signal,
  SlidersHorizontal,
  Wifi,
  X,
  XCircle,
} from 'lucide-react';
import { TranslationStrings } from '../i18n';
import { isNativeCapacitorRuntime, routerApiService } from '../services/routerApiService';
import {
  DiagnosticStep,
  Language,
  RouterConfig,
  RouterFirmwareProtocol,
  RouterNetworkInfo,
} from '../types';

interface RouterSettingsModalProps {
  config: RouterConfig;
  initialFocusRealRouter?: boolean;
  lang: Language;
  t: TranslationStrings;
  onClose: () => void;
  onSave: (config: RouterConfig, verifiedLive?: boolean) => void;
  onSyncFromRouter: (config: RouterConfig) => Promise<void>;
  onResetDemoData: () => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

type ModalSection = 'connection' | 'controls';

export const RouterSettingsModal: React.FC<RouterSettingsModalProps> = ({
  config,
  initialFocusRealRouter = false,
  lang,
  t,
  onClose,
  onSave,
  onSyncFromRouter,
  onResetDemoData,
  onNotify,
}) => {
  const isNativeApk = isNativeCapacitorRuntime();
  const [section, setSection] = useState<ModalSection>('connection');
  const [draft, setDraft] = useState<RouterConfig>(() => ({
    ...config,
    mode: initialFocusRealRouter ? 'router' : config.mode,
  }));

  const [testing, setTesting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [syncingRules, setSyncingRules] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text: string;
    detail?: string;
    steps?: DiagnosticStep[];
  } | null>(null);

  // Router Controls state (Signal/Network Info, Wi-Fi SSID/Password, Reboot)
  const [networkInfo, setNetworkInfo] = useState<RouterNetworkInfo | null>(null);
  const [loadingSignal, setLoadingSignal] = useState(false);
  const [wifiSsid, setWifiSsid] = useState(config.ssid24 || 'Bilo_WiFi_2.4G');
  const [wifiPassword, setWifiPassword] = useState('');
  const [savingWifi, setSavingWifi] = useState(false);
  const [confirmReboot, setConfirmReboot] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  const loadSignalInfo = async (targetConfig: RouterConfig) => {
    setLoadingSignal(true);
    const info = await routerApiService.getRouterNetworkInfo(targetConfig);
    setLoadingSignal(false);
    setNetworkInfo(info);
    if (info?.ssid24) {
      setWifiSsid(info.ssid24);
      setDraft((prev) => ({ ...prev, ssid24: info.ssid24 }));
    }
  };

  useEffect(() => {
    if (section === 'controls' && !networkInfo) {
      void loadSignalInfo(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const handleAutoDetectGateway = async () => {
    setScanning(true);
    setTestResult(null);
    const res = await routerApiService.detectGatewayIp(draft);
    setScanning(false);

    if (res.blockedByHttps) {
      setTestResult({
        ok: false,
        text: t.routerModal.routerMixedContentMsg,
      });
      return;
    }

    if (res.foundIp) {
      setDraft((prev) => ({ ...prev, gatewayIp: res.foundIp! }));
      onNotify(
        lang === 'sw'
          ? `Rauta imepatikana kwenye ${res.foundIp}`
          : `Router found at ${res.foundIp}`,
        'success'
      );
    } else {
      setTestResult({
        ok: false,
        text: t.routerModal.routerUnreachableMsg,
      });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await routerApiService.testConnection(draft);
    setTesting(false);

    if (res.networkInfo) {
      setNetworkInfo(res.networkInfo);
      if (res.networkInfo.ssid24) {
        setWifiSsid(res.networkInfo.ssid24);
      }
    }

    if (res.isDemo) {
      setTestResult({ ok: true, text: t.routerModal.demoConnectedMsg });
      return;
    }

    if (res.ok) {
      const detailParts: string[] = [];
      if (res.detectedSsid) detailParts.push(`Wi-Fi: ${res.detectedSsid}`);
      if (res.detectedVariantLabel) {
        detailParts.push(res.detectedVariantLabel);
      } else if (res.detectedProtocol) {
        detailParts.push(`API: ${res.detectedProtocol}`);
      }
      if (typeof res.clientCount === 'number') {
        detailParts.push(`${res.clientCount} ${t.devices.connectedCount}`);
      }
      setTestResult({
        ok: true,
        text: t.routerModal.routerConnectedMsg,
        detail: detailParts.join(' · '),
        steps: res.steps,
      });
      setDraft((prev) => ({
        ...prev,
        ssid24: res.detectedSsid || prev.ssid24,
        firmwareProtocol: res.detectedProtocol || prev.firmwareProtocol,
      }));
      return;
    }

    const reasonText =
      res.reason === 'mixed_content'
        ? t.routerModal.routerMixedContentMsg
        : res.reason === 'auth_failed'
          ? t.routerModal.routerAuthFailedMsg
          : res.reason === 'invalid_host'
            ? t.routerModal.routerInvalidHostMsg
            : t.routerModal.routerUnreachableMsg;

    setTestResult({ ok: false, text: reasonText, steps: res.steps });
  };

  const handleImportRules = async () => {
    setSyncingRules(true);
    await onSyncFromRouter(draft);
    setSyncingRules(false);
  };

  const handleUpdateWifi = async () => {
    setSavingWifi(true);
    const res = await routerApiService.updateWifiSettings(draft, {
      ssid: wifiSsid,
      wifiPassword,
    });
    setSavingWifi(false);

    if (res.ok) {
      setDraft((prev) => ({ ...prev, ssid24: wifiSsid.trim() }));
      setNetworkInfo((prev) => (prev ? { ...prev, ssid24: wifiSsid.trim() } : prev));
      setWifiPassword('');
      onNotify(t.routerModal.wifiUpdatedToast, 'success');
    } else {
      onNotify(res.error || t.routerModal.wifiUpdateFailedToast, 'warning');
    }
  };

  const handleRebootRouter = async () => {
    setRebooting(true);
    const ok = await routerApiService.rebootRouter(draft);
    setRebooting(false);
    setConfirmReboot(false);
    if (ok) {
      onNotify(t.routerModal.rebootSuccessToast, 'success');
    } else {
      onNotify(t.routerModal.rebootFailedToast, 'warning');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft, testResult?.ok && draft.mode === 'router');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate">{t.routerModal.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{t.routerModal.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Switcher: Connection vs Router Controls */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-200/60">
            <button
              type="button"
              onClick={() => setSection('connection')}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                section === 'connection'
                  ? 'bg-white text-[#1565D8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Router className="w-3.5 h-3.5" />
              <span>{t.routerModal.tabConnection}</span>
            </button>
            <button
              type="button"
              onClick={() => setSection('controls')}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                section === 'controls'
                  ? 'bg-white text-[#1565D8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.routerModal.tabTools}</span>
            </button>
          </div>
        </div>

        {section === 'connection' ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Primary Mode Selector: Real Wi-Fi Router vs Demo Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.routerModal.connectionMode}
                </label>
                {isNativeApk && (
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {lang === 'sw' ? 'Android Native HTTP' : 'Android Native HTTP'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...draft, mode: 'router' });
                    setTestResult(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    draft.mode === 'router'
                      ? 'border-[#1565D8] bg-[#EEF4FF]/65 ring-1 ring-[#1565D8]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Router className="w-4 h-4 text-[#1565D8] shrink-0" />
                    <span>{t.routerModal.liveTitle}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t.routerModal.liveDesc}</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...draft, mode: 'demo' });
                    setTestResult(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    draft.mode === 'demo'
                      ? 'border-[#1565D8] bg-[#EEF4FF]/65 ring-1 ring-[#1565D8]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Wifi className="w-4 h-4 text-[#1565D8] shrink-0" />
                    <span>{t.routerModal.demoTitle}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t.routerModal.demoDesc}</p>
                </button>
              </div>
            </div>

            {/* Direct Real Router Connection Fields */}
            {draft.mode === 'router' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">{t.routerModal.nativeDirectNote}</p>

                {/* Gateway IP + Quick Presets (.0.1, .1.1, .8.1) + Auto-Detect */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {t.routerModal.gatewayIp}
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectGateway}
                      disabled={scanning}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1565D8] hover:text-[#1052B5] disabled:opacity-50 cursor-pointer"
                    >
                      <Radar className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                      <span>
                        {scanning ? t.routerModal.scanningIp : t.routerModal.autoDetectIp}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={draft.gatewayIp}
                      onChange={(e) => setDraft({ ...draft, gatewayIp: e.target.value })}
                      placeholder="192.168.1.1"
                      className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 font-mono text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                    />
                    {(['192.168.0.1', '192.168.1.1', '192.168.8.1'] as const).map((ip) => (
                      <button
                        key={ip}
                        type="button"
                        onClick={() => setDraft({ ...draft, gatewayIp: ip })}
                        className={`h-11 px-2.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                          draft.gatewayIp === ip
                            ? 'border-[#1565D8] bg-[#EEF4FF] text-[#1565D8] font-semibold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        .{ip.split('.').slice(2).join('.')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Username, Admin Password & Router API Protocol */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.routerModal.username}
                    </label>
                    <input
                      type="text"
                      value={draft.username}
                      onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                      placeholder="admin"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.routerModal.password}
                    </label>
                    <input
                      type="password"
                      value={draft.password}
                      onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                      placeholder="admin"
                      autoComplete="off"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.routerModal.routerApiLabel}
                    </label>
                    <select
                      value={draft.firmwareProtocol}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          firmwareProtocol: e.target.value as RouterFirmwareProtocol,
                        })
                      }
                      className="w-full h-11 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1565D8]"
                    >
                      <option value="auto">Auto-Detect (A → B → C)</option>
                      <option value="goform">goform (ZLT / TZLink)</option>
                      <option value="reqproc">reqproc (Airtel SmartBox)</option>
                      <option value="tozed_web">Tozed Web / LuCI</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">{t.routerModal.passwordMemoryNote}</p>
              </div>
            )}

            {/* Diagnostic Result & Step-by-Step Verification */}
            {testResult && (
              <div
                className={`rounded-xl px-3.5 py-3 text-xs space-y-2.5 border ${
                  testResult.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold leading-relaxed">{testResult.text}</p>
                    {testResult.detail && (
                      <p className="font-mono text-[11px] text-emerald-700 font-semibold">
                        {testResult.detail}
                      </p>
                    )}
                  </div>
                </div>

                {testResult.steps && testResult.steps.length > 0 && (
                  <div className="pt-2 border-t border-black/10 space-y-1.5">
                    {testResult.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {step.status === 'ok' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          )}
                          <span>{step.label}</span>
                        </span>
                        {step.detail && (
                          <span className="font-mono text-slate-600 truncate max-w-[200px]">
                            {step.detail}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Utility Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="h-11 px-4 rounded-xl border border-[#1565D8]/30 bg-[#EEF4FF]/60 text-xs font-semibold text-[#1565D8] hover:bg-[#EEF4FF] disabled:opacity-60 cursor-pointer"
                >
                  {testing ? t.routerModal.testing : t.routerModal.testConnection}
                </button>

                {draft.mode === 'router' && (
                  <button
                    type="button"
                    onClick={handleImportRules}
                    disabled={syncingRules}
                    className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingRules ? 'animate-spin' : ''}`} />
                    <span>{t.routerModal.syncFromRouter}</span>
                  </button>
                )}
              </div>

              {draft.mode === 'demo' && (
                <button
                  type="button"
                  onClick={() => {
                    onResetDemoData();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 h-11 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.routerModal.resetDemoData}</span>
                </button>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-[#1565D8] hover:bg-[#1052B5] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {t.routerModal.saveConfig}
              </button>
            </div>
          </form>
        ) : (
          /* Router Controls Tab: Signal Info, Wi-Fi SSID/Password, Router Reboot */
          <div className="p-5 space-y-5 overflow-y-auto">
            {/* 1. Signal & Network Info */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Signal className="w-4 h-4 text-[#1565D8]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {t.routerModal.signalInfoTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => void loadSignalInfo(draft)}
                  disabled={loadingSignal}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSignal ? 'animate-spin' : ''}`} />
                  <span>{t.routerModal.refreshSignal}</span>
                </button>
              </div>

              {networkInfo ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#F5F8FC] border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.routerModal.providerLabel}
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {networkInfo.networkProvider || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F8FC] border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.routerModal.networkTypeLabel}
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {networkInfo.networkType || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F8FC] border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.routerModal.signalLabel}
                    </p>
                    <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {networkInfo.signalBar != null ? `${networkInfo.signalBar}/5` : '—'}
                      {networkInfo.rssi ? ` · ${networkInfo.rssi}` : ''}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F8FC] border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.routerModal.wanIpLabel}
                    </p>
                    <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5 truncate">
                      {networkInfo.wanIp || '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                  {loadingSignal ? t.routerModal.testing : t.routerModal.signalUnavailable}
                </div>
              )}
            </section>

            {/* 2. Wi-Fi SSID & Password */}
            <section className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#1565D8]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t.routerModal.wifiSettingsTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.routerModal.wifiSsidLabel}
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    maxLength={32}
                    placeholder="Bilo_WiFi"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.routerModal.wifiPasswordLabel}
                  </label>
                  <input
                    type="password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    maxLength={63}
                    autoComplete="new-password"
                    placeholder={t.routerModal.wifiPasswordPlaceholder}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateWifi}
                disabled={savingWifi || !wifiSsid.trim()}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-[#1565D8] hover:bg-[#1052B5] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {savingWifi ? t.routerModal.wifiUpdating : t.routerModal.updateWifiBtn}
              </button>
            </section>

            {/* 3. Reboot Router */}
            <section className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t.routerModal.rebootRouterTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.routerModal.rebootRouterDesc}
                  </p>
                </div>
              </div>

              {!confirmReboot ? (
                <button
                  type="button"
                  onClick={() => setConfirmReboot(true)}
                  className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100/70 text-xs font-semibold text-red-700 transition-colors cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>{t.routerModal.rebootRouterBtn}</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRebootRouter}
                    disabled={rebooting}
                    className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                    <span>{rebooting ? t.routerModal.rebooting : t.routerModal.rebootConfirmBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReboot(false)}
                    className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              )}
            </section>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
