import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Copy,
  Laptop,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldPlus,
  Smartphone,
  Tv,
  Wifi,
  X,
} from 'lucide-react';
import { TranslationStrings } from '../i18n';
import { ConnectionBand, ConnectedDevice, FirewallRule } from '../types';

interface DevicesTabProps {
  devices: ConnectedDevice[];
  rules: FirewallRule[];
  isLoading: boolean;
  isDemoMode: boolean;
  routerUnreachable: boolean;
  t: TranslationStrings;
  onRefresh: () => void;
  onSimulateClient: () => void;
  onCopyIp: (ip: string) => void;
  onCopyMac: (mac: string) => void;
  onQuickAddToFirewall: (device: ConnectedDevice) => void;
  onOpenRouterSettings: () => void;
}

function getDeviceIcon(hostname: string, band: ConnectionBand) {
  const lower = hostname.toLowerCase();
  if (lower.includes('tv') || lower.includes('webos')) return Tv;
  if (lower.includes('laptop') || lower.includes('hp') || lower.includes('lenovo') || lower.includes('macbook') || band === 'LAN') {
    return Laptop;
  }
  return Smartphone;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  devices,
  rules,
  isLoading,
  isDemoMode,
  routerUnreachable,
  t,
  onRefresh,
  onSimulateClient,
  onCopyIp,
  onCopyMac,
  onQuickAddToFirewall,
  onOpenRouterSettings,
}) => {
  const [search, setSearch] = useState('');
  const [bandFilter, setBandFilter] = useState<'all' | ConnectionBand>('all');
  const [selectedDevice, setSelectedDevice] = useState<ConnectedDevice | null>(null);
  const [copiedField, setCopiedField] = useState<'ip' | 'mac' | null>(null);

  const rulesByMac = useMemo(() => {
    const map = new Map<string, FirewallRule>();
    for (const r of rules) {
      map.set(r.macAddress.toUpperCase(), r);
    }
    return map;
  }, [rules]);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((dev) => {
      if (bandFilter !== 'all' && dev.connectionType !== bandFilter) return false;
      if (!q) return true;
      const linkedRule = rulesByMac.get(dev.macAddress.toUpperCase());
      return (
        dev.hostname.toLowerCase().includes(q) ||
        dev.ipAddress.toLowerCase().includes(q) ||
        dev.macAddress.toLowerCase().includes(q) ||
        (linkedRule?.deviceName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [devices, bandFilter, search, rulesByMac]);

  const handleCopyIpClick = (ip: string) => {
    onCopyIp(ip);
    setCopiedField('ip');
    window.setTimeout(() => setCopiedField(null), 1600);
  };

  const handleCopyMacClick = (mac: string) => {
    onCopyMac(mac);
    setCopiedField('mac');
    window.setTimeout(() => setCopiedField(null), 1600);
  };

  const selectedRule = selectedDevice
    ? rulesByMac.get(selectedDevice.macAddress.toUpperCase())
    : undefined;

  return (
    <div className="space-y-5">
      {/* Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {t.devices.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.devices.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDemoMode && (
            <button
              type="button"
              onClick={onSimulateClient}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#1565D8]" />
              <span>{t.devices.simulateJoin}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-[#1565D8] text-white text-sm font-medium hover:bg-[#1052B5] active:scale-[0.98] transition-all disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Search & Connection Band Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.devices.searchPlaceholder}
            className="w-full h-11 pl-10 pr-9 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
          {(['all', '2.4GHz', '5GHz', 'LAN'] as const).map((band) => {
            const active = bandFilter === band;
            return (
              <button
                key={band}
                type="button"
                onClick={() => setBandFilter(band)}
                className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#1565D8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {band === 'all' ? `${t.common.all} (${devices.length})` : band}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Devices List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-700 tabular-nums">
            {filteredDevices.length} {t.devices.connectedCount}
          </span>
          <span>2.4GHz · 5GHz · LAN</span>
        </div>

        {isLoading && devices.length === 0 ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="px-4 sm:px-5 py-4 flex items-center gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-40" />
                  <div className="h-3 bg-slate-100 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Wifi className="w-9 h-9 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">{t.devices.emptyTitle}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {routerUnreachable ? t.routerModal.routerUnreachableMsg : t.devices.emptyDesc}
            </p>
            {routerUnreachable && (
              <button
                type="button"
                onClick={onOpenRouterSettings}
                className="mt-4 inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-[#1565D8] hover:bg-[#1052B5] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>{t.routerModal.connectRealWifi}</span>
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredDevices.map((device) => {
              const Icon = getDeviceIcon(device.hostname, device.connectionType);
              const linkedRule = rulesByMac.get(device.macAddress.toUpperCase());

              return (
                <li key={device.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedField(null);
                      setSelectedDevice(device);
                    }}
                    className="w-full px-4 sm:px-5 py-3.5 min-h-[68px] flex items-center gap-3.5 text-left hover:bg-slate-50/90 active:bg-slate-100/80 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#1565D8] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate">
                          {device.hostname}
                        </span>
                        {linkedRule && (
                          <span className="text-xs font-medium text-[#1565D8] truncate shrink-0">
                            ({linkedRule.deviceName})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-medium text-slate-700">
                          {device.connectionType}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {device.ipAddress}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            device.online
                              ? 'text-emerald-700 font-medium'
                              : 'text-slate-400 font-medium'
                          }
                        >
                          {device.online ? t.common.online : t.common.offline}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Device Details Drawer / Modal */}
      {selectedDevice && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-[2px] p-0 sm:p-4"
          onClick={() => setSelectedDevice(null)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {t.devices.deviceDetails}
                </h2>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {selectedDevice.hostname}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDevice(null)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Key-value details */}
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                <div className="py-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {t.devices.hostname}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 text-right truncate">
                    {selectedDevice.hostname}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {t.devices.connectionType}
                  </span>
                  <span className="text-sm font-medium text-slate-800 inline-flex items-center gap-1.5">
                    {selectedDevice.connectionType === 'LAN' ? (
                      <Network className="w-4 h-4 text-[#1565D8]" />
                    ) : (
                      <Wifi className="w-4 h-4 text-[#1565D8]" />
                    )}
                    <span>{selectedDevice.connectionType}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-emerald-700 font-semibold">
                      {selectedDevice.online ? t.common.online : t.common.offline}
                    </span>
                  </span>
                </div>

                {/* IP Address Row with one-tap Copy */}
                <div className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{t.devices.ipAddress}</p>
                    <p className="text-sm font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
                      {selectedDevice.ipAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyIpClick(selectedDevice.ipAddress)}
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedField === 'ip' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{t.common.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.devices.copyIp}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* MAC Address Display */}
                <div className="py-3">
                  <p className="text-xs font-medium text-slate-500">{t.devices.macAddress}</p>
                  <p className="text-base font-mono font-bold tracking-wider tabular-nums text-slate-900 mt-1">
                    {selectedDevice.macAddress}
                  </p>
                </div>
              </div>

              {/* Prominent One-Tap Copy MAC Address Button */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyMacClick(selectedDevice.macAddress)}
                  className="w-full h-12 rounded-xl bg-[#1565D8] hover:bg-[#1052B5] active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedField === 'mac' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.common.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t.devices.copyMac}</span>
                    </>
                  )}
                </button>

                {selectedRule ? (
                  <p className="text-center text-xs text-slate-500 py-1">
                    {t.devices.alreadyInFirewall}: <strong className="text-slate-800">{selectedRule.deviceName}</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const dev = selectedDevice;
                      setSelectedDevice(null);
                      onQuickAddToFirewall(dev);
                    }}
                    className="w-full h-11 rounded-xl bg-[#EEF4FF] hover:bg-[#DFEAFE] text-[#1565D8] text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldPlus className="w-4 h-4" />
                    <span>{t.devices.addToFirewall}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
