import React, { useState } from 'react';
import { Clock, Edit2, Package, Plus, Trash2, X } from 'lucide-react';
import { formatDurationLabel, formatTzs, TranslationStrings } from '../i18n';
import { DurationUnit, Language, WifiPackage } from '../types';

interface PackagesTabProps {
  packages: WifiPackage[];
  lang: Language;
  t: TranslationStrings;
  onAddPackage: (pkg: Omit<WifiPackage, 'id' | 'createdAt'>) => void;
  onUpdatePackage: (id: string, pkg: Omit<WifiPackage, 'id' | 'createdAt'>) => void;
  onDeletePackage: (id: string) => void;
}

export const PackagesTab: React.FC<PackagesTabProps> = ({
  packages,
  lang,
  t,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<WifiPackage | null>(null);
  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [durationStr, setDurationStr] = useState('24');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('hours');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingPkg(null);
    setName('');
    setPriceStr('1000');
    setDurationStr('24');
    setDurationUnit('hours');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (pkg: WifiPackage) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setPriceStr(String(pkg.priceTzs));
    setDurationStr(String(pkg.durationValue));
    setDurationUnit(pkg.durationUnit);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const price = Number(priceStr);
    const duration = Number(durationStr);

    if (!trimmedName || !Number.isFinite(price) || price <= 0 || !Number.isFinite(duration) || duration <= 0) {
      setError(t.packages.validationError);
      return;
    }

    const payload = {
      name: trimmedName,
      priceTzs: Math.round(price),
      durationValue: Math.round(duration),
      durationUnit,
    };

    if (editingPkg) {
      onUpdatePackage(editingPkg.id, payload);
    } else {
      onAddPackage(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {t.packages.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.packages.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1052B5] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.packages.addPackage}</span>
        </button>
      </div>

      {/* Info Line */}
      <p className="text-xs text-slate-500">{t.packages.usedInBillingNote}</p>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 px-6 py-12 text-center">
          <Package className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">{t.packages.emptyTitle}</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.packages.emptyDesc}</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1052B5] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.packages.addPackage}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packages.map((pkg) => {
            const isConfirmingDelete = confirmDeleteId === pkg.id;
            return (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">{pkg.name}</h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Clock className="w-3.5 h-3.5 text-[#1565D8] shrink-0" />
                      <span>{formatDurationLabel(pkg.durationValue, pkg.durationUnit, lang)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-mono font-bold tabular-nums text-[#1565D8]">
                      {formatTzs(pkg.priceTzs)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {isConfirmingDelete ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-10 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeletePackage(pkg.id);
                          setConfirmDeleteId(null);
                        }}
                        className="h-10 px-3.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
                      >
                        {t.common.confirmDelete}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(pkg)}
                        className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t.common.edit}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(pkg.id)}
                        aria-label={t.common.delete}
                        className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.common.delete}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Package Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-[2px] p-0 sm:p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingPkg ? t.packages.editPackage : t.packages.addPackage}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.packages.packageName}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.packages.packageNamePlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.packages.priceTzs}
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  placeholder="1000"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-mono text-sm text-slate-900 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.packages.durationValue}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={durationStr}
                    onChange={(e) => setDurationStr(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-mono text-sm text-slate-900 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.packages.durationUnit}
                  </label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15"
                  >
                    <option value="minutes">{t.packages.units.minutes}</option>
                    <option value="hours">{t.packages.units.hours}</option>
                    <option value="days">{t.packages.units.days}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#1565D8] hover:bg-[#1052B5] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
