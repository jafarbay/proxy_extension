document.getElementById('enableProxy').addEventListener('click', function() {
  const proxyString = document.getElementById('proxyString').value.trim();
  
  // Проверка формата
  const regex = /^([^:]+):([^@]+)@([^:]+):(\d+)$/;
  const match = proxyString.match(regex);
  
  if (!match) {
    showStatus('Неверный формат. Используйте: user:pass@ip:port');
    return;
  }

  const [_, username, password, host, port] = match;
  
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
      showStatus('Прокси включен');
    } else {
      showStatus('Ошибка: ' + (response.error || 'Неизвестная ошибка'));
    }
  });
});

document.getElementById('disableProxy').addEventListener('click', function() {
  chrome.runtime.sendMessage({
    action: 'disableProxy'
  }, function(response) {
    if (response && response.success) {
      showStatus('Прокси отключен');
    } else {
      showStatus('Ошибка при отключении прокси');
    }
  });
});

function showStatus(message) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  setTimeout(() => {
    statusElement.textContent = '';
  }, 3000);
}