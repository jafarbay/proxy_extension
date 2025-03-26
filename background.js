let proxyConfig = null;

// Обработчик аутентификации с дополнительными проверками
const authHandler = function(details, callback) {
    console.log('Auth requested for:', details.url, 'isProxy:', details.isProxy);
    
    // Проверяем все возможные случаи для аутентификации
    if (proxyConfig) {
        const authCredentials = {
            username: proxyConfig.username,
            password: proxyConfig.password
        };
        
        // Логируем попытку аутентификации
        console.log('Attempting authentication with:', proxyConfig.username);
        
        return callback({
            authCredentials: authCredentials
        });
    }
    
    console.log('No proxy config available');
    return callback({});
};

// Регистрируем обработчик авторизации
chrome.webRequest.onAuthRequired.addListener(
    authHandler,
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enableProxy') {
        try {
            const config = request.config;
            proxyConfig = config;

            // Настраиваем прокси с использованием fixed_servers
            const proxyRules = {
                mode: "fixed_servers",
                rules: {
                    singleProxy: {
                        scheme: "http",
                        host: config.host,
                        port: parseInt(config.port)
                    },
                    bypassList: []
                }
            };

            // Применяем настройки прокси
            chrome.proxy.settings.set(
                {
                    value: proxyRules,
                    scope: 'regular'
                },
                function() {
                    // Проверяем успешность установки
                    chrome.proxy.settings.get({}, function(config) {
                        console.log('Current proxy configuration:', config);
                        if (chrome.runtime.lastError) {
                            console.error('Proxy setup error:', chrome.runtime.lastError);
                            sendResponse({ 
                                success: false, 
                                error: chrome.runtime.lastError.message 
                            });
                        } else {
                            console.log('Proxy setup successful');
                            sendResponse({ success: true });
                        }
                    });
                }
            );

        } catch (error) {
            console.error('Error in enableProxy:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    if (request.action === 'disableProxy') {
        try {
            proxyConfig = null;
            chrome.proxy.settings.clear(
                { scope: 'regular' },
                function() {
                    if (chrome.runtime.lastError) {
                        console.error('Error clearing proxy:', chrome.runtime.lastError);
                        sendResponse({ 
                            success: false, 
                            error: chrome.runtime.lastError.message 
                        });
                    } else {
                        console.log('Proxy disabled successfully');
                        sendResponse({ success: true });
                    }
                }
            );
        } catch (error) {
            console.error('Error in disableProxy:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }
});

// Обработчик ошибок прокси
chrome.proxy.onProxyError.addListener(function(details) {
    console.error('Proxy error occurred:', details);
});

// Сохраняем конфигурацию при запуске
chrome.runtime.onStartup.addListener(function() {
    chrome.storage.local.get(['proxyConfig'], function(result) {
        if (result.proxyConfig) {
            proxyConfig = result.proxyConfig;
        }
    });
});