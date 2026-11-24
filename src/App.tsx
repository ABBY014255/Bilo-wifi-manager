/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Package,
  Router,
  Shield,
  Smartphone,
  Wallet,
  Wifi,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { DevicesTab } from './components/DevicesTab';
import { AddRulePayload, FirewallTab, RenewRulePayload } from './components/FirewallTab';
import { PackagesTab } from './components/PackagesTab';
import { PaymentsTab } from './components/PaymentsTab';
import { RouterSettingsModal } from './components/RouterSettingsModal';
import { formatDurationLabel, translations } from './i18n';
import { routerApiService } from './services/routerApiService';
import { storageService } from './services/storageService';
import {
  ConnectedDevice,
  FirewallFilterMode,
  FirewallRule,
  Language,
  PaymentRecord,
  RouterConfig,
  RouterConnectionState,
  TabId,
  ToastMessage,
  WifiPackage,
} from './types';

async function copyToClipboardSafe(text: string): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch {
    // Ignore if completely blocked
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('devices');
  const [lang, setLang] = useState<Language>(() => storageService.loadLanguage());
  const [routerConfig, setRouterConfig] = useState<RouterConfig>(() =>
    storageService.loadRouterConfig()
  );
  const [filterMode, setFilterMode] = useState<FirewallFilterMode>(() =>
    storageService.loadFilterMode()
  );
  const [rules, setRules] = useState<FirewallRule[]>(() => storageService.loadRules());
  const [packages, setPackages] = useState<WifiPackage[]>(() => storageService.loadPackages());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => storageService.loadPayments());
  const [copiedMac, setCopiedMac] = useState<string>(() => storageService.loadCopiedMac());

  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<RouterConnectionState>(() =>
    storageService.loadRouterConfig().mode === 'demo' ? 'demo' : 'disconnected'
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocusReal, setSettingsFocusReal] = useState(false);
  const [prefillDevice, setPrefillDevice] = useState<{ name: string; mac: string } | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = translations[lang];

  // Keep refs for background expiration checker
  const routerConfigRef = useRef(routerConfig);
  const filterModeRef = useRef(filterMode);
  const langRef = useRef(lang);

  useEffect(() => {
    routerConfigRef.current = routerConfig;
  }, [routerConfig]);

  useEffect(() => {
    filterModeRef.current = filterMode;
  }, [filterMode]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const showToast = useCallback((message: string, tone: ToastMessage['tone'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  }, []);

  // Persist local state changes automatically
  useEffect(() => {
    storageService.saveRules(rules);
  }, [rules]);

  useEffect(() => {
    storageService.saveFilterMode(filterMode);
  }, [filterMode]);

  useEffect(() => {
    storageService.savePackages(packages);
  }, [packages]);

  useEffect(() => {
    storageService.savePayments(payments);
  }, [payments]);

  useEffect(() => {
    storageService.saveRouterConfig(routerConfig);
  }, [routerConfig]);

  useEffect(() => {
    storageService.saveLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Load connected devices from RouterApiService
  const fetchDevices = useCallback(
    async (silent = false) => {
      setDevicesLoading(true);
      const { devices: list, connectedLive } =
        await routerApiService.getConnectedDevices(routerConfig);
      setDevices(list);
      setConnectionState(
        routerConfig.mode === 'demo' ? 'demo' : connectedLive ? 'connected' : 'disconnected'
      );
      setDevicesLoading(false);
      if (!silent) {
        if (routerConfig.mode === 'router' && !connectedLive) {
          showToast(translations[langRef.current].routerModal.routerUnreachableMsg, 'warning');
        } else {
          showToast(translations[langRef.current].devices.refreshedToast, 'success');
        }
      }
    },
    [routerConfig, showToast]
  );

  useEffect(() => {
    void fetchDevices(true);
  }, [fetchDevices]);

  // Automated Countdown & Persistent Auto-Block Engine
  // Checks persisted expiry timestamps every second and immediately upon page resume/boot
  const checkExpirations = useCallback(
    (currentTime: number) => {
      setRules((prevRules) => {
        const newlyExpiredNames: string[] = [];
        let changed = false;

        const nextRules = prevRules.map((rule) => {
          if (
            rule.userType === 'customer' &&
            !rule.expired &&
            rule.expiresAt !== null &&
            rule.expiresAt <= currentTime
          ) {
            changed = true;
            newlyExpiredNames.push(rule.deviceName);
            return {
              ...rule,
              enabled: false,
              expired: true,
              lastSyncedAt: currentTime,
            };
          }
          return rule;
        });

        if (changed) {
          void routerApiService.syncFirewallRules(
            routerConfigRef.current,
            filterModeRef.current,
            nextRules
          );
          const currentTranslations = translations[langRef.current];
          for (const name of newlyExpiredNames) {
            showToast(`${currentTranslations.firewall.autoExpiredToast} ${name}`, 'warning');
          }
          return nextRules;
        }
        return prevRules;
      });
    },
    [showToast]
  );

  useEffect(() => {
    // Immediate expiration check on mount (catches timers expired while app was closed)
    checkExpirations(Date.now());

    const interval = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      checkExpirations(current);
    }, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const current = Date.now();
        setNow(current);
        checkExpirations(current);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [checkExpirations]);

  // Handlers: Tab 1 (Vifaa)
  const handleSimulateClient = () => {
    const joined = routerApiService.simulateClientConnect();
    setDevices((prev) => [joined, ...prev]);
    showToast(`${t.devices.simulatedJoinToast}: ${joined.hostname}`, 'success');
  };

  const handleCopyIp = (ip: string) => {
    void copyToClipboardSafe(ip);
    showToast(`${t.devices.ipCopiedToast}: ${ip}`, 'success');
  };

  const handleCopyMac = (mac: string) => {
    const normalized = mac.toUpperCase();
    setCopiedMac(normalized);
    storageService.saveCopiedMac(normalized);
    void copyToClipboardSafe(normalized);
    showToast(`${t.devices.macCopiedToast} (${normalized})`, 'success');
  };

  const handleQuickAddToFirewall = (device: ConnectedDevice) => {
    handleCopyMac(device.macAddress);
    setPrefillDevice({ name: device.hostname, mac: device.macAddress });
    setActiveTab('firewall');
  };

  // Handlers: Tab 2 (Firewall)
  const handleChangeFilterMode = (mode: FirewallFilterMode) => {
    setFilterMode(mode);
    void routerApiService.setMacFilterMode(routerConfig, mode);
    void routerApiService.syncFirewallRules(routerConfig, mode, rules);
    showToast(`${t.firewall.modeChangedToast} ${t.firewall.modes[mode].label}`, 'info');
  };

  const handleToggleRule = (ruleId: string) => {
    const target = rules.find((r) => r.id === ruleId);
    if (!target) return;
    const nextEnabled = !target.enabled;
    const nextRules = rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: nextEnabled, lastSyncedAt: Date.now() } : r
    );
    setRules(nextRules);
    void routerApiService.syncFirewallRules(routerConfig, filterMode, nextRules);
    showToast(
      `${nextEnabled ? t.firewall.toggleOnToast : t.firewall.toggleOffToast} ${target.deviceName}`,
      nextEnabled ? 'success' : 'info'
    );
  };

  const handleAddRule = (payload: AddRulePayload) => {
    const createdAt = Date.now();
    const expiresAt =
      payload.userType === 'customer' && payload.durationMs
        ? createdAt + payload.durationMs
        : null;

    const newRule: FirewallRule = {
      id: `rule-${createdAt}-${Math.random().toString(36).slice(2, 6)}`,
      deviceName: payload.deviceName,
      macAddress: payload.macAddress,
      protocol: payload.protocol,
      userType: payload.userType,
      accessMode: payload.accessMode,
      enabled: true,
      createdAt,
      expiresAt,
      expired: false,
      packageId: payload.selectedPackage?.id,
      packageName: payload.selectedPackage?.name,
      lastSyncedAt: createdAt,
    };

    const nextRules = [newRule, ...rules];
    setRules(nextRules);
    void routerApiService.syncFirewallRules(routerConfig, filterMode, nextRules);

    if (payload.accessMode === 'paid_package' && payload.selectedPackage) {
      const pkg = payload.selectedPackage;
      const payment: PaymentRecord = {
        id: `pay-${createdAt}-${Math.random().toString(36).slice(2, 6)}`,
        deviceName: payload.deviceName,
        macAddress: payload.macAddress,
        packageId: pkg.id,
        packageName: pkg.name,
        amountTzs: pkg.priceTzs,
        timestamp: createdAt,
        durationLabel: formatDurationLabel(pkg.durationValue, pkg.durationUnit, lang),
      };
      setPayments((prev) => [payment, ...prev]);
      showToast(t.firewall.ruleAddedWithPaymentToast, 'success');
    } else {
      showToast(t.firewall.ruleAddedToast, 'success');
    }
  };

  const handleUpdateRuleName = (ruleId: string, newName: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, deviceName: newName } : r))
    );
    showToast(t.firewall.ruleUpdatedToast, 'success');
  };

  const handleDeleteRule = (ruleId: string) => {
    const nextRules = rules.filter((r) => r.id !== ruleId);
    setRules(nextRules);
    void routerApiService.syncFirewallRules(routerConfig, filterMode, nextRules);
    showToast(t.firewall.ruleDeletedToast, 'info');
  };

  const handleRenewRule = (payload: RenewRulePayload) => {
    const target = rules.find((r) => r.id === payload.ruleId);
    if (!target) return;
    const current = Date.now();
    // If still active, extend from existing expiry; if expired, start fresh from now
    const baseTime =
      !target.expired && target.expiresAt && target.expiresAt > current
        ? target.expiresAt
        : current;
    const nextExpiresAt = baseTime + payload.durationMs;

    const nextRules = rules.map((r) =>
      r.id === payload.ruleId
        ? {
            ...r,
            enabled: true,
            expired: false,
            accessMode: payload.accessMode,
            expiresAt: nextExpiresAt,
            packageId: payload.selectedPackage?.id ?? r.packageId,
            packageName: payload.selectedPackage?.name ?? r.packageName,
            lastSyncedAt: current,
          }
        : r
    );
    setRules(nextRules);
    void routerApiService.syncFirewallRules(routerConfig, filterMode, nextRules);

    if (payload.accessMode === 'paid_package' && payload.selectedPackage) {
      const pkg = payload.selectedPackage;
      const payment: PaymentRecord = {
        id: `pay-${current}-${Math.random().toString(36).slice(2, 6)}`,
        deviceName: target.deviceName,
        macAddress: target.macAddress,
        packageId: pkg.id,
        packageName: pkg.name,
        amountTzs: pkg.priceTzs,
        timestamp: current,
        durationLabel: formatDurationLabel(pkg.durationValue, pkg.durationUnit, lang),
      };
      setPayments((prev) => [payment, ...prev]);
    }
    showToast(t.firewall.ruleRenewedToast, 'success');
  };

  // Handlers: Tab 3 (Vifurushi)
  const handleAddPackage = (pkg: Omit<WifiPackage, 'id' | 'createdAt'>) => {
    const newPkg: WifiPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      createdAt: Date.now(),
    };
    setPackages((prev) => [...prev, newPkg]);
    showToast(t.packages.packageSavedToast, 'success');
  };

  const handleUpdatePackage = (id: string, pkg: Omit<WifiPackage, 'id' | 'createdAt'>) => {
    setPackages((prev) => prev.map((item) => (item.id === id ? { ...item, ...pkg } : item)));
    showToast(t.packages.packageUpdatedToast, 'success');
  };

  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((item) => item.id !== id));
    showToast(t.packages.packageDeletedToast, 'info');
  };

  // Handlers: Tab 4 (Mapato)
  const handleDeletePayment = (id: string) => {
    setPayments((prev) => prev.filter((item) => item.id !== id));
    showToast(t.payments.recordDeletedToast, 'info');
  };

  const handleCopySummary = (text: string) => {
    void copyToClipboardSafe(text);
    showToast(t.payments.summaryCopiedToast, 'success');
  };

  const handleExportCsv = () => {
    showToast(t.payments.csvDownloadedToast, 'success');
  };

  // Handlers: Router Config & Demo Reset
  const handleSaveRouterConfig = (cfg: RouterConfig, verifiedLive?: boolean) => {
    setRouterConfig(cfg);
    if (cfg.mode === 'demo') {
      setConnectionState('demo');
      showToast(t.common.demoMode, 'info');
    } else {
      setConnectionState(verifiedLive ? 'connected' : 'disconnected');
      showToast(`${t.common.liveRouter} (${cfg.gatewayIp})`, 'success');
    }
  };

  const handleSyncFromRouter = async (cfg: RouterConfig) => {
    const res = await routerApiService.fetchRouterFirewallState(cfg);
    if (!res.ok) {
      showToast(t.routerModal.routerUnreachableMsg, 'warning');
      return;
    }
    if (res.mode) {
      setFilterMode(res.mode);
    }
    if (res.macs && res.macs.length > 0) {
      setRules((prev) => {
        const existingMacs = new Set(prev.map((r) => r.macAddress.toUpperCase()));
        const imported: FirewallRule[] = [];
        const ts = Date.now();
        res.macs?.forEach((mac, idx) => {
          if (!existingMacs.has(mac)) {
            imported.push({
              id: `rule-import-${ts}-${idx}`,
              deviceName: `Router Client ${mac.slice(-5)}`,
              macAddress: mac,
              protocol: 'IPv4/IPv6',
              userType: 'member',
              accessMode: 'permanent',
              enabled: true,
              createdAt: ts,
              expiresAt: null,
              expired: false,
            });
          }
        });
        return imported.length > 0 ? [...imported, ...prev] : prev;
      });
    }
    showToast(t.routerModal.syncedRulesToast, 'success');
  };

  const handleResetDemoData = () => {
    const fresh = storageService.resetAllDemoData();
    setRules(fresh.rules);
    setPackages(fresh.packages);
    setPayments(fresh.payments);
    setFilterMode(fresh.filterMode);
    showToast(t.routerModal.resetDoneToast, 'success');
  };

  const navItems: Array<{
    id: TabId;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'devices', label: t.tabs.devices, sub: t.tabs.devicesSub, icon: Smartphone },
    { id: 'firewall', label: t.tabs.firewall, sub: t.tabs.firewallSub, icon: Shield },
    { id: 'packages', label: t.tabs.packages, sub: t.tabs.packagesSub, icon: Package },
    { id: 'payments', label: t.tabs.payments, sub: t.tabs.paymentsSub, icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/90 z-30">
        <div className="h-16 px-5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1565D8] text-white flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
            {t.appName}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3.5 py-3 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#EEF4FF] text-[#1565D8] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm leading-tight truncate">{item.label}</p>
                  <p className="text-[11px] opacity-75 leading-tight mt-0.5 truncate">
                    {item.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            <Router className="w-4 h-4 text-[#1565D8] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {routerConfig.mode === 'demo' ? t.common.demoMode : routerConfig.gatewayIp}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{t.common.routerSettings}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')}
            className="w-full h-10 px-3.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>{lang === 'sw' ? 'Kiswahili' : 'English'}</span>
            </span>
            <span className="font-mono text-[#1565D8]">{lang === 'sw' ? 'SW → EN' : 'EN → SW'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Compact Mobile Top App Bar (52px) */}
        <header className="lg:hidden sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#1565D8] text-white flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
              {t.appName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')}
              aria-label="Toggle language"
              className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-mono font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              {lang === 'sw' ? 'SW' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={t.common.routerSettings}
              className="w-9 h-9 rounded-lg border border-slate-200 text-[#1565D8] flex items-center justify-center hover:bg-slate-50 cursor-pointer"
            >
              <Router className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 lg:pb-10">
          {/* Actionable Router Connection Strip */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-2xl bg-white border border-slate-200/90">
            <div className="flex items-center gap-2.5 min-w-0">
              <Router
                className={`w-4 h-4 shrink-0 ${
                  connectionState === 'connected'
                    ? 'text-emerald-600'
                    : connectionState === 'disconnected'
                      ? 'text-amber-600'
                      : 'text-[#1565D8]'
                }`}
              />
              <div className="min-w-0 text-xs sm:text-sm">
                <span className="font-semibold text-slate-900">
                  {connectionState === 'connected'
                    ? `${t.routerModal.connectedBanner} · ${routerConfig.gatewayIp}`
                    : connectionState === 'disconnected'
                      ? t.routerModal.disconnectedBanner
                      : t.routerModal.demoBanner}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSettingsFocusReal(true);
                setSettingsOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#EEF4FF] hover:bg-[#DFEAFE] text-[#1565D8] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>
                {connectionState === 'connected'
                  ? t.common.routerSettings
                  : t.routerModal.connectRealWifi}
              </span>
            </button>
          </div>

          {activeTab === 'devices' && (
            <DevicesTab
              devices={devices}
              rules={rules}
              isLoading={devicesLoading}
              isDemoMode={routerConfig.mode === 'demo'}
              routerUnreachable={routerConfig.mode === 'router' && connectionState === 'disconnected'}
              t={t}
              onRefresh={() => void fetchDevices(false)}
              onSimulateClient={handleSimulateClient}
              onCopyIp={handleCopyIp}
              onCopyMac={handleCopyMac}
              onQuickAddToFirewall={handleQuickAddToFirewall}
              onOpenRouterSettings={() => {
                setSettingsFocusReal(true);
                setSettingsOpen(true);
              }}
            />
          )}

          {activeTab === 'firewall' && (
            <FirewallTab
              rules={rules}
              filterMode={filterMode}
              packages={packages}
              copiedMac={copiedMac}
              now={now}
              lang={lang}
              t={t}
              prefillDevice={prefillDevice}
              onConsumePrefill={() => setPrefillDevice(null)}
              onChangeFilterMode={handleChangeFilterMode}
              onToggleRule={handleToggleRule}
              onAddRule={handleAddRule}
              onUpdateRuleName={handleUpdateRuleName}
              onDeleteRule={handleDeleteRule}
              onRenewRule={handleRenewRule}
              onCopyMac={handleCopyMac}
              onNotify={showToast}
            />
          )}

          {activeTab === 'packages' && (
            <PackagesTab
              packages={packages}
              lang={lang}
              t={t}
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onDeletePackage={handleDeletePackage}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab
              payments={payments}
              lang={lang}
              t={t}
              onDeletePayment={handleDeletePayment}
              onCopySummary={handleCopySummary}
              onExportCsv={handleExportCsv}
            />
          )}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (4 Main Tabs) */}
      <nav
        aria-label="Primary Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors cursor-pointer ${
                  active ? 'text-[#1565D8]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-[22px] h-[22px]" />
                <span className={`text-[11px] leading-tight whitespace-nowrap ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Router Configuration Modal */}
      {settingsOpen && (
        <RouterSettingsModal
          config={routerConfig}
          initialFocusRealRouter={settingsFocusReal}
          lang={lang}
          t={t}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsFocusReal(false);
          }}
          onSave={handleSaveRouterConfig}
          onSyncFromRouter={handleSyncFromRouter}
          onResetDemoData={handleResetDemoData}
          onNotify={showToast}
        />
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto rounded-xl bg-slate-900 text-white px-4 py-3 shadow-lg flex items-center gap-2.5 text-xs sm:text-sm font-medium"
            >
              {toast.tone === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.tone === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span className="leading-snug">{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
