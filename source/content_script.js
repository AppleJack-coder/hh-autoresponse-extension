// TODO: change browser settings to open new tab not window
function forwardRequest(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (!response) return reject(chrome.runtime.lastError)
      return resolve(response)
    })
  })
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


console.log('Starting content_script.js');

async function openInNewTab(url) {
    window.open(url, '_blank').focus();
}

async function hide(target) {
    let response = await forwardRequest({method: "state", get: true});
    if (response.state == 1) {
        // Click on "hide" and "hide this vacancy"
        target.querySelectorAll("[data-qa='vacancy__blacklist-show-add']")[2].focus();
        await timeout(1000);
        target.querySelectorAll("[data-qa='vacancy__blacklist-show-add']")[2].click();
        await timeout(1000);
        document.querySelectorAll("[data-qa='vacancy__blacklist-menu-add-vacancy']")[0].click();
        return;
    } else {
        await timeout(2000);
        return await hide(target);
    }
}

function hide_vacancy(target) {
    return new Promise(async (resolve) => {
        console.log('Promise');
        await hide(target);
        return resolve();
    });
}

async function send_application() {
    let response = await forwardRequest({method: "counter", get: true});

    if (response.success) {
        var counter = response.counter;
        console.log(counter);

        // Get target vacancy
        var vacancies = document.getElementsByClassName('serp-item_link');
        var target = vacancies[counter];
        console.log(target);

        // Scroll to target
        target.scrollIntoView({behavior: "smooth"});

        // Get block title and response url
        var target_title = target.getElementsByClassName('serp-item__title-link')[0].textContent;
        await forwardRequest({method: "add_log", data: `Located vacancy ${target_title}`});
        var target_response_url = target.getElementsByClassName('bloko-button_kind-primary')[0].href;

        // Go to response url
        await forwardRequest({method: "state", set: true, state: 2});
        await openInNewTab(target_response_url);

        console.log('Waiting to hide');
        await hide_vacancy(target);
        console.log('Hidden');
        // Add 1 to counter
        await forwardRequest({method: "counter", add: true});
    }
}

async function mainLoop() {
    var response = await forwardRequest({method: "state", get: true});
    if (response.success == true) {
        console.log(response.state);
        if (response.state == 1) {
            await send_application();
        } else if (response.state == 0){
        }
    } else {
        await forwardRequest({method: "add_log", data: "Error while getting state"});
    }
    await timeout(1000);
    await mainLoop();
}

setTimeout(mainLoop, 1000);
