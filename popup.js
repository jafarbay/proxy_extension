// При загрузке popup
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем сохраненный прокси и проверяем статус
    chrome.storage.local.get(['proxyString', 'proxyEnabled'], function(result) {
        if (result.proxyString) {
            document.getElementById('proxyString').value = result.proxyString;
        }
        
        // Обновляем состояние кнопок и статус
        updateButtonState(result.proxyEnabled);
        updateProxyStatus(result.proxyEnabled);
    });
});

document.getElementById('enableProxy').addEventListener('click', function() {
    const proxyString = document.getElementById('proxyString').value.trim();
    
    // Проверка формата
    const regex = /^([^:]+):([^@]+)@([^:]+):(\d+)$/;
    const match = proxyString.match(regex);
    
    if (!match) {
        showStatus('Неверный формат. Используйте: user:pass@ip:port', 'error');
        return;
    }

    const [_, username, password, host, port] = match;
    
    // Сохраняем прокси строку
    chrome.storage.local.set({
        proxyString: proxyString,
        proxyEnabled: true
    });
    
    chrome.runtime.sendMessage({
        action: 'enableProxy',
        config: {
            username,
            password,
            host,
            port: parseInt(port)
        }
    }, function(response) {
        if (response && response.success) {
            showStatus('Прокси включен', 'success');
            updateButtonState(true);
            updateProxyStatus(true);
        } else {
            showStatus('Ошибка: ' + (response.error || 'Неизвестная ошибка'), 'error');
            updateButtonState(false);
            updateProxyStatus(false);
        }
    });
});

document.getElementById('disableProxy').addEventListener('click', function() {
    chrome.storage.local.set({ proxyEnabled: false });
    
    chrome.runtime.sendMessage({
        action: 'disableProxy'
    }, function(response) {
        if (response && response.success) {
            showStatus('Прокси отключен', 'success');
            updateButtonState(false);
            updateProxyStatus(false);
        } else {
            showStatus('Ошибка при отключении прокси', 'error');
        }
    });
});

function showStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = type;
    
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = '';
    }, 3000);
}

function updateButtonState(enabled) {
    const enableBtn = document.getElementById('enableProxy');
    const disableBtn = document.getElementById('disableProxy');
    
    if (enabled) {
        enableBtn.style.opacity = '0.7';
        disableBtn.style.opacity = '1';
    } else {
        enableBtn.style.opacity = '1';
        disableBtn.style.opacity = '0.7';
    }
}

function updateProxyStatus(enabled) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (enabled) {
        statusIndicator.className = 'status-indicator status-active';
        statusText.textContent = 'Прокси активен';
    } else {
        statusIndicator.className = 'status-indicator status-inactive';
        statusText.textContent = 'Прокси отключен';
    }
}