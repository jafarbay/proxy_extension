// Обработчик сообщений от popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'enableProxy') {
    const { proxyConfig, protocol } = message;
    enableProxy(proxyConfig, protocol);
  } else if (message.action === 'disableProxy') {
    disableProxy();
  }
});

// Функция для включения прокси
function enableProxy(proxyConfig, protocol) {
  const config = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: protocol,
        host: proxyConfig.host,
        port: proxyConfig.port
      },
      bypassList: ['<local>'] // Исключение локальных адресов
    }
  };

  // Установка прокси
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    console.log('Proxy enabled:', proxyConfig);

    // Регистрация обработчика авторизации
    chrome.webRequest.onAuthRequired.addListener(
      (details, callback) => {
        console.log('Auth required for:', details.url);
        if (proxyConfig.username && proxyConfig.password) {
          console.log('Providing credentials:', {
            username: proxyConfig.username,
            password: '****' // Маскируем пароль в логах
          });
          callback({
            authCredentials: {
              username: proxyConfig.username,
              password: proxyConfig.password
            }
          });
        } else {
          console.error('No credentials provided for proxy');
          callback({}); // Оставляем пустой ответ, если нет данных
        }
      },
      { urls: ['<all_urls>'] },
      ['blocking', 'asyncBlocking']
    );
  });
}

// Функция для отключения прокси
function disableProxy() {
  // Очистка настроек прокси
  chrome.proxy.settings.clear({ scope: 'regular' }, () => {
    console.log('Proxy disabled');

    // Удаление обработчика авторизации
    chrome.webRequest.onAuthRequired.removeListener(
      (details, callback) => {
        callback({});
      }
    );
  });
}