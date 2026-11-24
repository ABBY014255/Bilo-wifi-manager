import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  ConnectionBand,
  ConnectedDevice,
  DiagnosticStep,
  FirewallFilterMode,
  FirewallRule,
  RouterConfig,
  RouterFirmwareProtocol,
  RouterNetworkInfo,
  RouterTestResult,
} from '../types';

/**
 * RouterApiService
 * Direct native Android / Capacitor ZLT & Tozed CPE Router integration engine.
 *
 * - Uses `CapacitorHttp` from `@capacitor/core` for direct HTTP GET/POST to any private LAN
 *   gateway IP (192.168.1.1, 192.168.0.1, 192.168.8.1, or any custom private IPv4 address),
 *   bypassing Android WebView CORS and Mixed Content restrictions with zero PC/Node.js bridge.
 * - Captures `Set-Cookie` session headers from login responses and attaches `Cookie`,
 *   `Referer: http://<gateway>/index.html`, and `Origin: http://<gateway>` to all subsequent calls.
 * - Auto-detects across ZLT/Tozed CPE firmware variants:
 *     Variant A (`goform`): /goform/goform_set_cmd_process & /goform/goform_get_cmd_process
 *     Variant B (`reqproc`): /reqproc/proc_post & /reqproc/proc_get
 *     Variant C (`tozed_web`): /api/login, /cgi-bin/luci, /cgi-bin/http.cgi
 * - Supports full router management: Connected Devices, MAC Filtering/Blocking,
 *   Wi-Fi SSID & Password updates, Signal/Network Info, and Router Reboot.
 */

interface NormalizedResponse {
  status: number;
  ok: boolean;
  text: string;
  json: Record<string, unknown> | null;
}

type ResolvedVariant = Exclude<RouterFirmwareProtocol, 'auto'>;
type VariantCSubmode = 'api_login' | 'luci' | 'http_cgi';

const INITIAL_DEMO_DEVICES: ConnectedDevice[] = [
  {
    id: 'dev-1',
    hostname: 'iPhone-14-Pro',
    ipAddress: '192.168.1.101',
    macAddress: 'A4:83:E7:2B:91:0C',
    connectionType: '5GHz',
    online: true,
    signalStrength: -48,
    connectedSince: Date.now() - 4 * 60 * 60 * 1000,
  },
  {
    id: 'dev-2',
    hostname: 'Galaxy-A15-Juma',
    ipAddress: '192.168.1.104',
    macAddress: '7C:2A:31:F4:88:12',
    connectionType: '2.4GHz',
    online: true,
    signalStrength: -61,
    connectedSince: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: 'dev-3',
    hostname: 'TECNO-SPARK-20',
    ipAddress: '192.168.1.108',
    macAddress: 'B8:53:AC:60:4D:71',
    connectionType: '2.4GHz',
    online: true,
    signalStrength: -57,
    connectedSince: Date.now() - 58 * 60 * 1000,
  },
  {
    id: 'dev-4',
    hostname: 'LG-WebOS-SmartTV',
    ipAddress: '192.168.1.112',
    macAddress: 'CC:2D:83:41:5E:19',
    connectionType: 'LAN',
    online: true,
    connectedSince: Date.now() - 18 * 60 * 60 * 1000,
  },
  {
    id: 'dev-5',
    hostname: 'HP-Pavilion-Baraka',
    ipAddress: '192.168.1.115',
    macAddress: 'D8:F2:CA:19:03:AF',
    connectionType: '5GHz',
    online: true,
    signalStrength: -52,
    connectedSince: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'dev-6',
    hostname: 'Redmi-13C-Guest',
    ipAddress: '192.168.1.121',
    macAddress: '50:8E:49:9D:33:E4',
    connectionType: '2.4GHz',
    online: true,
    signalStrength: -66,
    connectedSince: Date.now() - 19 * 60 * 1000,
  },
  {
    id: 'dev-7',
    hostname: 'Infinix-HOT-40i',
    ipAddress: '192.168.1.129',
    macAddress: '24:4B:FE:A1:77:05',
    connectionType: '2.4GHz',
    online: true,
    signalStrength: -64,
    connectedSince: Date.now() - 11 * 60 * 1000,
  },
];

const SIMULATED_POOL: Array<{ hostname: string; macAddress: string; connectionType: ConnectionBand }> = [
  { hostname: 'Samsung-Galaxy-A05', macAddress: '8C:F5:A3:44:21:9E', connectionType: '2.4GHz' },
  { hostname: 'iPhone-12-Mini', macAddress: 'F0:18:98:7C:55:B2', connectionType: '5GHz' },
  { hostname: 'TECNO-CAMON-30', macAddress: '64:A2:F9:1E:08:D3', connectionType: '5GHz' },
  { hostname: 'Lenovo-ThinkPad-T14', macAddress: '00:1A:79:B2:46:81', connectionType: 'LAN' },
  { hostname: 'OPPO-A38-Client', macAddress: 'AC:37:43:D9:14:6B', connectionType: '2.4GHz' },
];

const COMMON_GATEWAYS = ['192.168.1.1', '192.168.0.1', '192.168.8.1', '192.168.100.1'] as const;

// Validates RFC1918 private IPv4 addresses (10.x.x.x, 172.16-31.x.x, 192.168.x.x) with optional :port
const PRIVATE_IPV4_RE =
  /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d{1,5})?$/;

