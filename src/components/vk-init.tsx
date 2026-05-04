'use client';

import { useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';

export function VkInit() {
  useEffect(() => {
    // Initialize VK Mini App
    bridge.send('VKWebAppInit')
      .then(() => {
        console.log('[VK] VKWebAppInit success');
        
        // Get initial theme after init
        return bridge.send('VKWebAppGetConfig');
      })
      .then((config: any) => {
        if (config && config.appearance) {
          const appearance = config.appearance;
          document.documentElement.setAttribute('data-vk-appearance', appearance);
          if (appearance === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      })
      .catch((err) => {
        console.warn('[VK] VKWebAppInit failed (probably running outside VK)', err);
      });

    // Handle theme changes
    bridge.subscribe((event) => {
      if (event.detail.type === 'VKWebAppUpdateConfig') {
        const { appearance } = event.detail.data;
        document.documentElement.setAttribute('data-vk-appearance', appearance);
        
        // Sync with Tailwind dark mode (uses class strategy)
        if (appearance === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }, []);

  return null;
}
