'use client';

import { useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';

export function VkInit() {
  useEffect(() => {
    // Initialize VK Mini App
    bridge.send('VKWebAppInit')
      .then(() => {
        console.log('[VK] VKWebAppInit success');
      })
      .catch((err) => {
        console.warn('[VK] VKWebAppInit failed (probably running outside VK)', err);
      });

    // Handle theme changes
    bridge.subscribe((event) => {
      if (event.detail.type === 'VKWebAppUpdateConfig') {
        const { appearance } = event.detail.data;
        document.documentElement.setAttribute('data-vk-appearance', appearance);
      }
    });
  }, []);

  return null;
}
