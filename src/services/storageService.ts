import {
  FirewallFilterMode,
  FirewallRule,
  Language,
  PaymentRecord,
  RouterConfig,
  WifiPackage,
} from '../types';

const KEYS = {
  RULES: 'bilo_wifi_firewall_rules_v1',
  FILTER_MODE: 'bilo_wifi_filter_mode_v1',
  PACKAGES: 'bilo_wifi_packages_v1',
  PAYMENTS: 'bilo_wifi_payments_v1',
  ROUTER_CONFIG: 'bilo_wifi_router_config_v1',
  LANGUAGE: 'bilo_wifi_language_v1',
  COPIED_MAC: 'bilo_wifi_copied_mac_v1',
} as const;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function getDefaultPackages(): WifiPackage[] {
  const now = Date.now();
  return [
    {
      id: 'pkg-6h',
      name: 'Kifurushi cha Masaa 6',
      priceTzs: 500,
      durationValue: 6,
      durationUnit: 'hours',
      createdAt: now - 30 * DAY,
    },
    {
      id: 'pkg-24h',
      name: 'Kifurushi cha Siku',
      priceTzs: 1000,
      durationValue: 24,
      durationUnit: 'hours',
      createdAt: now - 30 * DAY,
    },
    {
      id: 'pkg-7d',
      name: 'Wiki Moja',
      priceTzs: 5000,
      durationValue: 7,
      durationUnit: 'days',
      createdAt: now - 30 * DAY,
    },
    {
      id: 'pkg-30d',
      name: 'Mwezi Mzima',
      priceTzs: 20000,
      durationValue: 30,
      durationUnit: 'days',
      createdAt: now - 30 * DAY,
    },
  ];
}

export function getDefaultFirewallRules(): FirewallRule[] {
  const now = Date.now();
  return [
    {
      id: 'rule-boss-iphone',
      deviceName: 'iPhone ya Boss',
      macAddress: 'A4:83:E7:2B:91:0C',
      protocol: 'IPv4/IPv6',
      userType: 'member',
      accessMode: 'permanent',
      enabled: true,
      createdAt: now - 14 * DAY,
      expiresAt: null,
      expired: false,
    },
    {
      id: 'rule-mama-tv',
      deviceName: 'Smart TV Sebuleni',
      macAddress: 'CC:2D:83:41:5E:19',
      protocol: 'IPv4/IPv6',
      userType: 'member',
      accessMode: 'permanent',
      enabled: true,
      createdAt: now - 12 * DAY,
      expiresAt: null,
      expired: false,
    },
    {
      id: 'rule-juma',
      deviceName: 'Simu ya Juma',
      macAddress: '7C:2A:31:F4:88:12',
      protocol: 'IPv4/IPv6',
      userType: 'customer',
      accessMode: 'paid_package',
      enabled: true,
      createdAt: now - 3 * HOUR,
      expiresAt: now + 21 * HOUR + 14 * 60 * 1000,
      expired: false,
      packageId: 'pkg-24h',
      packageName: 'Kifurushi cha Siku',
    },
    {
      id: 'rule-neema',
      deviceName: 'Tecno ya Neema',
      macAddress: 'B8:53:AC:60:4D:71',
      protocol: 'IPv4',
      userType: 'customer',
      accessMode: 'paid_package',
      enabled: true,
      createdAt: now - 1 * HOUR,
      expiresAt: now + 4 * HOUR + 42 * 60 * 1000,
      expired: false,
      packageId: 'pkg-6h',
      packageName: 'Kifurushi cha Masaa 6',
    },
    {
      id: 'rule-baraka',
      deviceName: 'Laptop ya Baraka',
      macAddress: 'D8:F2:CA:19:03:AF',
      protocol: 'IPv4/IPv6',
      userType: 'customer',
      accessMode: 'paid_package',
      enabled: true,
      createdAt: now - 2 * DAY,
      expiresAt: now + 5 * DAY + 3 * HOUR,
      expired: false,
      packageId: 'pkg-7d',
      packageName: 'Wiki Moja',
    },
    {
      id: 'rule-hassan-expired',
      deviceName: 'Infinix ya Hassan',
      macAddress: '48:5A:B6:7E:C2:90',
      protocol: 'IPv4',
      userType: 'customer',
      accessMode: 'custom_timer',
      enabled: false,
      createdAt: now - 8 * HOUR,
      expiresAt: now - 2 * HOUR,
      expired: true,
    },
  ];
}

