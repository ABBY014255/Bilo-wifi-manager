import { DurationUnit, FirewallFilterMode, Language } from './types';

export interface TranslationStrings {
  appName: string;
  tabs: {
    devices: string;
    devicesSub: string;
    firewall: string;
    firewallSub: string;
    packages: string;
    packagesSub: string;
    payments: string;
    paymentsSub: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    copy: string;
    copied: string;
    refresh: string;
    search: string;
    all: string;
    confirmDelete: string;
    demoMode: string;
    liveRouter: string;
    routerSettings: string;
    permanentAccess: string;
    expired: string;
    active: string;
    inactive: string;
    member: string;
    customer: string;
    online: string;
    offline: string;
  };
  devices: {
    title: string;
    subtitle: string;
    connectedCount: string;
    searchPlaceholder: string;
    simulateJoin: string;
    emptyTitle: string;
    emptyDesc: string;
    deviceDetails: string;
    hostname: string;
    ipAddress: string;
    macAddress: string;
    connectionType: string;
    status: string;
    copyIp: string;
    copyMac: string;
    addToFirewall: string;
    alreadyInFirewall: string;
    ipCopiedToast: string;
    macCopiedToast: string;
    refreshedToast: string;
    simulatedJoinToast: string;
  };
  firewall: {
    title: string;
    subtitle: string;
    filterModeLabel: string;
    modes: Record<FirewallFilterMode, { label: string; desc: string }>;
    addRule: string;
    emptyTitle: string;
    emptyDesc: string;
    deviceName: string;
    deviceNamePlaceholder: string;
    macAddress: string;
    macPlaceholder: string;
    pasteCopiedMac: string;
    noCopiedMacToast: string;
    invalidMacError: string;
    duplicateMacError: string;
    nameRequiredError: string;
    protocol: string;
    userTypeQuestion: string;
    memberOptionTitle: string;
    memberOptionDesc: string;
    customerOptionTitle: string;
    customerOptionDesc: string;
    memberSkipNotice: string;
    accessDurationMode: string;
    customTimerTitle: string;
    customTimerDesc: string;
    paidPackageTitle: string;
    paidPackageDesc: string;
    quickPresets: string;
    customDuration: string;
    selectPackage: string;
    noPackagesHint: string;
    saveRule: string;
    ruleDetails: string;
    remainingTime: string;
    expiresAt: string;
    editName: string;
    updateName: string;
    deleteRule: string;
    renewTime: string;
    renewTitle: string;
    renewConfirm: string;
    ruleAddedToast: string;
    ruleAddedWithPaymentToast: string;
    ruleUpdatedToast: string;
    ruleDeletedToast: string;
    ruleRenewedToast: string;
    autoExpiredToast: string;
    modeChangedToast: string;
    toggleOnToast: string;
    toggleOffToast: string;
    disabledBanner: string;
    whitelistHelp: string;
    blacklistHelp: string;
  };
  packages: {
    title: string;
    subtitle: string;
    addPackage: string;
    editPackage: string;
    emptyTitle: string;
    emptyDesc: string;
    packageName: string;
    packageNamePlaceholder: string;
    priceTzs: string;
    durationValue: string;
    durationUnit: string;
    units: Record<DurationUnit, string>;
    packageSavedToast: string;
    packageUpdatedToast: string;
    packageDeletedToast: string;
    validationError: string;
    usedInBillingNote: string;
  };
  payments: {
    title: string;
    subtitle: string;
    today: string;
    todaySub: string;
    thisWeek: string;
    thisWeekSub: string;
    thisMonth: string;
    thisMonthSub: string;
    allTime: string;
    allTimeSub: string;
    ledgerTitle: string;
    searchPlaceholder: string;
    exportCsv: string;
    copySummary: string;
    summaryCopiedToast: string;
    csvDownloadedToast: string;
    emptyTitle: string;
    emptyDesc: string;
    customerColumn: string;
    packageColumn: string;
    amountColumn: string;
    dateColumn: string;
    transactionsCount: string;
    deleteRecordConfirm: string;
    recordDeletedToast: string;
  };
  routerModal: {
    title: string;
    subtitle: string;
    connectRealWifi: string;
    connectedBanner: string;
    disconnectedBanner: string;
    demoBanner: string;
    connectionMode: string;
    demoTitle: string;
    demoDesc: string;
    liveTitle: string;
    liveDesc: string;
    nativeDirectNote: string;
    tabConnection: string;
    tabTools: string;
    gatewayIp: string;
    autoDetectIp: string;
    scanningIp: string;
    username: string;
    password: string;
    passwordMemoryNote: string;
    routerApiLabel: string;
    testConnection: string;
    testing: string;
    saveConfig: string;
    syncFromRouter: string;
    syncedRulesToast: string;
    demoConnectedMsg: string;
    routerUnreachableMsg: string;
    routerMixedContentMsg: string;
    routerAuthFailedMsg: string;
    routerInvalidHostMsg: string;
    routerConnectedMsg: string;
    endpointHint: string;
    resetDemoData: string;
    resetDoneToast: string;
    signalInfoTitle: string;
    providerLabel: string;
    networkTypeLabel: string;
    signalLabel: string;
    wanIpLabel: string;
    refreshSignal: string;
    signalUnavailable: string;
    wifiSettingsTitle: string;
    wifiSsidLabel: string;
    wifiPasswordLabel: string;
    wifiPasswordPlaceholder: string;
    updateWifiBtn: string;
    wifiUpdating: string;
    wifiUpdatedToast: string;
    wifiUpdateFailedToast: string;
    rebootRouterTitle: string;
    rebootRouterDesc: string;
    rebootRouterBtn: string;
    rebootConfirmBtn: string;
    rebooting: string;
    rebootSuccessToast: string;
    rebootFailedToast: string;
  };
}

