document.addEventListener('DOMContentLoaded', () => {
  const proxyInput = document.getElementById('proxyInput');
  const httpBtn = document.getElementById('httpBtn');
  const httpsBtn = document.getElementById('httpsBtn');
  const toggleProxyBtn = document.getElementById('toggleProxy');

  let isProxyEnabled = false;
  let selectedProtocol = 'http';

  // Загрузка сохраненных настроек
  chrome.storage.local.get(['proxyConfig', 'isProxyEnabled', 'selectedProtocol'], (data) => {
    if (data.proxyConfig) {
      proxyInput.value = data.proxyConfig.proxyString || '';
    }
    if (data.isProxyEnabled) {
      isProxyEnabled = data.isProxyEnabled;
      toggleProxyBtn.textContent = isProxyEnabled ? 'Disable Proxy' : 'Enable Proxy';
      toggleProxyBtn.classList.toggle('disabled', isProxyEnabled);
    }
    if (data.selectedProtocol) {
      selectedProtocol = data.selectedProtocol;
      updateProtocolButtons();
    }
  });

  // Обработка выбора протокола
  httpBtn.addEventListener('click', () => {
    selectedProtocol = 'http';
    updateProtocolButtons();
    saveSettings();
  });

  httpsBtn.addEventListener('click', () => {
    selectedProtocol = 'https';
    updateProtocolButtons();
    saveSettings();
  });

  // Включение/выключение прокси
  toggleProxyBtn.addEventListener('click', () => {
    isProxyEnabled = !isProxyEnabled;
    toggleProxyBtn.textContent = isProxyEnabled ? 'Disable Proxy' : 'Enable Proxy';
    toggleProxyBtn.classList.toggle('disabled', isProxyEnabled);

    if (isProxyEnabled) {
      const proxyString = proxyInput.value.trim();
      if (!proxyString) {
        alert('Please enter a proxy in the format login:password@ip:port');
        isProxyEnabled = false;
        toggleProxyBtn.textContent = 'Enable Proxy';
        toggleProxyBtn.classList.remove('disabled');
        return;
      }

      const proxyConfig = parseProxyString(proxyString);
      if (!proxyConfig) {
        alert('Invalid proxy format. Use login:password@ip:port');
        isProxyEnabled = false;
        toggleProxyBtn.textContent = 'Enable Proxy';
        toggleProxyBtn.classList.remove('disabled');
        return;
      }

      // Сохранение настроек и включение прокси
      saveSettings();
      chrome.runtime.sendMessage({ action: 'enableProxy', proxyConfig, protocol: selectedProtocol });
    } else {
      // Отключение прокси
      saveSettings();
      chrome.runtime.sendMessage({ action: 'disableProxy' });
    }
  });

  // Функция для обновления активного протокола
  function updateProtocolButtons() {
    httpBtn.classList.toggle('active', selectedProtocol === 'http');
    httpsBtn.classList.toggle('active', selectedProtocol === 'https');
  }

  // Функция для парсинга строки прокси
  function parseProxyString(proxyString) {
    const regex = /^([^:]+):([^@]+)@([^:]+):(\d+)$/;
    const match = proxyString.match(regex);
    if (!match) return null;
    return {
      proxyString,
      username: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4], 10)
    };
  }

  // Сохранение настроек
  function saveSettings() {
    const proxyString = proxyInput.value.trim();
    const proxyConfig = proxyString ? parseProxyString(proxyString) : null;
    chrome.storage.local.set({
      proxyConfig,
      isProxyEnabled,
      selectedProtocol
    });
  }
});