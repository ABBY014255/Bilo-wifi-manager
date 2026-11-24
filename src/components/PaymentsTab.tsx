import React, { useMemo, useState } from 'react';
import { Copy, Download, ReceiptText, Search, Trash2, X } from 'lucide-react';
import { formatTimestamp, formatTzs, TranslationStrings } from '../i18n';
import { Language, PaymentRecord } from '../types';

interface PaymentsTabProps {
  payments: PaymentRecord[];
  lang: Language;
  t: TranslationStrings;
  onDeletePayment: (id: string) => void;
  onCopySummary: (summaryText: string) => void;
  onExportCsv: () => void;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

function getPeriodBoundaries() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset
  ).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return { startOfToday, startOfWeek, startOfMonth };
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  payments,
  lang,
  t,
  onDeletePayment,
  onCopySummary,
  onExportCsv,
}) => {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const { startOfToday, startOfWeek, startOfMonth } = getPeriodBoundaries();
    let todayTotal = 0;
    let todayCount = 0;
    let weekTotal = 0;
    let weekCount = 0;
    let monthTotal = 0;
    let monthCount = 0;
    let allTotal = 0;

    for (const p of payments) {
      allTotal += p.amountTzs;
      if (p.timestamp >= startOfToday) {
        todayTotal += p.amountTzs;
        todayCount += 1;
      }
      if (p.timestamp >= startOfWeek) {
        weekTotal += p.amountTzs;
        weekCount += 1;
      }
      if (p.timestamp >= startOfMonth) {
        monthTotal += p.amountTzs;
        monthCount += 1;
      }
    }

    return {
      todayTotal,
      todayCount,
      weekTotal,
      weekCount,
      monthTotal,
      monthCount,
      allTotal,
      allCount: payments.length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const { startOfToday, startOfWeek, startOfMonth } = getPeriodBoundaries();
    const q = search.trim().toLowerCase();

    return [...payments]
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((p) => {
        if (period === 'today' && p.timestamp < startOfToday) return false;
        if (period === 'week' && p.timestamp < startOfWeek) return false;
        if (period === 'month' && p.timestamp < startOfMonth) return false;
        if (!q) return true;
        return (
          p.deviceName.toLowerCase().includes(q) ||
          p.packageName.toLowerCase().includes(q) ||
          p.macAddress.toLowerCase().includes(q)
        );
      });
  }, [payments, period, search]);

  const handleCopyReport = () => {
    const dateStr = new Date().toLocaleDateString(lang === 'sw' ? 'en-GB' : 'en-US');
    const summary = [
      `Bilo wifi manager Pro — ${t.payments.title} (${dateStr})`,
      `${t.payments.today}: ${formatTzs(metrics.todayTotal)} (${metrics.todayCount})`,
      `${t.payments.thisWeek}: ${formatTzs(metrics.weekTotal)} (${metrics.weekCount})`,
      `${t.payments.thisMonth}: ${formatTzs(metrics.monthTotal)} (${metrics.monthCount})`,
      `${t.payments.allTime}: ${formatTzs(metrics.allTotal)} (${metrics.allCount} ${t.payments.transactionsCount})`,
    ].join('\n');
    onCopySummary(summary);
  };

  const handleDownloadCsv = () => {
    const headers = ['Date & Time', 'Customer / Device', 'MAC Address', 'Package', 'Duration', 'Amount (TZS)'];
    const rows = filteredPayments.map((p) => [
      new Date(p.timestamp).toISOString(),
      `"${p.deviceName.replace(/"/g, '""')}"`,
      p.macAddress,
      `"${p.packageName.replace(/"/g, '""')}"`,
      `"${p.durationLabel.replace(/"/g, '""')}"`,
      String(p.amountTzs),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bilo-wifi-mapato-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onExportCsv();
  };

  const summaryCards = [
    {
      key: 'today' as const,
      title: t.payments.today,
      sub: t.payments.todaySub,
      amount: metrics.todayTotal,
      count: metrics.todayCount,
      featured: true,
    },
    {
      key: 'week' as const,
      title: t.payments.thisWeek,
      sub: t.payments.thisWeekSub,
      amount: metrics.weekTotal,
      count: metrics.weekCount,
      featured: false,
    },
    {
      key: 'month' as const,
      title: t.payments.thisMonth,
      sub: t.payments.thisMonthSub,
      amount: metrics.monthTotal,
      count: metrics.monthCount,
      featured: false,
    },
    {
      key: 'all' as const,
      title: t.payments.allTime,
      sub: t.payments.allTimeSub,
      amount: metrics.allTotal,
      count: metrics.allCount,
      featured: false,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {t.payments.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.payments.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Copy className="w-4 h-4 text-[#1565D8]" />
            <span>{t.payments.copySummary}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filteredPayments.length === 0}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1052B5] transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.payments.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card) => {
          const isSelected = period === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setPeriod(card.key)}
              className={`text-left rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
                card.featured
                  ? 'bg-[#1565D8] text-white border-[#1565D8]'
                  : isSelected
                    ? 'bg-white border-[#1565D8] ring-2 ring-[#1565D8]/15'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  card.featured ? 'text-blue-100' : 'text-slate-600'
                }`}
              >
                {card.title}
              </p>
              <p
                className={`text-[11px] ${
                  card.featured ? 'text-blue-200/90' : 'text-slate-400'
                }`}
              >
                {card.sub}
              </p>
              <p
                className={`text-lg sm:text-xl font-mono font-bold tabular-nums mt-3 truncate ${
                  card.featured ? 'text-white' : 'text-slate-900'
                }`}
              >
                {formatTzs(card.amount)}
              </p>
              <p
                className={`text-xs mt-1 tabular-nums ${
                  card.featured ? 'text-blue-100/90' : 'text-slate-500'
                }`}
              >
                {card.count} {t.payments.transactionsCount}
              </p>
            </button>
          );
        })}
      </div>

      {/* Ledger Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.payments.searchPlaceholder}
            className="w-full h-11 pl-10 pr-9 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/15"
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
          {(
            [
              ['all', t.common.all],
              ['today', t.payments.today],
              ['week', t.payments.thisWeek],
              ['month', t.payments.thisMonth],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                period === key
                  ? 'bg-white text-[#1565D8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">{t.payments.ledgerTitle}</h2>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {filteredPayments.length} {t.payments.transactionsCount}
          </span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ReceiptText className="w-9 h-9 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">{t.payments.emptyTitle}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.payments.emptyDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden sm:table-header-group bg-slate-50/80 border-b border-slate-100 text-xs text-slate-500">
                <tr>
                  <th className="py-3 px-5 font-semibold">{t.payments.customerColumn}</th>
                  <th className="py-3 px-4 font-semibold">{t.payments.packageColumn}</th>
                  <th className="py-3 px-4 font-semibold">{t.payments.dateColumn}</th>
                  <th className="py-3 px-5 font-semibold text-right">{t.payments.amountColumn}</th>
                  <th className="py-3 pr-4 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((record) => {
                  const isConfirming = confirmDeleteId === record.id;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5 align-middle">
                        <p className="text-sm font-semibold text-slate-900">{record.deviceName}</p>
                        <p className="text-xs text-slate-500 sm:hidden mt-0.5">
                          {record.packageName} · {formatTimestamp(record.timestamp, lang)}
                        </p>
                      </td>
                      <td className="hidden sm:table-cell py-3.5 px-4 align-middle">
                        <p className="text-sm text-slate-800">{record.packageName}</p>
                        <p className="text-xs text-slate-500">{record.durationLabel}</p>
                      </td>
                      <td className="hidden sm:table-cell py-3.5 px-4 align-middle text-xs font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatTimestamp(record.timestamp, lang)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 align-middle text-right whitespace-nowrap">
                        <span className="text-sm font-mono font-bold tabular-nums text-emerald-700">
                          {formatTzs(record.amountTzs)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 sm:pr-4 align-middle text-right">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePayment(record.id);
                                setConfirmDeleteId(null);
                              }}
                              className="h-8 px-2.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
                            >
                              {t.common.delete}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-8 px-2 rounded-lg text-slate-500 hover:bg-slate-100 text-xs cursor-pointer"
                            >
                              {t.common.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(record.id)}
                            aria-label={t.common.delete}
                            className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