export const translations: Record<Language, TranslationStrings> = {
  sw: {
    appName: 'Bilo wifi manager Pro',
    tabs: {
      devices: 'Vifaa',
      devicesSub: 'Devices',
      firewall: 'Firewall',
      firewallSub: 'MAC Filter',
      packages: 'Vifurushi',
      packagesSub: 'Packages',
      payments: 'Mapato',
      paymentsSub: 'Payments',
    },
    common: {
      save: 'Hifadhi',
      cancel: 'Ghairi',
      delete: 'Futa',
      edit: 'Hariri',
      close: 'Funga',
      copy: 'Nakili',
      copied: 'Imenakiliwa',
      refresh: 'Sasisha',
      search: 'Tafuta',
      all: 'Vyote',
      confirmDelete: 'Thibitisha Kufuta',
      demoMode: 'Hali ya Majaribio (Demo)',
      liveRouter: 'Rauta Halisi (ZLT/Tozed)',
      routerSettings: 'Mipangilio ya Rauta',
      permanentAccess: 'Ufikiaji wa Kudumu (Permanent)',
      expired: 'Muda Umeisha (Expired)',
      active: 'Inatumika',
      inactive: 'Imezimwa',
      member: 'Member',
      customer: 'Mteja',
      online: 'Mtandaoni',
      offline: 'Nje ya mtandao',
    },
    devices: {
      title: 'Vifaa Vilivyounganishwa',
      subtitle: 'Connected Devices · Gusa kifaa kunakili IP au MAC Address',
      connectedCount: 'vifaa mtandaoni',
      searchPlaceholder: 'Tafuta jina la kifaa, IP au MAC...',
      simulateJoin: 'Ongeza Kifaa (Demo)',
      emptyTitle: 'Hakuna vifaa vilivyopatikana',
      emptyDesc: 'Hakuna kifaa kinacholingana na kichujio au rauta haijarudisha vifaa.',
      deviceDetails: 'Taarifa za Kifaa',
      hostname: 'Jina la Kifaa (Hostname)',
      ipAddress: 'Anwani ya IP (IP Address)',
      macAddress: 'Anwani ya MAC (MAC Address)',
      connectionType: 'Aina ya Muunganisho',
      status: 'Hali ya Mtandao',
      copyIp: 'Nakili IP',
      copyMac: 'Nakili MAC Address',
      addToFirewall: 'Weka Kwenye Firewall',
      alreadyInFirewall: 'Tayari kipo Firewall',
      ipCopiedToast: 'IP Address imenakiliwa',
      macCopiedToast: 'MAC Address imenakiliwa na kuhifadhiwa kwa kubandika',
      refreshedToast: 'Orodha ya vifaa imesasishwa',
      simulatedJoinToast: 'Kifaa kipya kimejiunga na Wi-Fi',
    },
    firewall: {
      title: 'Firewall ya MAC',
      subtitle: 'MAC Filtering & Auto-Block · Dhibiti ufikiaji kwa majina',
      filterModeLabel: 'Hali ya Kichujio (Filter Mode)',
      modes: {
        whitelist: {
          label: 'Whitelist',
          desc: 'Ruhusu Walioorodheshwa Tu (Allow Listed Only)',
        },
        blacklist: {
          label: 'Blacklist',
          desc: 'Zuia Walioorodheshwa Tu (Block Listed Only)',
        },
        disabled: {
          label: 'Imezimwa',
          desc: 'Kichujio cha MAC Kimezimwa (Disabled)',
        },
      },
      addRule: 'Ongeza Kifaa',
      emptyTitle: 'Hakuna sheria za Firewall',
      emptyDesc: 'Bonyeza "Ongeza Kifaa" kusajili Member au Mteja mwenye muda maalum.',
      deviceName: 'Jina la Kifaa / Mteja',
      deviceNamePlaceholder: 'mf. Simu ya Juma, iPhone ya Boss',
      macAddress: 'MAC Address',
      macPlaceholder: 'AA:BB:CC:DD:EE:FF',
      pasteCopiedMac: 'Bandika MAC Iliyonakiliwa',
      noCopiedMacToast: 'Nakili MAC Address kutoka Vifaa kwanza',
      invalidMacError: 'Weka MAC Address sahihi (mf. AA:BB:CC:DD:EE:FF)',
      duplicateMacError: 'MAC Address hii tayari ipo kwenye orodha ya Firewall',
      nameRequiredError: 'Tafadhali weka jina la kifaa au mteja',
      protocol: 'Itifaki (Protocol)',
      userTypeQuestion: 'Huyu ni nani? (User Type)',
      memberOptionTitle: 'Member (Mwanafamilia / Staff)',
      memberOptionDesc: 'Ufikiaji wa kudumu bila malipo wala muda wa kuisha',
      customerOptionTitle: 'Mteja (Customer)',
      customerOptionDesc: 'Weka muda maalum au chagua kifurushi cha malipo',
      memberSkipNotice: 'Kifaa hiki kitapata ufikiaji wa kudumu (Permanent Access) bila kurekodi malipo au muda wa kuisha hadi ukizime mwenyewe.',
      accessDurationMode: 'Chagua Aina ya Muda (Access Mode)',
      customTimerTitle: 'Muda Maalumu (Custom Timer)',
      customTimerDesc: 'Weka muda wa kuzima moja kwa moja bila kurekodi fedha',
      paidPackageTitle: 'Kifurushi cha Malipo (Paid Package)',
      paidPackageDesc: 'Chagua kifurushi, weka muda na rekodi malipo kwenye Mapato',
      quickPresets: 'Muda wa Haraka',
      customDuration: 'Muda Maalumu',
      selectPackage: 'Chagua Kifurushi',
      noPackagesHint: 'Hakuna vifurushi vilivyosajiliwa. Ongeza kifurushi kwenye tab ya Vifurushi.',
      saveRule: 'Hifadhi Sheria',
      ruleDetails: 'Taarifa za Kiufundi',
      remainingTime: 'Muda Uliobaki',
      expiresAt: 'Inaisha Muda',
      editName: 'Badilisha Jina',
      updateName: 'Sasisha Jina',
      deleteRule: 'Futa Sheria',
      renewTime: 'Ongeza / Huisha Muda',
      renewTitle: 'Huisha Muda wa Mteja',
      renewConfirm: 'Huisha Ufikiaji',
      ruleAddedToast: 'Kifaa kimeongezwa kwenye Firewall',
      ruleAddedWithPaymentToast: 'Mteja ameongezwa na malipo yamerekodiwa kwenye Mapato',
      ruleUpdatedToast: 'Jina la kifaa limesasishwa',
      ruleDeletedToast: 'Sheria ya Firewall imefutwa',
      ruleRenewedToast: 'Muda wa mteja umehuishwa na kuwashwa',
      autoExpiredToast: 'Muda umeisha na kuzimwa kiotomatiki:',
      modeChangedToast: 'Hali ya Firewall imebadilishwa kuwa',
      toggleOnToast: 'Ufikiaji umewashwa kwa',
      toggleOffToast: 'Ufikiaji umezimwa kwa',
      disabledBanner: 'Firewall imezimwa kwa sasa. Badilisha kwenda Whitelist au Blacklist ili sheria zifanye kazi kwenye rauta.',
      whitelistHelp: 'Vifaa vilivyowashwa pekee ndivyo vinaruhusiwa kutumia intaneti.',
      blacklistHelp: 'Vifaa vilivyowekwa hapa vinazuiwa kuingia mtandaoni.',
    },
    packages: {
      title: 'Vifurushi vya Wi-Fi',
      subtitle: 'Package Management · Bei kwa Shilingi ya Tanzania (TZS)',
      addPackage: 'Ongeza Kifurushi',
      editPackage: 'Hariri Kifurushi',
      emptyTitle: 'Hakuna vifurushi',
      emptyDesc: 'Unda vifurushi vya Wi-Fi ili vitumike kuuza intaneti kwa wateja.',
      packageName: 'Jina la Kifurushi',
      packageNamePlaceholder: 'mf. Kifurushi cha Siku',
      priceTzs: 'Bei (TZS)',
      durationValue: 'Muda (Namba)',
      durationUnit: 'Kipimo cha Muda',
      units: {
        minutes: 'Dakika (Minutes)',
        hours: 'Masaa (Hours)',
        days: 'Siku (Days)',
      },
      packageSavedToast: 'Kifurushi kipya kimehifadhiwa',
      packageUpdatedToast: 'Kifurushi kimesasishwa',
      packageDeletedToast: 'Kifurushi kimefutwa',
      validationError: 'Tafadhali jaza jina, bei na muda sahihi',
      usedInBillingNote: 'Vifurushi hivi huonekana moja kwa moja unapoongeza Mteja kwenye Firewall.',
    },
    payments: {
      title: 'Mapato ya Fedha Taslimu',
      subtitle: 'Cash Revenue & Accounting · Ufuatiliaji wa mauzo ya Wi-Fi',
      today: 'Mapato ya Leo',
      todaySub: "Today's Revenue",
      thisWeek: 'Wiki Hii',
      thisWeekSub: 'This Week',
      thisMonth: 'Mwezi Huu',
      thisMonthSub: 'This Month',
      allTime: 'Jumla Kuu',
      allTimeSub: 'All-Time Total',
      ledgerTitle: 'Historia ya Malipo (Ledger)',
      searchPlaceholder: 'Tafuta jina la mteja au kifurushi...',
      exportCsv: 'Pakua CSV',
      copySummary: 'Nakili Muhtasari',
      summaryCopiedToast: 'Muhtasari wa mapato umenakiliwa',
      csvDownloadedToast: 'Faili la CSV limepakuliwa',
      emptyTitle: 'Hakuna rekodi za malipo',
      emptyDesc: 'Malipo ya wateja kutoka vifurushi vya Firewall yataonekana hapa moja kwa moja.',
      customerColumn: 'Mteja / Kifaa',
      packageColumn: 'Kifurushi',
      amountColumn: 'Kiasi (TZS)',
      dateColumn: 'Tarehe na Saa',
      transactionsCount: 'miamala',
      deleteRecordConfirm: 'Futa rekodi hii ya malipo?',
      recordDeletedToast: 'Rekodi ya malipo imefutwa',
    },
    routerModal: {
      title: 'Unganisha Wi-Fi Halisi (ZLT / Tozed)',
      subtitle: 'TZLink Direct CPE API · Unganisha rauta yako moja kwa moja kutoka simu',
      connectRealWifi: 'Unganisha Wi-Fi Halisi',
      connectedBanner: 'Imeunganishwa na Wi-Fi Halisi',
      disconnectedBanner: 'Rauta Halisi Haipatikani — Bofya kusanidi',
      demoBanner: 'Unatumia Demo Mode — Bofya kuunganisha Wi-Fi Halisi',
      connectionMode: 'Hali ya Uunganisho',
      demoTitle: 'Demo / Simulation Mode',
      demoDesc: 'Jaribu vipengele vyote bila rauta halisi ya Wi-Fi',
      liveTitle: 'Wi-Fi Halisi (ZLT / Tozed CPE)',
      liveDesc: 'Unganisha moja kwa moja na rauta ya LAN kudhibiti vifaa na Firewall',
      nativeDirectNote: 'Muunganisho wa moja kwa moja (Direct LAN / Android APK) bila PC wala seva ya ziada.',
      tabConnection: 'Muunganisho',
      tabTools: 'Zana za Rauta',
      gatewayIp: 'Gateway IP Address ya Rauta',
      autoDetectIp: 'Tafuta IP ya Rauta',
      scanningIp: 'Inatafuta...',
      username: 'Jina la Mtumiaji (Username)',
      password: 'Nenosiri la Admin (Password)',
      passwordMemoryNote: 'Nenosiri linatumika kwa kikao hiki pekee na halihifadhiwi kwenye kifaa.',
      routerApiLabel: 'Mfumo wa Rauta (API)',
      testConnection: 'Jaribu Muunganisho',
      testing: 'Inajaribu...',
      saveConfig: 'Unganisha na Hifadhi',
      syncFromRouter: 'Vuta MAC kutoka Rauta',
      syncedRulesToast: 'Sheria za Firewall zimesasishwa kutoka rauta',
      demoConnectedMsg: 'Demo Mode inafanya kazi. Vifaa na sheria zinahifadhiwa kwenye kifaa hiki.',
      routerUnreachableMsg: 'Rauta haikujibu. Hakikisha simu imeunganishwa na Wi-Fi ya rauta na Gateway IP ni sahihi (mf. 192.168.1.1, 192.168.0.1 au 192.168.8.1).',
      routerMixedContentMsg: 'Kivinjari cha HTTPS kinazuia maombi ya HTTP kwenda 192.168.x.x. Tumia Android APK iliyosakinishwa au fungua app kupitia HTTP ya LAN ili kuunganisha moja kwa moja.',
      routerAuthFailedMsg: 'Nenosiri la Admin la rauta si sahihi. Hakikisha jina na nenosiri la kuingia rauta (mf. admin).',
      routerInvalidHostMsg: 'Weka Gateway IP halali ya mtandao wa ndani (mf. 192.168.1.1, 192.168.0.1, 192.168.8.1 au 10.x.x.x).',
      routerConnectedMsg: 'Umeunganishwa kikamilifu na rauta halisi ya Wi-Fi!',
      endpointHint: 'Direct HTTP: /goform/goform_get_cmd_process & /goform/goform_set_cmd_process',
      resetDemoData: 'Rudisha Data ya Awali (Reset)',
      resetDoneToast: 'Data ya majaribio imerudishwa upya',
      signalInfoTitle: 'Taarifa za Mtandao na Mawimbi',
      providerLabel: 'Mtandao (Operator)',
      networkTypeLabel: 'Aina ya Mtandao',
      signalLabel: 'Nguvu ya Mawimbi',
      wanIpLabel: 'WAN IP',
      refreshSignal: 'Sasisha Mawimbi',
      signalUnavailable: 'Unganisha na rauta kwanza ili kusoma taarifa za mtandao na mawimbi.',
      wifiSettingsTitle: 'Mipangilio ya Jina na Nenosiri la Wi-Fi',
      wifiSsidLabel: 'Jina la Wi-Fi (SSID)',
      wifiPasswordLabel: 'Nenosiri Jipya la Wi-Fi (hiari)',
      wifiPasswordPlaceholder: 'Acha wazi kutobadilisha, au herufi 8+',
      updateWifiBtn: 'Sasisha Wi-Fi Kwenye Rauta',
      wifiUpdating: 'Inasasisha...',
      wifiUpdatedToast: 'Jina/Nenosiri la Wi-Fi limesasishwa kwenye rauta',
      wifiUpdateFailedToast: 'Imeshindwa kusasisha mipangilio ya Wi-Fi kwenye rauta',
      rebootRouterTitle: 'Zima na Uwashe Rauta Upya (Reboot)',
      rebootRouterDesc: 'Itakata intaneti kwa takriban sekunde 30–60 wakati rauta inawaka upya.',
      rebootRouterBtn: 'Washa Rauta Upya (Reboot)',
      rebootConfirmBtn: 'Thibitisha Reboot Sasa',
      rebooting: 'Inatuma amri...',
      rebootSuccessToast: 'Amri ya kuwasha rauta upya imetumwa',
      rebootFailedToast: 'Imeshindwa kutuma amri ya reboot kwa rauta',
    },
  },
  en: {
    appName: 'Bilo wifi manager Pro',
    tabs: {
      devices: 'Devices',
      devicesSub: 'Vifaa',
      firewall: 'Firewall',
      firewallSub: 'MAC Filter',
      packages: 'Packages',
      packagesSub: 'Vifurushi',
      payments: 'Payments',
      paymentsSub: 'Mapato',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied',
      refresh: 'Refresh',
      search: 'Search',
      all: 'All',
      confirmDelete: 'Confirm Delete',
      demoMode: 'Demo Mode',
      liveRouter: 'Live Router (ZLT/Tozed)',
      routerSettings: 'Router Settings',
      permanentAccess: 'Permanent Access',
      expired: 'Expired (Muda Umeisha)',
      active: 'Active',
      inactive: 'Inactive',
      member: 'Member',
      customer: 'Customer (Mteja)',
      online: 'Online',
      offline: 'Offline',
    },
    devices: {
      title: 'Connected Devices',
      subtitle: 'Live CPE clients · Tap any device to copy IP or MAC address',
      connectedCount: 'devices online',
      searchPlaceholder: 'Search hostname, IP or MAC...',
      simulateJoin: 'Simulate Client',
      emptyTitle: 'No devices found',
      emptyDesc: 'No connected devices match your filter or the router returned an empty list.',
      deviceDetails: 'Device Details',
      hostname: 'Device Hostname',
      ipAddress: 'IP Address',
      macAddress: 'MAC Address',
      connectionType: 'Connection Type',
      status: 'Status',
      copyIp: 'Copy IP',
      copyMac: 'Copy MAC Address',
      addToFirewall: 'Add to Firewall',
      alreadyInFirewall: 'In Firewall',
      ipCopiedToast: 'IP Address copied to clipboard',
      macCopiedToast: 'MAC Address copied and saved for quick paste',
      refreshedToast: 'Connected device list refreshed',
      simulatedJoinToast: 'New client connected to Wi-Fi',
    },
    firewall: {
      title: 'MAC Firewall',
      subtitle: 'Enhanced MAC Filtering & Auto-Block · Clean device-first control',
      filterModeLabel: 'Filter Mode',
      modes: {
        whitelist: {
          label: 'Whitelist',
          desc: 'Allow Listed Only',
        },
        blacklist: {
          label: 'Blacklist',
          desc: 'Block Listed Only',
        },
        disabled: {
          label: 'Disabled',
          desc: 'MAC Filtering Off',
        },
      },
      addRule: 'Add Rule',
      emptyTitle: 'No firewall rules yet',
      emptyDesc: 'Tap "Add Rule" to register a permanent Member or timed Customer.',
      deviceName: 'Device / Customer Name',
      deviceNamePlaceholder: 'e.g. Simu ya Juma, Boss iPhone',
      macAddress: 'MAC Address',
      macPlaceholder: 'AA:BB:CC:DD:EE:FF',
      pasteCopiedMac: 'Paste Copied MAC',
      noCopiedMacToast: 'Copy a MAC address from Devices tab first',
      invalidMacError: 'Enter a valid MAC address (e.g. AA:BB:CC:DD:EE:FF)',
      duplicateMacError: 'This MAC address already exists in the Firewall list',
      nameRequiredError: 'Please enter a device or customer name',
      protocol: 'Protocol',
      userTypeQuestion: 'Who is this user? (Huyu ni nani?)',
      memberOptionTitle: 'Member (Family / Staff)',
      memberOptionDesc: 'Permanent unlimited access with no billing or timer',
      customerOptionTitle: 'Customer (Mteja)',
      customerOptionDesc: 'Set a custom auto-block timer or assign a paid package',
      memberSkipNotice: 'This device receives Permanent Access immediately with no timer or payment entry until manually toggled off.',
      accessDurationMode: 'Access Duration Mode',
      customTimerTitle: 'Custom Auto-Block Timer',
      customTimerDesc: 'Set duration without recording a cash payment',
      paidPackageTitle: 'Paid Package Billing',
      paidPackageDesc: 'Select a package to start timer and log cash in Payments',
      quickPresets: 'Quick Presets',
      customDuration: 'Custom Duration',
      selectPackage: 'Select Package',
      noPackagesHint: 'No packages available. Add packages in the Packages tab first.',
      saveRule: 'Save Rule',
      ruleDetails: 'Technical Details',
      remainingTime: 'Remaining Time',
      expiresAt: 'Expiry Timestamp',
      editName: 'Edit Name',
      updateName: 'Update Name',
      deleteRule: 'Delete Rule',
      renewTime: 'Renew / Extend Time',
      renewTitle: 'Renew Customer Access',
      renewConfirm: 'Renew Access',
      ruleAddedToast: 'Device added to Firewall',
      ruleAddedWithPaymentToast: 'Customer added and cash payment logged in Payments',
      ruleUpdatedToast: 'Device name updated',
      ruleDeletedToast: 'Firewall rule removed',
      ruleRenewedToast: 'Customer timer renewed and re-enabled',
      autoExpiredToast: 'Timer expired and auto-blocked:',
      modeChangedToast: 'Firewall filter mode updated to',
      toggleOnToast: 'Access enabled for',
      toggleOffToast: 'Access disabled for',
      disabledBanner: 'Firewall filtering is currently disabled. Switch to Whitelist or Blacklist to enforce MAC rules on the router.',
      whitelistHelp: 'Only enabled devices on this list are permitted internet access.',
      blacklistHelp: 'Listed devices are blocked from accessing the network.',
    },
    packages: {
      title: 'Wi-Fi Packages',
      subtitle: 'Hotspot Plans · Priced in Tanzanian Shillings (TZS)',
      addPackage: 'Add Package',
      editPackage: 'Edit Package',
      emptyTitle: 'No packages configured',
      emptyDesc: 'Create Wi-Fi access packages to streamline customer billing.',
      packageName: 'Package Name',
      packageNamePlaceholder: 'e.g. Daily Pass',
      priceTzs: 'Price (TZS)',
      durationValue: 'Duration Value',
      durationUnit: 'Duration Unit',
      units: {
        minutes: 'Minutes',
        hours: 'Hours',
        days: 'Days',
      },
      packageSavedToast: 'Package created',
      packageUpdatedToast: 'Package updated',
      packageDeletedToast: 'Package deleted',
      validationError: 'Please enter a valid name, price, and duration',
      usedInBillingNote: 'Packages configured here appear immediately in Firewall Paid Package Billing.',
    },
    payments: {
      title: 'Cash Revenue',
      subtitle: 'Hotspot Accounting · Track daily, weekly, monthly & all-time TZS cash',
      today: "Today's Revenue",
      todaySub: 'Mapato ya Leo',
      thisWeek: 'This Week',
      thisWeekSub: 'Wiki Hii',
      thisMonth: 'This Month',
      thisMonthSub: 'Mwezi Huu',
      allTime: 'All-Time Total',
      allTimeSub: 'Jumla Kuu',
      ledgerTitle: 'Transaction History Ledger',
      searchPlaceholder: 'Search customer or package...',
      exportCsv: 'Download CSV',
      copySummary: 'Copy Summary',
      summaryCopiedToast: 'Revenue summary copied to clipboard',
      csvDownloadedToast: 'CSV ledger downloaded',
      emptyTitle: 'No payment records',
      emptyDesc: 'Paid customer packages added in Firewall are automatically logged here.',
      customerColumn: 'Customer / Device',
      packageColumn: 'Package',
      amountColumn: 'Amount (TZS)',
      dateColumn: 'Date & Time',
      transactionsCount: 'transactions',
      deleteRecordConfirm: 'Delete this payment record?',
      recordDeletedToast: 'Payment record deleted',
    },
    routerModal: {
      title: 'Connect Real Wi-Fi Router (ZLT / Tozed)',
      subtitle: 'TZLink Direct CPE API · Connect directly from your Android device over LAN',
      connectRealWifi: 'Connect Real Wi-Fi',
      connectedBanner: 'Connected to Real Wi-Fi Router',
      disconnectedBanner: 'Real Router Unreachable — Tap to configure',
      demoBanner: 'Running in Demo Mode — Tap to connect a real Wi-Fi router',
      connectionMode: 'Connection Mode',
      demoTitle: 'Demo / Simulation Mode',
      demoDesc: 'Test all features smoothly without a physical CPE router',
      liveTitle: 'Real Wi-Fi Router (ZLT / Tozed)',
      liveDesc: 'Connect directly over LAN to manage live clients and MAC Firewall',
      nativeDirectNote: 'Direct native HTTP connection (Android APK / local LAN) — no PC or bridge server needed.',
      tabConnection: 'Connection',
      tabTools: 'Router Controls',
      gatewayIp: 'Router Gateway IP Address',
      autoDetectIp: 'Auto-Detect IP',
      scanningIp: 'Scanning...',
      username: 'Admin Username',
      password: 'Admin Password',
      passwordMemoryNote: 'Password is kept in session memory only and is never stored on device storage.',
      routerApiLabel: 'Router API',
      testConnection: 'Test Connection',
      testing: 'Testing...',
      saveConfig: 'Connect & Save',
      syncFromRouter: 'Import MACs from Router',
      syncedRulesToast: 'Firewall rules synced from router',
      demoConnectedMsg: 'Demo Mode active. Devices, timers, and billing persist locally.',
      routerUnreachableMsg: 'Router did not respond. Verify your phone is connected to the router Wi-Fi and check the Gateway IP (e.g. 192.168.1.1, 192.168.0.1, or 192.168.8.1).',
      routerMixedContentMsg: 'HTTPS web browsers block direct HTTP calls to 192.168.x.x. Run the installed Android APK (Capacitor) or access over local HTTP LAN to connect directly.',
      routerAuthFailedMsg: 'Router admin password rejected. Check your router username/password and try again.',
      routerInvalidHostMsg: 'Enter a valid private LAN Gateway IP (e.g. 192.168.1.1, 192.168.0.1, 192.168.8.1, or 10.x.x.x).',
      routerConnectedMsg: 'Connected directly to your ZLT/Tozed Wi-Fi router!',
      endpointHint: 'Direct HTTP: /goform/goform_get_cmd_process & /goform/goform_set_cmd_process',
      resetDemoData: 'Reset Demo Data',
      resetDoneToast: 'Demo data restored to defaults',
      signalInfoTitle: 'Signal & Cellular Network Info',
      providerLabel: 'Operator',
      networkTypeLabel: 'Network Type',
      signalLabel: 'Signal Strength',
      wanIpLabel: 'WAN IP',
      refreshSignal: 'Refresh Signal',
      signalUnavailable: 'Test or save a live router connection to read cellular signal and network info.',
      wifiSettingsTitle: 'Wi-Fi SSID & Password',
      wifiSsidLabel: 'Wi-Fi Name (SSID)',
      wifiPasswordLabel: 'New Wi-Fi Password (optional)',
      wifiPasswordPlaceholder: 'Leave blank to keep current, or 8+ chars',
      updateWifiBtn: 'Update Router Wi-Fi',
      wifiUpdating: 'Updating...',
      wifiUpdatedToast: 'Wi-Fi SSID/password updated on router',
      wifiUpdateFailedToast: 'Could not update Wi-Fi settings on router',
      rebootRouterTitle: 'Reboot Router',
      rebootRouterDesc: 'Temporarily disconnects Wi-Fi clients for 30–60 seconds while the router restarts.',
      rebootRouterBtn: 'Reboot Router',
      rebootConfirmBtn: 'Confirm Reboot Now',
      rebooting: 'Sending command...',
      rebootSuccessToast: 'Reboot command sent to router',
      rebootFailedToast: 'Could not send reboot command to router',
    },
  },
};

