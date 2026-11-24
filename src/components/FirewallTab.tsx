import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Clock,
  Copy,
  Edit2,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  durationToMs,
  formatCountdown,
  formatDurationLabel,
  formatTimestamp,
  formatTzs,
  isValidMac,
  normalizeMac,
  TranslationStrings,
} from '../i18n';
import {
  CustomerAccessMode,
  DurationUnit,
  FirewallFilterMode,
  FirewallRule,
  Language,
  ProtocolType,
  UserType,
  WifiPackage,
} from '../types';

export interface AddRulePayload {
  deviceName: string;
  macAddress: string;
  protocol: ProtocolType;
  userType: UserType;
  accessMode: 'permanent' | CustomerAccessMode;
  durationMs: number | null;
  selectedPackage?: WifiPackage;
}

export interface RenewRulePayload {
  ruleId: string;
  accessMode: CustomerAccessMode;
  durationMs: number;
  selectedPackage?: WifiPackage;
}

interface FirewallTabProps {
  rules: FirewallRule[];
  filterMode: FirewallFilterMode;
  packages: WifiPackage[];
  copiedMac: string;
  now: number;
  lang: Language;
  t: TranslationStrings;
  prefillDevice: { name: string; mac: string } | null;
  onConsumePrefill: () => void;
  onChangeFilterMode: (mode: FirewallFilterMode) => void;
  onToggleRule: (ruleId: string) => void;
  onAddRule: (payload: AddRulePayload) => void;
  onUpdateRuleName: (ruleId: string, newName: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onRenewRule: (payload: RenewRulePayload) => void;
  onCopyMac: (mac: string) => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

const TIMER_PRESETS: Array<{ value: number; unit: DurationUnit; tagSw: string; tagEn: string }> = [
  { value: 1, unit: 'minutes', tagSw: 'Dakika 1 (Jaribu)', tagEn: '1 Min (Test)' },
  { value: 1, unit: 'hours', tagSw: 'Saa 1', tagEn: '1 Hour' },
  { value: 2, unit: 'hours', tagSw: 'Masaa 2', tagEn: '2 Hours' },
  { value: 6, unit: 'hours', tagSw: 'Masaa 6', tagEn: '6 Hours' },
  { value: 24, unit: 'hours', tagSw: 'Masaa 24', tagEn: '24 Hours' },
  { value: 7, unit: 'days', tagSw: 'Siku 7', tagEn: '7 Days' },
];

export const FirewallTab: React.FC<FirewallTabProps> = ({
  rules,
  filterMode,
  packages,
  copiedMac,
  now,
  lang,
  t,
  prefillDevice,
  onConsumePrefill,
  onChangeFilterMode,
  onToggleRule,
  onAddRule,
  onUpdateRuleName,
  onDeleteRule,
  onRenewRule,
  onCopyMac,
  onNotify,
}) => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [copiedDetailMac, setCopiedDetailMac] = useState(false);

  // Edit name inside detail modal
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Renew customer modal state
  const [renewModeOpen, setRenewModeOpen] = useState(false);
  const [renewAccessMode, setRenewAccessMode] = useState<CustomerAccessMode>('paid_package');
  const [renewDurationVal, setRenewDurationVal] = useState('24');
  const [renewDurationUnit, setRenewDurationUnit] = useState<DurationUnit>('hours');
  const [renewPackageId, setRenewPackageId] = useState<string>(packages[0]?.id || '');

  // Add Rule Form State
  const [deviceName, setDeviceName] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [protocol, setProtocol] = useState<ProtocolType>('IPv4/IPv6');
  const [userType, setUserType] = useState<UserType>('member');
  const [customerMode, setCustomerMode] = useState<CustomerAccessMode>('paid_package');
  const [customVal, setCustomVal] = useState('2');
  const [customUnit, setCustomUnit] = useState<DurationUnit>('hours');
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [formError, setFormError] = useState('');

  const selectedRule = rules.find((r) => r.id === selectedRuleId) || null;

  // Sync default package selection when packages change
  useEffect(() => {
    if (packages.length > 0 && !packages.some((p) => p.id === selectedPkgId)) {
      setSelectedPkgId(packages[0].id);
    }
    if (packages.length > 0 && !packages.some((p) => p.id === renewPackageId)) {
      setRenewPackageId(packages[0].id);
    }
  }, [packages, selectedPkgId, renewPackageId]);

  // Open Add Rule prefilled if user tapped "Add to Firewall" from Tab 1
  useEffect(() => {
    if (prefillDevice) {
      setDeviceName(prefillDevice.name);
      setMacAddress(normalizeMac(prefillDevice.mac));
      setProtocol('IPv4/IPv6');
      setUserType('customer');
      setCustomerMode(packages.length > 0 ? 'paid_package' : 'custom_timer');
      setFormError('');
      setAddModalOpen(true);
      onConsumePrefill();
    }
  }, [prefillDevice, packages.length, onConsumePrefill]);

  const openAddModal = () => {
    setDeviceName('');
    setMacAddress('');
    setProtocol('IPv4/IPv6');
    setUserType('member');
    setCustomerMode(packages.length > 0 ? 'paid_package' : 'custom_timer');
    setCustomVal('2');
    setCustomUnit('hours');
    setSelectedPkgId(packages[0]?.id || '');
    setFormError('');
    setAddModalOpen(true);
  };

  const handlePasteCopiedMac = async () => {
    if (copiedMac && isValidMac(copiedMac)) {
      setMacAddress(copiedMac);
      setFormError('');
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      const normalized = normalizeMac(text);
      if (isValidMac(normalized)) {
        setMacAddress(normalized);
        setFormError('');
        return;
      }
    } catch {
      // Clipboard API unavailable in iframe; rely on app state
    }
    onNotify(t.firewall.noCopiedMacToast, 'warning');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = deviceName.trim();
    const normalizedMac = normalizeMac(macAddress);

    if (!trimmedName) {
      setFormError(t.firewall.nameRequiredError);
      return;
    }
    if (!isValidMac(normalizedMac)) {
      setFormError(t.firewall.invalidMacError);
      return;
    }
    if (rules.some((r) => r.macAddress.toUpperCase() === normalizedMac)) {
      setFormError(t.firewall.duplicateMacError);
      return;
    }

    if (userType === 'member') {
      onAddRule({
        deviceName: trimmedName,
        macAddress: normalizedMac,
        protocol,
        userType: 'member',
        accessMode: 'permanent',
        durationMs: null,
      });
      setAddModalOpen(false);
      return;
    }

    // Mteja (Customer)
    if (customerMode === 'custom_timer') {
      const val = Number(customVal);
      if (!Number.isFinite(val) || val <= 0) {
        setFormError(t.packages.validationError);
        return;
      }
      onAddRule({
        deviceName: trimmedName,
        macAddress: normalizedMac,
        protocol,
        userType: 'customer',
        accessMode: 'custom_timer',
        durationMs: durationToMs(Math.round(val), customUnit),
      });
      setAddModalOpen(false);
      return;
    }

    // Paid Package Billing
    const chosenPkg = packages.find((p) => p.id === selectedPkgId);
    if (!chosenPkg) {
      setFormError(t.firewall.noPackagesHint);
      return;
    }

    onAddRule({
      deviceName: trimmedName,
      macAddress: normalizedMac,
      protocol,
      userType: 'customer',
      accessMode: 'paid_package',
      durationMs: durationToMs(chosenPkg.durationValue, chosenPkg.durationUnit),
      selectedPackage: chosenPkg,
    });
    setAddModalOpen(false);
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;

    if (renewAccessMode === 'custom_timer') {
      const val = Number(renewDurationVal);
      if (!Number.isFinite(val) || val <= 0) return;
      onRenewRule({
        ruleId: selectedRule.id,
        accessMode: 'custom_timer',
        durationMs: durationToMs(Math.round(val), renewDurationUnit),
      });
      setRenewModeOpen(false);
      return;
    }

    const chosenPkg = packages.find((p) => p.id === renewPackageId);
    if (!chosenPkg) return;
    onRenewRule({
      ruleId: selectedRule.id,
      accessMode: 'paid_package',
      durationMs: durationToMs(chosenPkg.durationValue, chosenPkg.durationUnit),
      selectedPackage: chosenPkg,
    });
    setRenewModeOpen(false);
  };

  const openDetails = (rule: FirewallRule) => {
    setSelectedRuleId(rule.id);
    setEditNameValue(rule.deviceName);
    setEditingName(false);
    setConfirmDelete(false);
    setRenewModeOpen(false);
    setCopiedDetailMac(false);
  };

  const modeHelperText =
    filterMode === 'whitelist'
      ? t.firewall.whitelistHelp
      : filterMode === 'blacklist'
        ? t.firewall.blacklistHelp
        : t.firewall.disabledBanner;

  return (
    <div className="space-y-5">
      {/* Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {t.firewall.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.firewall.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1052B5] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.firewall.addRule}</span>
        </button>
      </div>

      {/* Filter Mode Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-600">
            {t.firewall.filterModeLabel}
          </span>
          <span className="text-xs text-slate-500">{t.firewall.modes[filterMode].desc}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(
            [
              { id: 'whitelist', icon: ShieldCheck },
              { id: 'blacklist', icon: ShieldAlert },
              { id: 'disabled', icon: ShieldOff },
            ] as const
          ).map(({ id, icon: Icon }) => {
            const active = filterMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChangeFilterMode(id)}
                className={`h-10 px-2.5 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? id === 'disabled'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : id === 'blacklist'
                        ? 'bg-white text-red-700 shadow-xs'
                        : 'bg-white text-[#1565D8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.firewall.modes[id].label}</span>
              </button>
            );
          })}
        </div>

        <p
          className={`text-xs flex items-start gap-2 ${
            filterMode === 'disabled' ? 'text-amber-700 font-medium' : 'text-slate-500'
          }`}
        >
          {filterMode === 'disabled' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{modeHelperText}</span>
        </p>
      </div>

      {/* Clean Device-First Numbered Firewall List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700 tabular-nums">
            {rules.length} {t.tabs.devices}
          </span>
          <span>
            {rules.filter((r) => r.enabled && !r.expired).length} {t.common.active} ·{' '}
            {rules.filter((r) => r.expired).length} {t.common.expired.split(' ')[0]}
          </span>
        </div>

        {rules.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Shield className="w-9 h-9 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">{t.firewall.emptyTitle}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.firewall.emptyDesc}</p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1052B5] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.firewall.addRule}</span>
            </button>
          </div>
        ) : (
          <ol className="divide-y divide-slate-100">
            {rules.map((rule, index) => {
              const remainingMs =
                rule.userType === 'customer' && rule.expiresAt !== null
                  ? Math.max(0, rule.expiresAt - now)
                  : null;
              const isExpiringSoon =
                remainingMs !== null && remainingMs > 0 && remainingMs <= 15 * 60 * 1000;

              return (
                <li
                  key={rule.id}
                  className="px-4 sm:px-5 py-3.5 min-h-[68px] flex items-center justify-between gap-3 hover:bg-slate-50/75 transition-colors"
                >
                  {/* Tap device name/row area to inspect MAC & technical details */}
                  <button
                    type="button"
                    onClick={() => openDetails(rule)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 text-left cursor-pointer py-0.5"
                  >
                    <span className="w-7 text-sm font-mono font-semibold tabular-nums text-slate-400 shrink-0">
                      {index + 1}.
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm sm:text-[15px] font-semibold truncate ${
                          rule.expired ? 'text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {rule.deviceName}
                      </p>

                      {/* Clean unboxed metadata subtitle (Zero-pill discipline) */}
                      <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
                        {rule.userType === 'member' ? (
                          <>
                            <span className="font-semibold text-[#1565D8]">
                              {t.common.member}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="text-slate-500">{t.common.permanentAccess}</span>
                          </>
                        ) : rule.expired ? (
                          <>
                            <span className="font-semibold text-slate-600">
                              {t.common.customer}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="font-semibold text-red-600">{t.common.expired}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-600">
                              {t.common.customer}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span
                              className={`font-mono font-semibold tabular-nums inline-flex items-center gap-1 ${
                                isExpiringSoon ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {remainingMs !== null ? formatCountdown(remainingMs, lang) : '--'}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Right-Side Active/Inactive Toggle Switch */}
                  <div className="shrink-0 pl-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rule.enabled}
                      aria-label={`Toggle ${rule.deviceName}`}
                      onClick={() => {
                        if (rule.expired && !rule.enabled) {
                          // If expired, open detail sheet directly to Renew Time
                          openDetails(rule);
                          setRenewModeOpen(true);
                          return;
                        }
                        onToggleRule(rule.id);
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1565D8] cursor-pointer ${
                        rule.enabled ? 'bg-[#1565D8]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                          rule.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Technical Details Modal/Sheet */}
      {selectedRule && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-[2px] p-0 sm:p-4"
          onClick={() => setSelectedRuleId(null)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {selectedRule.deviceName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.firewall.ruleDetails}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRuleId(null)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Inline Edit Device Name */}
              {editingName && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = editNameValue.trim();
                      if (trimmed) {
                        onUpdateRuleName(selectedRule.id, trimmed);
                        setEditingName(false);
                      }
                    }}
                    className="h-10 px-3.5 rounded-xl bg-[#1565D8] text-white text-xs font-semibold hover:bg-[#1052B5] cursor-pointer"
                  >
                    {t.common.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditNameValue(selectedRule.deviceName);
                      setEditingName(false);
                    }}
                    className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              )}

              {/* Technical Metadata Table */}
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                <div className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{t.firewall.macAddress}</p>
                    <p className="text-sm font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                      {selectedRule.macAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onCopyMac(selectedRule.macAddress);
                      setCopiedDetailMac(true);
                      window.setTimeout(() => setCopiedDetailMac(false), 1500);
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer shrink-0"
                  >
                    {copiedDetailMac ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{t.common.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.common.copy}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">{t.firewall.protocol}</span>
                  <span className="text-sm font-mono font-semibold text-slate-900">
                    {selectedRule.protocol}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {t.firewall.userTypeQuestion.split('?')[0]}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {selectedRule.userType === 'member'
                      ? `${t.common.member} · ${t.common.permanentAccess}`
                      : selectedRule.packageName
                        ? `${t.common.customer} · ${selectedRule.packageName}`
                        : t.common.customer}
                  </span>
                </div>

                {selectedRule.userType === 'customer' && (
                  <>
                    <div className="py-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-500">
                        {t.firewall.remainingTime}
                      </span>
                      <span
                        className={`text-sm font-mono font-bold tabular-nums ${
                          selectedRule.expired ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {selectedRule.expired
                          ? t.common.expired
                          : selectedRule.expiresAt
                            ? formatCountdown(Math.max(0, selectedRule.expiresAt - now), lang)
                            : '--'}
                      </span>
                    </div>

                    {selectedRule.expiresAt && (
                      <div className="py-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          {t.firewall.expiresAt}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-slate-700">
                          {formatTimestamp(selectedRule.expiresAt, lang)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Renew / Extend Time Sub-Form for Mteja */}
              {selectedRule.userType === 'customer' && renewModeOpen && (
                <form
                  onSubmit={handleRenewSubmit}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <p className="text-xs font-bold text-slate-800">{t.firewall.renewTitle}</p>

                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRenewAccessMode('paid_package')}
                      className={`h-9 rounded-lg text-xs font-semibold cursor-pointer ${
                        renewAccessMode === 'paid_package'
                          ? 'bg-white text-[#1565D8] shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {t.firewall.paidPackageTitle.split(' (')[0]}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewAccessMode('custom_timer')}
                      className={`h-9 rounded-lg text-xs font-semibold cursor-pointer ${
                        renewAccessMode === 'custom_timer'
                          ? 'bg-white text-[#1565D8] shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {t.firewall.customTimerTitle.split(' (')[0]}
                    </button>
                  </div>

                  {renewAccessMode === 'paid_package' ? (
                    <div className="space-y-1.5">
                      {packages.map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setRenewPackageId(pkg.id)}
                          className={`w-full px-3 py-2.5 rounded-xl border text-left flex items-center justify-between text-xs cursor-pointer ${
                            renewPackageId === pkg.id
                              ? 'border-[#1565D8] bg-[#EEF4FF]/60 font-semibold text-slate-900'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span>
                            {pkg.name} · {formatDurationLabel(pkg.durationValue, pkg.durationUnit, lang)}
                          </span>
                          <span className="font-mono font-bold text-[#1565D8]">
                            {formatTzs(pkg.priceTzs)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={1}
                        value={renewDurationVal}
                        onChange={(e) => setRenewDurationVal(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono text-sm"
                      />
                      <select
                        value={renewDurationUnit}
                        onChange={(e) => setRenewDurationUnit(e.target.value as DurationUnit)}
                        className="h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                      >
                        <option value="minutes">{t.packages.units.minutes}</option>
                        <option value="hours">{t.packages.units.hours}</option>
                        <option value="days">{t.packages.units.days}</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRenewModeOpen(false)}
                      className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-10 rounded-xl bg-[#1565D8] text-white text-xs font-semibold hover:bg-[#1052B5] cursor-pointer"
                    >
                      {t.firewall.renewConfirm}
                    </button>
                  </div>
                </form>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {selectedRule.userType === 'customer' && !renewModeOpen && (
                  <button
                    type="button"
                    onClick={() => setRenewModeOpen(true)}
                    className="w-full h-11 rounded-xl bg-[#1565D8] hover:bg-[#1052B5] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.firewall.renewTime}</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="h-11 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{t.firewall.editName}</span>
                  </button>

                  {confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteRule(selectedRule.id);
                        setSelectedRuleId(null);
                      }}
                      className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t.common.confirmDelete}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="h-11 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t.firewall.deleteRule}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* + Add Rule Smart Conditional Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-[2px] p-0 sm:p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">{t.firewall.addRule}</h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 overflow-y-auto">
              {formError && (
                <div className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Device Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.firewall.deviceName} *
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => {
                    setDeviceName(e.target.value);
                    setFormError('');
                  }}
                  placeholder={t.firewall.deviceNamePlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15"
                  required
                />
              </div>

              {/* 2. MAC Address + Quick Paste Copied MAC */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.firewall.macAddress} *
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteCopiedMac}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565D8] hover:text-[#1052B5] cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>{t.firewall.pasteCopiedMac}</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={macAddress}
                  onChange={(e) => {
                    setMacAddress(normalizeMac(e.target.value));
                    setFormError('');
                  }}
                  placeholder={t.firewall.macPlaceholder}
                  maxLength={17}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-mono text-sm uppercase tracking-wider text-slate-900 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15"
                  required
                />
                {copiedMac && !macAddress && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    {t.common.copied}: {copiedMac}
                  </p>
                )}
              </div>

              {/* 3. Protocol Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.firewall.protocol}
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {(['IPv4/IPv6', 'IPv4'] as const).map((proto) => (
                    <button
                      key={proto}
                      type="button"
                      onClick={() => setProtocol(proto)}
                      className={`h-9 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        protocol === proto
                          ? 'bg-white text-[#1565D8] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {proto}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. User Type Classification ("Huyu ni nani?") */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.firewall.userTypeQuestion}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUserType('member');
                      setFormError('');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      userType === 'member'
                        ? 'border-[#1565D8] bg-[#EEF4FF]/65 ring-1 ring-[#1565D8]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <UserCheck className="w-4 h-4 text-[#1565D8] shrink-0" />
                      <span className="truncate">{t.firewall.memberOptionTitle}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{t.firewall.memberOptionDesc}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserType('customer');
                      setFormError('');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      userType === 'customer'
                        ? 'border-[#1565D8] bg-[#EEF4FF]/65 ring-1 ring-[#1565D8]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <UserPlus className="w-4 h-4 text-[#1565D8] shrink-0" />
                      <span className="truncate">{t.firewall.customerOptionTitle}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{t.firewall.customerOptionDesc}</p>
                  </button>
                </div>
              </div>

              {/* Conditional Section: Member vs Mteja */}
              {userType === 'member' ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-xs text-slate-600">
                  {t.firewall.memberSkipNotice}
                </div>
              ) : (
                <div className="space-y-4 pt-1 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t.firewall.accessDurationMode}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomerMode('paid_package')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          customerMode === 'paid_package'
                            ? 'border-[#1565D8] bg-[#EEF4FF]/60'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">
                          {t.firewall.paidPackageTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {t.firewall.paidPackageDesc}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCustomerMode('custom_timer')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          customerMode === 'custom_timer'
                            ? 'border-[#1565D8] bg-[#EEF4FF]/60'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">
                          {t.firewall.customTimerTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {t.firewall.customTimerDesc}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Custom Auto-Block Timer (No cash logged) */}
                  {customerMode === 'custom_timer' ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          {t.firewall.quickPresets}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {TIMER_PRESETS.map((preset) => {
                            const selected =
                              Number(customVal) === preset.value && customUnit === preset.unit;
                            return (
                              <button
                                key={`${preset.value}-${preset.unit}`}
                                type="button"
                                onClick={() => {
                                  setCustomVal(String(preset.value));
                                  setCustomUnit(preset.unit);
                                }}
                                className={`h-10 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer truncate ${
                                  selected
                                    ? 'border-[#1565D8] bg-[#1565D8] text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {lang === 'sw' ? preset.tagSw : preset.tagEn}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1.5">
                          {t.firewall.customDuration}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={customVal}
                            onChange={(e) => setCustomVal(e.target.value)}
                            className="h-11 px-3.5 rounded-xl border border-slate-200 font-mono text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                          />
                          <select
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value as DurationUnit)}
                            className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#1565D8]"
                          >
                            <option value="minutes">{t.packages.units.minutes}</option>
                            <option value="hours">{t.packages.units.hours}</option>
                            <option value="days">{t.packages.units.days}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: Paid Package Billing (Logs cash in Tab 4) */
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        {t.firewall.selectPackage}
                      </label>

                      {packages.length === 0 ? (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                          {t.firewall.noPackagesHint}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {packages.map((pkg) => {
                            const selected = selectedPkgId === pkg.id;
                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => setSelectedPkgId(pkg.id)}
                                className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                                  selected
                                    ? 'border-[#1565D8] bg-[#EEF4FF]/65 ring-1 ring-[#1565D8]/20'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {pkg.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDurationLabel(pkg.durationValue, pkg.durationUnit, lang)}
                                  </p>
                                </div>
                                <span className="text-sm font-mono font-bold tabular-nums text-[#1565D8] shrink-0">
                                  {formatTzs(pkg.priceTzs)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#1565D8] hover:bg-[#1052B5] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t.firewall.saveRule}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