export function isNativeCapacitorRuntime(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function cleanGatewayHost(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

/**
 * Validates that the gateway is a valid private LAN IPv4 address (each octet 0-255, optional port 1-65535).
 */
export function isValidGatewayHost(raw: string): boolean {
  const cleaned = cleanGatewayHost(raw);
  if (!PRIVATE_IPV4_RE.test(cleaned)) return false;
  const [ipPart, portPart] = cleaned.split(':');
  const octets = ipPart.split('.').map(Number);
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  if (portPart !== undefined) {
    const port = Number(portPart);
    if (!Number.isInteger(port) || port < 1 || port > 65535) return false;
  }
  return true;
}

function safeBase64(input: string): string {
  try {
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  } catch {
    return btoa(input);
  }
}

function parseJsonSafe(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

class RouterApiService {
  private demoDevices: ConnectedDevice[] = [...INITIAL_DEMO_DEVICES];
  private poolIndex = 0;
  private demoSsid = 'Bilo_WiFi_2.4G';

  private resolvedProtocolByGateway = new Map<string, ResolvedVariant>();
  private resolvedVariantCSubmode = new Map<string, VariantCSubmode>();
  private resolvedVariantLabelByGateway = new Map<string, string>();
  private lastLoginAtByGateway = new Map<string, number>();

  // In-memory per-gateway session cookie jar (never persisted to disk/localStorage)
  private sessionCookieJar = new Map<string, Map<string, string>>();

  private getGatewayBaseUrl(gatewayIp: string): string {
    return `http://${cleanGatewayHost(gatewayIp)}`;
  }

  private isBrowserHttpsBlocked(): boolean {
    if (isNativeCapacitorRuntime()) return false;
    return typeof window !== 'undefined' && window.location.protocol === 'https:';
  }

  private captureSetCookies(gateway: string, headers?: Record<string, string>): void {
    if (!headers) return;
    const setCookieHeader =
      headers['Set-Cookie'] ||
      headers['set-cookie'] ||
      Object.entries(headers).find(([k]) => k.toLowerCase() === 'set-cookie')?.[1];

    if (!setCookieHeader) return;

    let jar = this.sessionCookieJar.get(gateway);
    if (!jar) {
      jar = new Map<string, string>();
      this.sessionCookieJar.set(gateway, jar);
    }

    // Split multiple Set-Cookie headers safely without splitting on Expires=Day, DD MMM YYYY GMT
    const entries = setCookieHeader.split(/,(?=\s*[A-Za-z0-9_.-]+=)/);
    for (const rawCookie of entries) {
      const firstSegment = rawCookie.split(';')[0]?.trim();
      const eqIdx = firstSegment?.indexOf('=') ?? -1;
      if (firstSegment && eqIdx > 0) {
        const name = firstSegment.slice(0, eqIdx).trim();
        const value = firstSegment.slice(eqIdx + 1).trim();
        if (name) jar.set(name, value);
      }
    }
  }

  private getCookieHeader(gateway: string): string {
    const jar = this.sessionCookieJar.get(gateway);
    if (!jar || jar.size === 0) return '';
    return Array.from(jar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  /**
   * Direct router HTTP transport powered by `CapacitorHttp` from `@capacitor/core`.
   * Sends `Referer: http://<gateway>/index.html`, `Origin: http://<gateway>`, and captured
   * `Cookie` session headers directly to the user's chosen gateway IP.
   */
  private async sendRouterRequest(
    config: RouterConfig,
    routerPath: string,
    options: {
      method: 'GET' | 'POST';
      body?: string;
      contentType?: string;
      timeoutMs?: number;
      gatewayOverride?: string;
    }
  ): Promise<NormalizedResponse> {
    const gateway = cleanGatewayHost(options.gatewayOverride ?? config.gatewayIp);
    const baseUrl = this.getGatewayBaseUrl(gateway);
    const url = `${baseUrl}${routerPath}`;
    const timeoutMs = options.timeoutMs ?? 5000;
    const cookieHeader = this.getCookieHeader(gateway);

    const requestHeaders: Record<string, string> = {
      Referer: `${baseUrl}/index.html`,
      Origin: baseUrl,
      ...(options.method === 'POST'
        ? {
            'Content-Type':
              options.contentType ?? 'application/x-www-form-urlencoded; charset=UTF-8',
          }
        : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    // Native Android / iOS Capacitor runtime: use CapacitorHttp directly (zero CORS/Mixed Content)
    if (isNativeCapacitorRuntime()) {
      const response = await CapacitorHttp.request({
        url,
        method: options.method,
        headers: requestHeaders,
        data: options.body,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
        shouldEncodeUrlParams: false,
      });

      this.captureSetCookies(gateway, response.headers);

      const text =
        typeof response.data === 'string'
          ? response.data
          : response.data != null
            ? JSON.stringify(response.data)
            : '';
      const json =
        response.data && typeof response.data === 'object'
          ? (response.data as Record<string, unknown>)
          : parseJsonSafe(text);

      return {
        status: response.status,
        ok: response.status >= 200 && response.status < 400,
        text,
        json,
      };
    }

    // Standard web fallback (works directly when opened over local HTTP LAN)
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: options.method,
        credentials: 'include',
        headers:
          options.method === 'POST'
            ? {
                'Content-Type':
                  options.contentType ?? 'application/x-www-form-urlencoded; charset=UTF-8',
              }
            : undefined,
        body: options.body,
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const text = await res.text();
      return {
        status: res.status,
        ok: res.status >= 200 && res.status < 400,
        text,
        json: parseJsonSafe(text),
      };
    } catch (err) {
      window.clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Probes common private LAN gateway IPs (192.168.1.1, 192.168.0.1, 192.168.8.1, 192.168.100.1)
   * directly via CapacitorHttp to discover the connected ZLT/Tozed router.
   */
  async detectGatewayIp(
    config: RouterConfig
  ): Promise<{ foundIp: string | null; blockedByHttps?: boolean }> {
    if (this.isBrowserHttpsBlocked()) {
      return { foundIp: null, blockedByHttps: true };
    }

    const candidates = Array.from(
      new Set([cleanGatewayHost(config.gatewayIp), ...COMMON_GATEWAYS].filter(isValidGatewayHost))
    );

    for (const ip of candidates) {
      try {
        const res = await this.sendRouterRequest(config, '/index.html', {
          method: 'GET',
          timeoutMs: 2000,
          gatewayOverride: ip,
        });
        if (res.status > 0 && res.status < 500) {
          return { foundIp: ip };
        }
      } catch {
        // try next gateway candidate
      }
    }
    return { foundIp: null };
  }

  /**
   * Variant A (`goform`) & Variant B (`reqproc`) LOGIN:
   * Tries Base64-encoded password and plain password automatically while capturing Set-Cookie.
   */
  private async loginGoformOrReqproc(
    config: RouterConfig,
    variant: 'goform' | 'reqproc'
  ): Promise<{ ok: boolean; authRejected?: boolean; variantLabel?: string; detail?: string }> {
    const username = config.username.trim() || 'admin';
    const plainPassword = config.password || 'admin';
    const base64Password = safeBase64(plainPassword);
    const postPath =
      variant === 'reqproc' ? '/reqproc/proc_post' : '/goform/goform_set_cmd_process';

    const candidates =
      base64Password !== plainPassword
        ? [
            { value: base64Password, encoding: 'base64' },
            { value: plainPassword, encoding: 'plain' },
          ]
        : [{ value: plainPassword, encoding: 'plain' }];

    let sawAuthReject = false;

    for (const candidate of candidates) {
      const loginBody = new URLSearchParams({
        isTest: 'false',
        goformId: 'LOGIN',
        username,
        password: candidate.value,
      }).toString();

      let res: NormalizedResponse;
      try {
        res = await this.sendRouterRequest(config, postPath, {
          method: 'POST',
          body: loginBody,
        });
      } catch {
        return { ok: false, detail: `${postPath} unreachable` };
      }

      if (res.status === 404 || res.status === 405 || res.status >= 500) {
        return { ok: false, detail: `${postPath} HTTP ${res.status}` };
      }

      const resultVal = String(res.json?.result ?? '').trim().toLowerCase();
      if (
        resultVal === '0' ||
        resultVal === '4' ||
        resultVal === 'success' ||
        res.text.toLowerCase().includes('"result":"0"') ||
        res.text.toLowerCase().includes('success')
      ) {
        const label =
          variant === 'goform'
            ? `ZLT / TZLink goform (${candidate.encoding})`
            : `ZLT / Airtel reqproc (${candidate.encoding})`;
        return { ok: true, variantLabel: label, detail: `${postPath} (${candidate.encoding})` };
      }

      if (
        resultVal === '3' ||
        resultVal === '1' ||
        resultVal === 'failure' ||
        resultVal === 'error'
      ) {
        sawAuthReject = true;
        continue;
      }
    }

    return {
      ok: false,
      authRejected: sawAuthReject,
      detail: sawAuthReject ? 'Rejected (base64 & plain)' : `${postPath} unsupported`,
    };
  }

  /**
   * Variant C (`tozed_web`): /api/login, /cgi-bin/luci, and /cgi-bin/http.cgi.
   */
  private async loginTozedWebApi(
    config: RouterConfig
  ): Promise<{
    ok: boolean;
    authRejected?: boolean;
    submode?: VariantCSubmode;
    variantLabel?: string;
    detail?: string;
  }> {
    const username = config.username.trim() || 'admin';
    const plainPassword = config.password || 'admin';
    const base64Password = safeBase64(plainPassword);
    let sawAuthReject = false;

    // C1: POST /api/login
    for (const payload of [
      { username, password: plainPassword },
      { username, password: base64Password },
    ]) {
      try {
        const res = await this.sendRouterRequest(config, '/api/login', {
          method: 'POST',
          contentType: 'application/json; charset=UTF-8',
          body: JSON.stringify(payload),
        });
        if (res.status === 404 || res.status === 405 || res.status >= 500) break;
        const okJson =
          res.json?.success === true ||
          res.json?.ok === true ||
          String(res.json?.result ?? '').toLowerCase() === '0' ||
          String(res.json?.code ?? '') === '0' ||
          Boolean(res.json?.token || res.json?.sessionId);
        if (res.status === 200 && okJson) {
          return {
            ok: true,
            submode: 'api_login',
            variantLabel: 'Tozed Web (/api/login)',
            detail: '/api/login OK',
          };
        }
        if (res.status === 401 || res.status === 403 || res.json?.success === false) {
          sawAuthReject = true;
        }
      } catch {
        break;
      }
    }

    // C2: POST /cgi-bin/luci
    try {
      const luciBody = new URLSearchParams({
        luci_username: username,
        luci_password: plainPassword,
      }).toString();
      const res = await this.sendRouterRequest(config, '/cgi-bin/luci', {
        method: 'POST',
        body: luciBody,
      });
      const hasInvalidMsg =
        res.text.toLowerCase().includes('invalid username') ||
        res.text.toLowerCase().includes('invalid password');
      if (res.status === 302 || (res.status === 200 && !hasInvalidMsg && res.text.includes('luci'))) {
        return {
          ok: true,
          submode: 'luci',
          variantLabel: 'Tozed LuCI (/cgi-bin/luci)',
          detail: `/cgi-bin/luci HTTP ${res.status}`,
        };
      }
      if (hasInvalidMsg || res.status === 403) {
        sawAuthReject = true;
      }
    } catch {
      // continue to C3
    }

    // C3: POST /cgi-bin/http.cgi
    try {
      const res = await this.sendRouterRequest(config, '/cgi-bin/http.cgi', {
        method: 'POST',
        contentType: 'application/json; charset=UTF-8',
        body: JSON.stringify({
          cmd: 100,
          method: 'POST',
          username,
          passwd: base64Password,
          language: 'EN',
        }),
      });
      if (res.status === 200 && res.json) {
        const success =
          res.json.success === true ||
          String(res.json.result ?? '').toLowerCase() === '0' ||
          String(res.json.result ?? '').toLowerCase() === 'success' ||
          Boolean(res.json.sessionId);
        if (success) {
          return {
            ok: true,
            submode: 'http_cgi',
            variantLabel: 'Tozed CGI (/cgi-bin/http.cgi)',
            detail: '/cgi-bin/http.cgi OK',
          };
        }
        if (res.json.success === false || String(res.json.result) === '3') {
          sawAuthReject = true;
        }
      }
    } catch {
      // ignore
    }

    return {
      ok: false,
      authRejected: sawAuthReject,
      detail: sawAuthReject ? 'Credentials rejected' : 'Tozed Web endpoints not found',
    };
  }

  /**
   * Automatically authenticates and caches the detected firmware protocol & session cookie.
   */
  private async ensureAuthenticated(config: RouterConfig): Promise<{
    ok: boolean;
    protocol: ResolvedVariant;
    variantLabel?: string;
    authRejected?: boolean;
  }> {
    const gateway = cleanGatewayHost(config.gatewayIp);
    const cachedProto =
      config.firmwareProtocol !== 'auto'
        ? config.firmwareProtocol
        : this.resolvedProtocolByGateway.get(gateway);
    const lastLogin = this.lastLoginAtByGateway.get(gateway) ?? 0;

    if (cachedProto && Date.now() - lastLogin < 3 * 60 * 1000) {
      return {
        ok: true,
        protocol: cachedProto,
        variantLabel: this.resolvedVariantLabelByGateway.get(gateway),
      };
    }

    const order: ResolvedVariant[] =
      config.firmwareProtocol !== 'auto'
        ? [config.firmwareProtocol]
        : ['goform', 'reqproc', 'tozed_web'];

    let sawAuthRejected = false;

    for (const proto of order) {
      if (proto === 'goform' || proto === 'reqproc') {
        const res = await this.loginGoformOrReqproc(config, proto);
        if (res.ok) {
          this.resolvedProtocolByGateway.set(gateway, proto);
          this.resolvedVariantLabelByGateway.set(gateway, res.variantLabel || proto);
          this.lastLoginAtByGateway.set(gateway, Date.now());
          return { ok: true, protocol: proto, variantLabel: res.variantLabel };
        }
        if (res.authRejected) {
          sawAuthRejected = true;
          this.resolvedProtocolByGateway.set(gateway, proto);
        }
      } else {
        const res = await this.loginTozedWebApi(config);
        if (res.ok) {
          this.resolvedProtocolByGateway.set(gateway, 'tozed_web');
          if (res.submode) this.resolvedVariantCSubmode.set(gateway, res.submode);
          this.resolvedVariantLabelByGateway.set(gateway, res.variantLabel || 'tozed_web');
          this.lastLoginAtByGateway.set(gateway, Date.now());
          return { ok: true, protocol: 'tozed_web', variantLabel: res.variantLabel };
        }
        if (res.authRejected) {
          sawAuthRejected = true;
          this.resolvedProtocolByGateway.set(gateway, 'tozed_web');
        }
      }
    }

    return {
      ok: false,
      protocol: cachedProto ?? 'goform',
      authRejected: sawAuthRejected,
    };
  }

  private async queryRouterData(
    config: RouterConfig,
    protocol: ResolvedVariant,
    cmds: string
  ): Promise<Record<string, unknown> | null> {
    const gateway = cleanGatewayHost(config.gatewayIp);

    if (protocol === 'goform') {
      const res = await this.sendRouterRequest(
        config,
        `/goform/goform_get_cmd_process?isTest=false&cmd=${cmds}&multi_data=1`,
        { method: 'GET' }
      );
      return res.ok && res.json ? res.json : null;
    }

    if (protocol === 'reqproc') {
      const res = await this.sendRouterRequest(
        config,
        `/reqproc/proc_get?isTest=false&cmd=${cmds}&multi_data=1`,
        { method: 'GET' }
      );
      if (res.ok && res.json) return res.json;

      const fallbackRes = await this.sendRouterRequest(
        config,
        `/reqproc/proc_get?cmd=${cmds}`,
        { method: 'GET' }
      );
      return fallbackRes.ok && fallbackRes.json ? fallbackRes.json : null;
    }

    const submode = this.resolvedVariantCSubmode.get(gateway) ?? 'api_login';
    if (submode === 'api_login') {
      for (const path of ['/api/clients', '/api/dhcp/leases', '/api/status']) {
        try {
          const res = await this.sendRouterRequest(config, path, { method: 'GET' });
          if (res.ok && res.json) return res.json;
        } catch {
          // try next
        }
      }
    }

    if (submode === 'luci') {
      for (const path of [
        '/cgi-bin/luci/admin/status/overview?status=1',
        '/cgi-bin/luci/admin/network/wireless',
      ]) {
        try {
          const res = await this.sendRouterRequest(config, path, { method: 'GET' });
          if (res.ok && res.json) return res.json;
        } catch {
          // try next
        }
      }
    }

    try {
      const res = await this.sendRouterRequest(config, '/cgi-bin/http.cgi', {
        method: 'POST',
        contentType: 'application/json; charset=UTF-8',
        body: JSON.stringify({ cmd: 230, method: 'GET' }),
      });
      if (res.ok && res.json) return res.json;
    } catch {
      // ignore
    }

    return null;
  }

  private parseNetworkInfo(payload: Record<string, unknown>, fallbackSsid: string): RouterNetworkInfo {
    const ssid24 = String(payload.SSID1 || payload.m_SSID1 || payload.ssid || fallbackSsid).trim();
    const ssid5 = String(payload.SSID2 || payload.wifi_5g_ssid || '').trim() || undefined;
    const networkProvider =
      String(payload.network_provider || payload.spn_name_data || payload.plmn_name || '').trim() ||
      undefined;
    const networkType =
      String(payload.network_type || payload.net_mode || payload.wan_mode || '').trim() ||
      undefined;
    const signalBarRaw = Number(payload.signalbar ?? payload.signal_bar ?? NaN);
    const signalBar = Number.isFinite(signalBarRaw)
      ? Math.max(0, Math.min(5, Math.round(signalBarRaw)))
      : undefined;
    const rssi = payload.rssi != null && String(payload.rssi).trim() !== '' ? `${payload.rssi} dBm` : undefined;
    const rsrp = payload.lte_rsrp != null && String(payload.lte_rsrp).trim() !== '' ? `${payload.lte_rsrp} dBm` : undefined;
    const wanIp = String(payload.wan_ipaddr || payload.ppp_ipaddr || '').trim() || undefined;
    const hardwareVersion = String(payload.hardware_version || payload.wa_inner_version || '').trim() || undefined;
    const firmwareVersion = String(payload.cr_version || payload.wa_inner_version || '').trim() || undefined;

    return {
      ssid24,
      ssid5,
      networkProvider,
      networkType,
      signalBar,
      rssi,
      rsrp,
      wanIp,
      hardwareVersion,
      firmwareVersion,
    };
  }

  /**
   * Direct 3-step live connection test via CapacitorHttp:
   * 1. Reach Router Gateway -> 2. Authenticate Admin Session -> 3. Read Connected Clients & Signal Info.
   */
  async testConnection(config: RouterConfig): Promise<RouterTestResult> {
    if (config.mode === 'demo') {
      await this.delay(180);
      return {
        ok: true,
        isDemo: true,
        message: 'Demo mode ready',
        networkInfo: {
          ssid24: this.demoSsid,
          ssid5: config.ssid5,
          networkProvider: 'Airtel TZ (Demo)',
          networkType: '4G LTE',
          signalBar: 4,
          rssi: '-64 dBm',
          wanIp: '105.231.42.18',
          hardwareVersion: 'ZLT S10G',
        },
      };
    }

    const steps: DiagnosticStep[] = [];

    if (!isValidGatewayHost(config.gatewayIp)) {
      return {
        ok: false,
        isDemo: false,
        reason: 'invalid_host',
        message: 'Invalid private LAN gateway IP address',
      };
    }

    if (this.isBrowserHttpsBlocked()) {
      return {
        ok: false,
        isDemo: false,
        reason: 'mixed_content',
        message: 'Direct HTTP to router LAN requires Android APK (Capacitor) or local HTTP.',
      };
    }

    // Step 1: Reach Router Gateway
    const gateway = cleanGatewayHost(config.gatewayIp);
    try {
      const probeRes = await this.sendRouterRequest(config, '/index.html', {
        method: 'GET',
        timeoutMs: 3000,
      });
      if (probeRes.status >= 500) {
        steps.push({
          id: 'gateway',
          label: `Router ${gateway}`,
          status: 'fail',
          detail: `HTTP ${probeRes.status}`,
        });
        return {
          ok: false,
          isDemo: false,
          reason: 'gateway_unreachable',
          message: `Router ${gateway} unreachable`,
          steps,
        };
      }
      steps.push({
        id: 'gateway',
        label: `Router ${gateway}`,
        status: 'ok',
        detail: `HTTP ${probeRes.status}`,
      });
    } catch {
      steps.push({
        id: 'gateway',
        label: `Router ${gateway}`,
        status: 'fail',
        detail: 'No response on LAN',
      });
      return {
        ok: false,
        isDemo: false,
        reason: 'gateway_unreachable',
        message: `Router ${gateway} unreachable`,
        steps,
      };
    }

    // Step 2: Force Fresh Admin Login & Capture Session Cookie
    this.lastLoginAtByGateway.delete(gateway);
    this.sessionCookieJar.delete(gateway);
    const auth = await this.ensureAuthenticated(config);
    if (!auth.ok) {
      steps.push({
        id: 'login',
        label: 'Router Admin Login',
        status: 'fail',
        detail: auth.authRejected
          ? 'Wrong username or password'
          : 'Router API login endpoint not accepted',
      });
      return {
        ok: false,
        isDemo: false,
        reason: auth.authRejected ? 'auth_failed' : 'network_error',
        message: auth.authRejected ? 'Wrong router admin password' : 'Router API login failed',
        steps,
      };
    }

    steps.push({
      id: 'login',
      label: 'Router Admin Login',
      status: 'ok',
      detail: auth.variantLabel || auth.protocol,
    });

    // Step 3: Fetch Connected Clients & Signal / Network Info
    let clientCount = 0;
    let networkInfo: RouterNetworkInfo | undefined;
    try {
      const payload = await this.queryRouterData(
        config,
        auth.protocol,
        'station_list,dhcp_list,lan_station_list,SSID1,m_SSID1,network_provider,network_type,signalbar,rssi,lte_rsrp,wan_ipaddr,hardware_version'
      );
      if (payload) {
        clientCount = this.parseZltStationPayload(payload).length;
        networkInfo = this.parseNetworkInfo(payload, config.ssid24);
      }
      steps.push({
        id: 'clients',
        label: 'Clients & Network Info',
        status: 'ok',
        detail: `${clientCount} clients`,
      });
    } catch {
      steps.push({
        id: 'clients',
        label: 'Clients & Network Info',
        status: 'fail',
        detail: 'Could not read station_list',
      });
    }

    return {
      ok: true,
      isDemo: false,
      message: 'Connected',
      detectedSsid: networkInfo?.ssid24,
      detectedProtocol: auth.protocol,
      detectedVariantLabel: auth.variantLabel,
      clientCount,
      networkInfo,
      steps,
    };
  }

  /**
   * Reads live connected Wi-Fi & LAN devices directly from the router.
   */
  async getConnectedDevices(
    config: RouterConfig
  ): Promise<{ devices: ConnectedDevice[]; connectedLive: boolean; fallbackUsed: boolean }> {
    if (config.mode === 'demo') {
      await this.delay(150);
      return { devices: [...this.demoDevices], connectedLive: false, fallbackUsed: false };
    }

    if (!isValidGatewayHost(config.gatewayIp) || this.isBrowserHttpsBlocked()) {
      return { devices: [], connectedLive: false, fallbackUsed: true };
    }

    try {
      const auth = await this.ensureAuthenticated(config);
      if (!auth.ok) {
        return { devices: [], connectedLive: false, fallbackUsed: true };
      }

      const payload = await this.queryRouterData(
        config,
        auth.protocol,
        'station_list,dhcp_list,lan_station_list'
      );
      if (!payload) {
        return { devices: [], connectedLive: false, fallbackUsed: true };
      }
      const parsed = this.parseZltStationPayload(payload);
      return { devices: parsed, connectedLive: true, fallbackUsed: false };
    } catch {
      return { devices: [], connectedLive: false, fallbackUsed: true };
    }
  }

  /**
   * Fetches live cellular signal, operator, WAN IP, and Wi-Fi SSID directly from the router.
   */
  async getRouterNetworkInfo(config: RouterConfig): Promise<RouterNetworkInfo | null> {
    if (config.mode === 'demo') {
      await this.delay(140);
      return {
        ssid24: this.demoSsid,
        ssid5: config.ssid5,
        networkProvider: 'Airtel TZ (Demo)',
        networkType: '4G LTE',
        signalBar: 4,
        rssi: '-64 dBm',
        rsrp: '-88 dBm',
        wanIp: '105.231.42.18',
        hardwareVersion: 'ZLT S10G',
      };
    }

    if (!isValidGatewayHost(config.gatewayIp) || this.isBrowserHttpsBlocked()) {
      return null;
    }

    try {
      const auth = await this.ensureAuthenticated(config);
      if (!auth.ok) return null;
      const payload = await this.queryRouterData(
        config,
        auth.protocol,
        'SSID1,SSID2,m_SSID1,network_provider,network_type,signalbar,rssi,lte_rsrp,wan_ipaddr,hardware_version,wa_inner_version'
      );
      if (!payload) return null;
      return this.parseNetworkInfo(payload, config.ssid24);
    } catch {
      return null;
    }
  }

  /**
   * Updates Wi-Fi SSID & WPA2 password directly on the connected ZLT/Tozed router.
   */
  async updateWifiSettings(
    config: RouterConfig,
    params: { ssid: string; wifiPassword: string }
  ): Promise<{ ok: boolean; error?: string }> {
    const cleanSsid = params.ssid.trim();
    const cleanPass = params.wifiPassword;
    if (!cleanSsid || cleanSsid.length > 32) {
      return { ok: false, error: 'SSID must be 1-32 characters' };
    }
    if (cleanPass && (cleanPass.length < 8 || cleanPass.length > 63)) {
      return { ok: false, error: 'Wi-Fi password must be 8-63 characters' };
    }

    if (config.mode === 'demo') {
      await this.delay(180);
      this.demoSsid = cleanSsid;
      return { ok: true };
    }

    if (!isValidGatewayHost(config.gatewayIp) || this.isBrowserHttpsBlocked()) {
      return { ok: false, error: 'Router unreachable' };
    }

    try {
      const auth = await this.ensureAuthenticated(config);
      if (!auth.ok) return { ok: false, error: 'Router login required' };

      if (auth.protocol === 'tozed_web') {
        const res = await this.sendRouterRequest(config, '/api/wifi', {
          method: 'POST',
          contentType: 'application/json; charset=UTF-8',
          body: JSON.stringify({
            ssid: cleanSsid,
            ...(cleanPass ? { password: cleanPass } : {}),
          }),
        });
        return { ok: res.ok };
      }

      const postPath =
        auth.protocol === 'reqproc' ? '/reqproc/proc_post' : '/goform/goform_set_cmd_process';
      const body = new URLSearchParams({
        isTest: 'false',
        goformId: 'SET_WIFI_INFO',
        m_ssid: cleanSsid,
        SSID1: cleanSsid,
        ...(cleanPass
          ? {
              passphrase: cleanPass,
              WPAPSK1: cleanPass,
              AuthMode: 'WPA2PSK',
              EncrypType: 'AES',
            }
          : {}),
      }).toString();

      const res = await this.sendRouterRequest(config, postPath, {
        method: 'POST',
        body,
      });
      return { ok: res.ok };
    } catch {
      return { ok: false, error: 'Failed to update Wi-Fi settings' };
    }
  }

  /**
   * Reboots the connected ZLT/Tozed CPE router directly.
   */
  async rebootRouter(config: RouterConfig): Promise<boolean> {
    if (config.mode === 'demo') {
      await this.delay(220);
      return true;
    }

    if (!isValidGatewayHost(config.gatewayIp) || this.isBrowserHttpsBlocked()) {
      return false;
    }

    try {
      const auth = await this.ensureAuthenticated(config);
      if (!auth.ok) return false;

      if (auth.protocol === 'tozed_web') {
        const res = await this.sendRouterRequest(config, '/api/reboot', {
          method: 'POST',
          contentType: 'application/json; charset=UTF-8',
          body: JSON.stringify({ action: 'reboot' }),
        });
        return res.ok;
      }

      const postPath =
        auth.protocol === 'reqproc' ? '/reqproc/proc_post' : '/goform/goform_set_cmd_process';
      const res = await this.sendRouterRequest(config, postPath, {
        method: 'POST',
        body: new URLSearchParams({
          isTest: 'false',
          goformId: 'REBOOT_DEVICE',
        }).toString(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Imports existing MAC filter mode and MAC rules directly from the router.
   */
  async fetchRouterFirewallState(
    config: RouterConfig
  ): Promise<{ ok: boolean; mode?: FirewallFilterMode; macs?: string[] }> {
    if (config.mode !== 'router' || !isValidGatewayHost(config.gatewayIp) || this.isBrowserHttpsBlocked()) {
      return { ok: false };
    }
    try {
      const auth = await this.ensureAuthenticated(config);
      if (!auth.ok) return { ok: false };

      const payload = await this.queryRouterData(
        config,
        auth.protocol,
        'mac_filter_mode,mac_filter_list'
      );
      if (!payload) return { ok: false };

      const rawMode = String(payload.mac_filter_mode ?? '0');
      const mode: FirewallFilterMode =
        rawMode === '1' ? 'whitelist' : rawMode === '2' ? 'blacklist' : 'disabled';

      const macs: string[] = [];
      const rawList = payload.mac_filter_list;
      if (Array.isArray(rawList)) {
        for (const item of rawList) {
          const mac =
            typeof item === 'string'
              ? item
              : String((item as Record<string, unknown>)?.mac ?? '');
          if (mac.includes(':')) macs.push(mac.trim().toUpperCase());
        }
      } else if (typeof rawList === 'string' && rawList.trim()) {
        for (const token of rawList.split(/[;,]/)) {
          const cleaned = token.trim().toUpperCase();
          if (/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(cleaned)) {
            macs.push(cleaned);
          }
        }
      }

      return { ok: true, mode, macs };
    } catch {
      return { ok: false };
    }
  }

  simulateClientConnect(): ConnectedDevice {
    const candidate = SIMULATED_POOL[this.poolIndex % SIMULATED_POOL.length];
    this.poolIndex += 1;

    const existing = this.demoDevices.find((d) => d.macAddress === candidate.macAddress);
    if (existing) {
      const randomHex = () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase();
      const customDevice: ConnectedDevice = {
        id: `dev-sim-${Date.now()}`,
        hostname: `Android-Client-${Math.floor(100 + Math.random() * 899)}`,
        ipAddress: `192.168.1.${140 + (this.demoDevices.length % 90)}`,
        macAddress: `${randomHex()}:${randomHex()}:${randomHex()}:${randomHex()}:${randomHex()}:${randomHex()}`,
        connectionType: Math.random() > 0.4 ? '2.4GHz' : '5GHz',
        online: true,
        signalStrength: -54 - Math.floor(Math.random() * 18),
        connectedSince: Date.now(),
      };
      this.demoDevices = [customDevice, ...this.demoDevices];
      return customDevice;
    }

    const newDevice: ConnectedDevice = {
      id: `dev-sim-${Date.now()}`,
      hostname: candidate.hostname,
      ipAddress: `192.168.1.${130 + this.demoDevices.length}`,
      macAddress: candidate.macAddress,
      connectionType: candidate.connectionType,
      online: true,
      signalStrength: candidate.connectionType === 'LAN' ? undefined : -55,
      connectedSince: Date.now(),
    };
    this.demoDevices = [newDevice, ...this.demoDevices];
    return newDevice;
  }

  async setMacFilterMode(config: RouterConfig, mode: FirewallFilterMode): Promise<boolean> {
    if (config.mode === 'demo') {
      await this.delay(100);
      return true;
    }
    if (!isValidGatewayHost(config.gatewayIp) || this.isBrowserHttpsBlocked()) return false;

    const routerModeCode = mode === 'whitelist' ? '1' : mode === 'blacklist' ? '2' : '0';
    try {
      const auth = await this.ensureAuthenticated(config);
      if (!auth.ok) return false;
      const postPath =
        auth.protocol === 'reqproc' ? '/reqproc/proc_post' : '/goform/goform_set_cmd_process';
      const res = await this.sendRouterRequest(config, postPath, {
        method: 'POST',
        body: new URLSearchParams({
          isTest: 'false',
          goformId: 'SET_MAC_FILTER_MODE',
          mac_filter_mode: routerModeCode,
        }).toString(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async syncFirewallRules(
    config: RouterConfig,
    mode: FirewallFilterMode,
    rules: FirewallRule[]
  ): Promise<boolean> {
    if (config.mode === 'demo') {
      await this.delay(100);
      return true;
    }
    if (!isValidGatewayHost(config.gatewayIp) || this.isBrowserHttpsBlocked()) return false;

    const effectiveMacs =
      mode === 'whitelist'
        ? rules.filter((r) => r.enabled && !r.expired).map((r) => r.macAddress)
        : mode === 'blacklist'
          ? rules.filter((r) => r.enabled || r.expired).map((r) => r.macAddress)
          : [];

    try {
      const auth = await this.ensureAuthenticated(config);
      if (!auth.ok) return false;
      const postPath =
        auth.protocol === 'reqproc' ? '/reqproc/proc_post' : '/goform/goform_set_cmd_process';
      const res = await this.sendRouterRequest(config, postPath, {
        method: 'POST',
        body: new URLSearchParams({
          isTest: 'false',
          goformId: 'SET_MAC_FILTER',
          mac_filter_mode: mode === 'whitelist' ? '1' : mode === 'blacklist' ? '2' : '0',
          mac_filter_enable: mode === 'disabled' ? '0' : '1',
          mac_filter_list: effectiveMacs.join(';'),
        }).toString(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private parseZltStationPayload(payload: Record<string, unknown>): ConnectedDevice[] {
    const seenMacs = new Map<string, ConnectedDevice>();

    const addEntry = (
      macRaw: unknown,
      hostnameRaw: unknown,
      ipRaw: unknown,
      bandRaw: unknown
    ) => {
      const mac = String(macRaw || '').trim().toUpperCase().replace(/-/g, ':');
      if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) return;
      if (seenMacs.has(mac)) return;

      const bandStr = String(bandRaw || '2.4GHz').toLowerCase();
      const connectionType: ConnectionBand =
        bandStr.includes('5g') || bandStr.includes('5.8') || bandStr === '5'
          ? '5GHz'
          : bandStr.includes('lan') || bandStr.includes('eth') || bandStr.includes('wired')
            ? 'LAN'
            : '2.4GHz';

      const hostname =
        String(hostnameRaw || '').trim() || `Client-${mac.slice(-5).replace(':', '')}`;
      const ipAddress = String(ipRaw || '').trim() || '192.168.1.x';

      seenMacs.set(mac, {
        id: `cpe-${mac}`,
        hostname,
        ipAddress,
        macAddress: mac,
        connectionType,
        online: true,
        connectedSince: Date.now(),
      });
    };

    const parseCollection = (raw: unknown, defaultBand: ConnectionBand) => {
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (item && typeof item === 'object') {
            const rec = item as Record<string, unknown>;
            addEntry(
              rec.mac_addr ?? rec.mac ?? rec.macAddress ?? rec.sta_mac ?? rec.macaddr,
              rec.hostname ?? rec.dev_name ?? rec.host_name ?? rec.name ?? rec.device_name,
              rec.ip_addr ?? rec.ip ?? rec.ipAddress ?? rec.sta_ip ?? rec.ipaddr,
              rec.connect_type ?? rec.wifi_mode ?? rec.band ?? rec.interface ?? defaultBand
            );
          } else if (typeof item === 'string') {
            const parts = item.split(',').map((s) => s.trim());
            const mac = parts.find((p) => /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(p));
            const ip = parts.find((p) => /^\d{1,3}(\.\d{1,3}){3}$/.test(p));
            const host = parts.find((p) => p !== mac && p !== ip && p.length > 0);
            if (mac) addEntry(mac, host, ip, defaultBand);
          }
        }
      } else if (typeof raw === 'string' && raw.trim()) {
        for (const row of raw.split(';')) {
          const parts = row.split(',').map((s) => s.trim());
          const mac = parts.find((p) => /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(p));
          const ip = parts.find((p) => /^\d{1,3}(\.\d{1,3}){3}$/.test(p));
          const host = parts.find((p) => p !== mac && p !== ip && p.length > 0);
          if (mac) addEntry(mac, host, ip, defaultBand);
        }
      }
    };

    parseCollection(payload.station_list, '2.4GHz');
    parseCollection(payload.lan_station_list, 'LAN');
    parseCollection(payload.dhcp_list, '2.4GHz');
    parseCollection(payload.dhcp_client_list, '2.4GHz');
    parseCollection(payload.leases, '2.4GHz');
    parseCollection(payload.clients, '2.4GHz');
    parseCollection(payload.data, '2.4GHz');

    return Array.from(seenMacs.values());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}

export const routerApiService = new RouterApiService();
