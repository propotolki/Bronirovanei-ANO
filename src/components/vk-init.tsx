'use client';

import { useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';

export function VkInit() {
  useEffect(() => {
    // Subscribe to events BEFORE initializing to catch the initial config
    function handleEvent(event: any) {
      if (event.detail.type === 'VKWebAppUpdateConfig') {
        const { appearance } = event.detail.data;
        console.log('[VK] Theme changed:', appearance);
        document.documentElement.setAttribute('data-vk-appearance', appearance);
        
        // Sync with Tailwind dark mode (uses class strategy)
        if (appearance === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
    
    bridge.subscribe(handleEvent);

    // Initialize VK Mini App
    bridge.send('VKWebAppInit')
      .then(() => {
        console.log('[VK] VKWebAppInit success');
      })
      .catch((err) => {
        console.warn('[VK] VKWebAppInit failed (probably running outside VK)', err);
      });

    return () => {
      bridge.unsubscribe(handleEvent);
    };
  }, []);

  return null;
}
