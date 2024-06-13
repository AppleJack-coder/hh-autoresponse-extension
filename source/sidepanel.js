function forwardRequest(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (!response) return reject(chrome.runtime.lastError)
        return resolve(response)
      })
    })
}

function get_current_settings() {
    // Get current state
    var startButton = document.getElementById('startButton');
    var stopButton = document.getElementById('stopButton');
    forwardRequest({method: 'state', get: true}).then((response) => {
        if (response.success) {
            console.log(response.state)
            if (response.state == 0) {
                startButton.disabled = false;
                stopButton.disabled = true;
            } else {
                startButton.disabled = true;
                stopButton.disabled = false;
            }
        }
    })

    // Get settings

    // Get current counter

}

function getLogs() {
    // Get current logs
    var logs_textarea = document.getElementById('logs');
    forwardRequest({method: 'get_logs'}).then((response) => {
        if (response.success) {
            console.log(response.logs)
            logs_textarea.textContent=response.logs;
        }
    })
}

function startScript() {
    forwardRequest({method: 'state', set: true, state: 1}).then((response) => {
        if (response.success) {
            document.getElementById('startButton').disabled = true;
            document.getElementById('stopButton').disabled = false;
        }
    })
}
function stopScript() {
    forwardRequest({method: 'state', set: true, state: 0}).then((response) => {
        if (response.success) {
            document.getElementById('startButton').disabled = false;
            document.getElementById('stopButton').disabled = true;
        }
    })
}
var startButton = document.getElementById('startButton');
startButton.addEventListener('click', startScript, false);
var stopButton = document.getElementById('stopButton');
stopButton.addEventListener('click', stopScript, false);

var resetLogsButton = document.getElementById('resetLogsButton');
resetLogsButton.addEventListener('click', ()=>{forwardRequest({method: 'reset_logs'})}, false);

get_current_settings();

setInterval(() => {
    getLogs();
}, 2000);