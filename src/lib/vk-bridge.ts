import bridge from '@vkontakte/vk-bridge';

export async function initVkMiniApp() {
  await bridge.send('VKWebAppInit');
}

export async function getVkUserInfo() {
  return bridge.send('VKWebAppGetUserInfo');
}
