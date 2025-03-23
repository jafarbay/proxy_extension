// Сохраняем ссылку на функцию-обработчик
let authHandler = null;

// Функция для разбора URL прокси в формате логин:пароль@айпи:порт
function parseProxyString(proxyString) {
  const regex = /^(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/;
  const match = proxyString.match(regex);
  
  if (match) {
    return {
      username: match[1] || '',
      password: match[2] || '',
      host: match[3],
      port: parseInt(match[4], 10)
    };
  } else {
    console.error('Invalid proxy string format');
    return null;
  }
}

// Обработчик сообщений от popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'enableProxy') {
    // Проверяем, пришла ли строка в формате логин:пароль@айпи:порт
    if (message.proxyString) {
      const proxyConfig = parseProxyString(message.proxyString);
      if (proxyConfig) {
        const protocol = message.protocol || 'http'; // По умолчанию http
        enableProxy(proxyConfig, protocol);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Invalid proxy format' });
      }
    } else {
      // Оригинальный вариант с отдельными полями
      const { proxyConfig, protocol } = message;
      enableProxy(proxyConfig, protocol);
      sendResponse({ success: true });
    }
  } else if (message.action === 'disableProxy') {
    disableProxy();
    sendResponse({ success: true });
  }
  return true; // Важно для асинхронных ответов
});

// Функция для включения прокси
function enableProxy(proxyConfig, protocol) {
  const config = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: protocol || 'http',
        host: proxyConfig.host,
        port: parseInt(proxyConfig.port, 10)
      },
      bypassList: ['<local>'] // Исключение локальных адресов
    }
  };
  
  // Установка прокси
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    console.log('Proxy enabled:', {
      host: proxyConfig.host,
      port: proxyConfig.port,
      username: proxyConfig.username ? '****' : 'none', // Маскируем данные
      hasPassword: !!proxyConfig.password
    });
    
    // Удаляем предыдущий обработчик авторизации, если он существует
    if (authHandler) {
      chrome.webRequest.onAuthRequired.removeListener(authHandler);
    }
    
    // Создаем новый обработчик авторизации
    authHandler = function(details, callback) {
      console.log('Auth required for:', details.url);
      if (proxyConfig.username && proxyConfig.password) {
        console.log('Providing credentials for user:', proxyConfig.username);
        return {
          authCredentials: {
            username: proxyConfig.username,
            password: proxyConfig.password
          }
        };
      } else {
        console.error('No credentials provided for proxy');
        return {};
      }
    };
    
    // Регистрируем обработчик авторизации
    // В новых версиях Chrome 'blocking' и 'asyncBlocking' могут быть устаревшими
    // Проверьте актуальную документацию
    try {
      chrome.webRequest.onAuthRequired.addListener(
        authHandler,
        { urls: ['<all_urls>'] },
        ['blocking']
      );
    } catch (e) {
      console.error('Error registering auth handler:', e);
      // Пробуем альтернативный вариант для новых версий Chrome
      chrome.webRequest.onAuthRequired.addListener(
        authHandler,
        { urls: ['<all_urls>'] }
      );
    }
  });
}

// Функция для отключения прокси
function disableProxy() {
  // Очистка настроек прокси
  chrome.proxy.settings.clear({ scope: 'regular' }, () => {
    console.log('Proxy disabled');
    
    // Удаляем обработчик авторизации, если он существует
    if (authHandler) {
      try {
        chrome.webRequest.onAuthRequired.removeListener(authHandler);
      } catch (e) {
        console.error('Error removing auth handler:', e);
      }
      authHandler = null;
    }
  });
}

// Инициализация при запуске расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('Proxy extension installed');
  // При необходимости можно добавить инициализацию настроек здесь
});