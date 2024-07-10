const HH_SITE = 'hh.ru';

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  // Enables the side panel on hh.ru
  if (url.origin.includes(HH_SITE)) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
});

function addCounters() {
  return new Promise((resolve) => {
    chrome.storage.local.get({counter: 0}).then((response) => {
      var current_counter = response.counter;
      current_counter+=1;
      chrome.storage.local.get({settings: {letter: "", amount: 200}}).then((response) => {
        if (current_counter >= response.settings.amount) {
          chrome.storage.local.set({state: 0}).then(
            chrome.storage.local.set({counter: current_counter})
          );
        } else {
          chrome.storage.local.get({page_counter: 0}).then((response) => {
            var current_page_counter = response.page_counter;
            current_page_counter+=1;
    
            chrome.storage.local.set({counter: current_counter}).then(
              chrome.storage.local.set({page_counter: current_page_counter})
            )
          })
        }
      })
    })
    return resolve();
  })
}

function addLogEntry(data, split, current_time) {
  // Add log entry
  return new Promise((resolve) => {
    chrome.storage.local.get({logs: ""}).then((response) => {
      var current_logs = response.logs;
      if (data == "" && split) {
        current_logs+='-----------------------------\n';
      } else if (split) {
        current_logs+=current_time+' '+data+'\n';
        current_logs+='-----------------------------\n';
      } else {
        current_logs+=current_time+' '+data+'\n';
      }
      chrome.storage.local.set({logs: current_logs}).then(
        resolve(current_logs)
      );
    })
  })
}

function checkLastLogAndRestart(senderTab, current_time) {
  /*Get last log timestamp and restart script if time 
    since last log is more than 30 sec and current 
    state isn't 0

    Add +1 to counter
    Focus on tab with hh main page
    Set state to 1
    Log that script has restarted */
    
  return new Promise((resolve) => {
    chrome.storage.local.get({last_log_timestamp: Math.floor(Date.now() / 1000)}).then(
      (response) => {
        var last_log_timestamp = response.last_log_timestamp;
        var current_timestamp = Math.floor(Date.now() / 1000);

        chrome.storage.local.get({state: 0}).then((response) => {
          var current_state = response.state;
          console.log(current_timestamp-last_log_timestamp);

          if (current_state != 0 && (current_timestamp-last_log_timestamp) >= 30) {
            addCounters().then(() => {
              if (senderTab) {
                // TODO: somehow detect if request came from tab or sidepanel
                chrome.tabs.update(senderTab.id, {"active": true}, function(tab){ });
              }
              chrome.storage.local.set({state: 1}).then(() => {
                addLogEntry("Script has restarted", true, current_time).then(() => {
                    chrome.storage.local.set({last_log_timestamp: Math.floor(Date.now() / 1000)}).then(
                      resolve()
                    );
                  } 
                )
              })
            })
          } else {
            return resolve();
          }
        })
      }
    )
  })
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var today = new Date();
  var hours = today.getHours();
  var minutes = today.getMinutes();
  var seconds = today.getSeconds();
  var current_time = '[' + hours + ':' + minutes + ':' + seconds + ']';


  if (request.method == "reset_logs"){
    // Reset logs
    chrome.storage.local.set({logs: ""}).then(() => {
        sendResponse({success: true});
      }
    );
    
  } else if (request.method == "add_log") {
    // Save last log timestamp
    var last_log_timestamp = Math.floor(Date.now() / 1000);
    chrome.storage.local.set({last_log_timestamp: last_log_timestamp});

    addLogEntry(request.data, request.split, current_time).then((current_logs) => {
      sendResponse({success: true, logs: current_logs});
    })
  } else if (request.method == "get_logs") {
    // Get logs
    chrome.storage.local.get({logs: ""}).then((response) => {
      var current_logs = response.logs;
      sendResponse({success: true, logs: current_logs});
    })
  } else if (request.method == "counter") {
    // Reset, get or add to counter
    if (request.reset == true) {
      chrome.storage.local.set({last_log_timestamp: Math.floor(Date.now() / 1000)});

      if (request.type == 'page') {
        chrome.storage.local.set({page_counter: 0}).then(
          sendResponse({success: true, counter: 0})
        );
      } else {
        chrome.storage.local.set({counter: 0}).then(
          chrome.storage.local.set({page_counter: 0}).then(
            sendResponse({success: true, counter: 0})
          )
        );
      }
    } else if (request.get == true) {
      if (request.type == 'page') {
        chrome.storage.local.get({page_counter: 0}).then((response) => {
          sendResponse({success: true, counter: response.page_counter});
        })  
      } else {
        chrome.storage.local.get({counter: 0}).then((response) => {
          sendResponse({success: true, counter: response.counter});
        })
      }
      
    } else if (request.add == true) {
      addCounters(request.data, request.split).then(() => {
        sendResponse({success: true});
      });
    }

  } else if (request.method == "settings") {
    // Get and change settings
    if (request.get == true) {
      chrome.storage.local.get({settings: {letter: "", amount: 200}}).then((response) => {
        sendResponse({success: true, settings: response.settings});
      })
    } else if (request.set == true) {
      chrome.storage.local.set({settings: request.data}).then(
        sendResponse({success: true, settings: request.data})
      );
    }

  } else if (request.method == "state") {    
      // States: 0 - Stop, 1 - Start, 2 - Send letter
      if (request.set == true) {
        chrome.storage.local.set({state: request.state}).then(
          sendResponse({success: true, state: request.state})
        )
      } else if (request.get == true) {
        checkLastLogAndRestart(sender.tab, current_time).then(
          () => {
            chrome.storage.local.get({state: 0}).then((response) => {
              sendResponse({success: true, state: response.state});
            })
          }
        )
      }

  };
  return true;
});