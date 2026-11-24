export type Language = 'sw' | 'en';

export type TabId = 'devices' | 'firewall' | 'packages' | 'payments';

export type ConnectionBand = '2.4GHz' | '5GHz' | 'LAN';

export interface ConnectedDevice {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  connectionType: ConnectionBand;
  online: boolean;
  signalStrength?: number; // dBm or percentage for wireless
  connectedSince: number; // epoch ms
  rxBytes?: number;
  txBytes?: number;
}

export type FirewallFilterMode = 'whitelist' | 'blacklist' | 'disabled';

export type ProtocolType = 'IPv4/IPv6' | 'IPv4';

export type UserType = 'member' | 'customer';

export type CustomerAccessMode = 'custom_timer' | 'paid_package';

export type DurationUnit = 'minutes' | 'hours' | 'days';

export interface FirewallRule {
  id: string;
  deviceName: string;
  macAddress: string; // normalized uppercase XX:XX:XX:XX:XX:XX
  protocol: ProtocolType;
  userType: UserType;
  accessMode: 'permanent' | CustomerAccessMode;
  enabled: boolean;
  createdAt: number;
  expiresAt: number | null; // null for permanent Member
  expired: boolean;
  packageId?: string;
  packageName?: string;
  lastSyncedAt?: number;
}

export interface WifiPackage {
  id: string;
  name: string;
  priceTzs: number;
  durationValue: number;
  durationUnit: DurationUnit;
  createdAt: number;
}

export interface PaymentRecord {
  id: string;
  deviceName: string;
  macAddress: string;
  packageId: string;
  packageName: string;
  amountTzs: number;
  timestamp: number;
  durationLabel: string;
}

export type RouterConnectionState = 'demo' | 'connected' | 'disconnected';

export type RouterFirmwareProtocol = 'auto' | 'goform' | 'reqproc' | 'tozed_web';

export interface RouterConfig {
  mode: 'demo' | 'router';
  firmwareProtocol: RouterFirmwareProtocol;
  gatewayIp: string;
  username: string;
  /** Held strictly in memory during active session; never persisted to localStorage */
  password: string;
  routerModel: string;
  ssid24: string;
  ssid5: string;
}

export interface RouterNetworkInfo {
  ssid24: string;
  ssid5?: string;
  networkProvider?: string;
  networkType?: string;
  signalBar?: number;
  rssi?: string;
  rsrp?: string;
  wanIp?: string;
  hardwareVersion?: string;
  firmwareVersion?: string;
}

export interface DiagnosticStep {
  id: 'gateway' | 'login' | 'clients';
  label: string;
  status: 'ok' | 'fail' | 'skipped';
  detail?: string;
}

export interface RouterTestResult {
  ok: boolean;
  isDemo: boolean;
  reason?:
    | 'mixed_content'
    | 'gateway_unreachable'
    | 'auth_failed'
    | 'network_error'
    | 'invalid_host';
  message: string;
  detectedSsid?: string;
  detectedProtocol?: RouterFirmwareProtocol;
  detectedVariantLabel?: string;
  clientCount?: number;
  networkInfo?: RouterNetworkInfo;
  steps?: DiagnosticStep[];
}

export interface ToastMessage {
  id: string;
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
}
