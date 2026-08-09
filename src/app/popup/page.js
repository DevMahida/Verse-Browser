"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import ExtensionsPopup from '@/components/toolbar/ExtensionsPopup';
import DownloadsPopup from '@/components/toolbar/DownloadsPopup';
import HistoryPopup from '@/components/toolbar/HistoryPopup';
import ZoomPopup from '@/components/toolbar/ZoomPopup';
import VerseShieldPopup from '@/components/toolbar/VerseShieldPopup';
import ProfileMenu from '@/components/toolbar/ProfileMenu';
import SiteSettingsPopup from '@/components/toolbar/SiteSettingsPopup';
import SuggestionsPopup from '@/components/toolbar/SuggestionsPopup';
import VaultPopup from '@/components/toolbar/VaultPopup';
import PermissionPrompt from '@/components/toolbar/PermissionPrompt';

import TabSearchMenu from '@/components/toolbar/TabSearchMenu';
import BrowserMenu from '@/components/toolbar/BrowserMenu';
import TabContextMenu from '@/components/toolbar/TabContextMenu';

function PopupContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'extensions';
  const url = searchParams.get('url');
  const tabIdParam = searchParams.get('tabId');
  const tabId = tabIdParam || null;

  const handleClose = () => {
    if (window.electron && window.electron.tabManager && window.electron.tabManager.closePopup) {
      window.electron.tabManager.closePopup();
    }
  };

  return (
    <div className="w-screen h-screen bg-transparent flex items-start justify-start overflow-hidden">
        {type === 'extensions' && <ExtensionsPopup onClose={handleClose} isStandalone />}
        {type === 'downloads' && <DownloadsPopup onClose={handleClose} isStandalone />}
        {type === 'history' && <HistoryPopup onClose={handleClose} isStandalone />}
        {type === 'zoom' && <ZoomPopup onClose={handleClose} isStandalone />}
        {type === 'shield' && <VerseShieldPopup url={url} tabId={tabId} onClose={handleClose} isStandalone />}
        {type === 'profile' && <ProfileMenu onClose={handleClose} isStandalone />}
        {type === 'sitesettings' && <SiteSettingsPopup url={url} tabId={tabId} onClose={handleClose} isStandalone />}
        {type === 'suggestions' && <SuggestionsPopup />}
        {type === 'vault' && <VaultPopup onClose={handleClose} isStandalone />}
        {type === 'permission' && <PermissionPrompt />}
        {type === 'browser-menu' && <BrowserMenu isStandalone />}
        {type === 'tab-context' && <TabContextMenu tabId={tabId} isStandalone />}
        {type === 'tab-search' && <TabSearchMenu isStandalone />}
    </div>
  );
}

export default function PopupPage() {
  return (
    <Suspense fallback={<div className="bg-transparent" />}>
      <PopupContent />
    </Suspense>
  );
}