export function getDefaultPayments(): PaymentRecord[] {
  const now = Date.now();
  return [
    {
      id: 'pay-1',
      deviceName: 'Simu ya Juma',
      macAddress: '7C:2A:31:F4:88:12',
      packageId: 'pkg-24h',
      packageName: 'Kifurushi cha Siku',
      amountTzs: 1000,
      timestamp: now - 3 * HOUR,
      durationLabel: 'Masaa 24',
    },
    {
      id: 'pay-2',
      deviceName: 'Tecno ya Neema',
      macAddress: 'B8:53:AC:60:4D:71',
      packageId: 'pkg-6h',
      packageName: 'Kifurushi cha Masaa 6',
      amountTzs: 500,
      timestamp: now - 1 * HOUR,
      durationLabel: 'Masaa 6',
    },
    {
      id: 'pay-3',
      deviceName: 'Samsung ya Amina',
      macAddress: '94:65:2D:11:AB:34',
      packageId: 'pkg-24h',
      packageName: 'Kifurushi cha Siku',
      amountTzs: 1000,
      timestamp: now - 26 * HOUR,
      durationLabel: 'Masaa 24',
    },
    {
      id: 'pay-4',
      deviceName: 'Laptop ya Baraka',
      macAddress: 'D8:F2:CA:19:03:AF',
      packageId: 'pkg-7d',
      packageName: 'Wiki Moja',
      amountTzs: 5000,
      timestamp: now - 2 * DAY,
      durationLabel: 'Siku 7',
    },
    {
      id: 'pay-5',
      deviceName: 'Ofisi ya Salum',
      macAddress: 'E0:D5:5E:84:12:4C',
      packageId: 'pkg-30d',
      packageName: 'Mwezi Mzima',
      amountTzs: 20000,
      timestamp: now - 9 * DAY,
      durationLabel: 'Siku 30',
    },
    {
      id: 'pay-6',
      deviceName: 'Redmi ya Musa',
      macAddress: '3C:A9:F4:22:79:18',
      packageId: 'pkg-7d',
      packageName: 'Wiki Moja',
      amountTzs: 5000,
      timestamp: now - 34 * DAY,
      durationLabel: 'Siku 7',
    },
  ];
}

export function getDefaultRouterConfig(): RouterConfig {
  return {
    mode: 'demo',
    firmwareProtocol: 'auto',
    gatewayIp: '192.168.1.1',
    username: 'admin',
    password: '',
    routerModel: 'ZLT / Tozed CPE',
    ssid24: 'Bilo_WiFi_2.4G',
    ssid5: 'Bilo_WiFi_5G',
  };
}

function readJson<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export const storageService = {
  loadRules(): FirewallRule[] {
    return readJson(KEYS.RULES, getDefaultFirewallRules);
  },
  saveRules(rules: FirewallRule[]): void {
    writeJson(KEYS.RULES, rules);
  },

  loadFilterMode(): FirewallFilterMode {
    const raw = localStorage.getItem(KEYS.FILTER_MODE);
    if (raw === 'whitelist' || raw === 'blacklist' || raw === 'disabled') {
      return raw;
    }
    return 'whitelist';
  },
  saveFilterMode(mode: FirewallFilterMode): void {
    try {
      localStorage.setItem(KEYS.FILTER_MODE, mode);
    } catch {
      // ignore
    }
  },

  loadPackages(): WifiPackage[] {
    return readJson(KEYS.PACKAGES, getDefaultPackages);
  },
  savePackages(packages: WifiPackage[]): void {
    writeJson(KEYS.PACKAGES, packages);
  },

  loadPayments(): PaymentRecord[] {
    return readJson(KEYS.PAYMENTS, getDefaultPayments);
  },
  savePayments(payments: PaymentRecord[]): void {
    writeJson(KEYS.PAYMENTS, payments);
  },

  loadRouterConfig(): RouterConfig {
    const defaults = getDefaultRouterConfig();
    const saved = readJson<Partial<RouterConfig>>(KEYS.ROUTER_CONFIG, () => defaults);
    const rawProto = String(saved.firmwareProtocol || defaults.firmwareProtocol);
    const normalizedProto =
      rawProto === 'goform' || rawProto === 'reqproc' || rawProto === 'tozed_web'
        ? rawProto
        : 'auto';

    return {
      ...defaults,
      mode: saved.mode === 'router' ? 'router' : 'demo',
      firmwareProtocol: normalizedProto,
      gatewayIp: saved.gatewayIp || defaults.gatewayIp,
      username: saved.username || defaults.username,
      routerModel: saved.routerModel || defaults.routerModel,
      ssid24: saved.ssid24 || defaults.ssid24,
      ssid5: saved.ssid5 || defaults.ssid5,
      // Never reload plaintext passwords from localStorage
      password: '',
    };
  },
  saveRouterConfig(config: RouterConfig): void {
    // Strip password before writing to localStorage so admin credentials remain in memory only
    const { password: _omitted, ...safeConfig } = config;
    writeJson(KEYS.ROUTER_CONFIG, safeConfig);
  },

  loadLanguage(): Language {
    const raw = localStorage.getItem(KEYS.LANGUAGE);
    return raw === 'en' ? 'en' : 'sw';
  },
  saveLanguage(lang: Language): void {
    try {
      localStorage.setItem(KEYS.LANGUAGE, lang);
    } catch {
      // ignore
    }
  },

  loadCopiedMac(): string {
    return localStorage.getItem(KEYS.COPIED_MAC) || '';
  },
  saveCopiedMac(mac: string): void {
    try {
      localStorage.setItem(KEYS.COPIED_MAC, mac);
    } catch {
      // ignore
    }
  },

  resetAllDemoData(): {
    rules: FirewallRule[];
    packages: WifiPackage[];
    payments: PaymentRecord[];
    filterMode: FirewallFilterMode;
  } {
    const rules = getDefaultFirewallRules();
    const packages = getDefaultPackages();
    const payments = getDefaultPayments();
    const filterMode: FirewallFilterMode = 'whitelist';
    this.saveRules(rules);
    this.savePackages(packages);
    this.savePayments(payments);
    this.saveFilterMode(filterMode);
    return { rules, packages, payments, filterMode };
  },
};
