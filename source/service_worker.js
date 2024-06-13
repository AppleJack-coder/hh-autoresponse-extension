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
    // Add log entry
    chrome.storage.local.get({logs: ""}).then((response) => {
      var current_logs = response.logs;
      if (request.data == "" && request.split) {
        current_logs+='-----------------------------\n';
      } else {
        current_logs+=current_time+' '+request.data+'\n';
      }
      chrome.storage.local.set({logs: current_logs}).then(
        sendResponse({success: true, logs: current_logs})
      );
    })
  } else if (request.method == "get_logs") {
    // Get logs
    chrome.storage.local.get({logs: ""}).then((response) => {
      var current_logs = response.logs;
      sendResponse({success: true, logs: current_logs});
    })
  } else if (request.method == "counter") {
    // TODO: stop script if counter > amount in settings
    // Reset, get or add to counter
    if (request.reset == true) {
      chrome.storage.local.set({counter: 0}).then(
        sendResponse({success: true, counter: 0})
      );
    } else if (request.get == true) {
      chrome.storage.local.get({counter: 0}).then((response) => {
        sendResponse({success: true, counter: response.counter});
      })
      
    } else if (request.add == true) {
      chrome.storage.local.get({counter: 0}).then((response) => {
        var current_counter = response.counter;
        current_counter+=1;
        chrome.storage.local.set({counter: current_counter}).then(
          sendResponse({success: true, counter: current_counter})
        );
      })
      
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
      chrome.storage.local.get({state: 0}).then((response) => {
        sendResponse({success: true, state: response.state});
      })
    }
  };
  return true;
});