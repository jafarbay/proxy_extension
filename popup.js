// В popup.js
document.getElementById('enableProxy').addEventListener('click', function() {
  // Предположим, что у вас есть текстовое поле для ввода прокси в формате логин:пароль@айпи:порт
  const proxyString = document.getElementById('proxyString').value;
  const protocol = document.getElementById('protocol').value || 'http';
  
  chrome.runtime.sendMessage({
    action: 'enableProxy',
    proxyString: proxyString,
    protocol: protocol
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
  // Автоматически скрыть сообщение через 3 секунды
  setTimeout(() => {
    statusElement.textContent = '';
  }, 3000);
}