export function formatDurationLabel(value: number, unit: DurationUnit, lang: Language): string {
  if (lang === 'sw') {
    if (unit === 'minutes') return value === 1 ? 'Dakika 1' : `Dakika ${value}`;
    if (unit === 'hours') return value === 1 ? 'Saa 1' : `Masaa ${value}`;
    return value === 1 ? 'Siku 1' : `Siku ${value}`;
  }
  if (unit === 'minutes') return value === 1 ? '1 Min' : `${value} Mins`;
  if (unit === 'hours') return value === 1 ? '1 Hour' : `${value} Hours`;
  return value === 1 ? '1 Day' : `${value} Days`;
}

export function formatTzs(amount: number): string {
  return `TZS ${amount.toLocaleString('en-US')}`;
}

export function durationToMs(value: number, unit: DurationUnit): number {
  const safeValue = Math.max(1, value);
  if (unit === 'minutes') return safeValue * 60 * 1000;
  if (unit === 'hours') return safeValue * 60 * 60 * 1000;
  return safeValue * 24 * 60 * 60 * 1000;
}

export function formatCountdown(remainingMs: number, lang: Language): string {
  if (remainingMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (days > 0) {
    const daySuffix = lang === 'sw' ? (days === 1 ? 'Siku 1' : `Siku ${days}`) : `${days}d`;
    return `${daySuffix} ${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}:${ss}`;
}

export function formatTimestamp(ts: number, lang: Language): string {
  return new Date(ts).toLocaleString(lang === 'sw' ? 'en-GB' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function normalizeMac(input: string): string {
  const hex = input.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 12);
  const pairs = hex.match(/.{1,2}/g);
  return pairs ? pairs.join(':') : '';
}

export function isValidMac(mac: string): boolean {
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac.trim().toUpperCase());
}
