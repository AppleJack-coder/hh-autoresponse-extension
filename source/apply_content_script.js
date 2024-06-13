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


setTimeout(async () => {
    let response = await forwardRequest({method: "state", get: true});
    if (response.state == 2) {
        // Click if there is a button for applying letter
        var letter_btn_list = document.querySelectorAll("[data-qa='vacancy-response-letter-toggle']");
        if (letter_btn_list.length > 0) {
            letter_btn = letter_btn_list[0];
            
            // Get letter from settings and insert into textarea
            let response = await forwardRequest({method: "settings", get: true});
            let letter_txt = response.settings.letter;

            letter_btn.click();
            await timeout(2000);
            document.querySelectorAll("[data-qa='vacancy-response-letter-informer']")[0].getElementsByTagName('textarea')[0].value = 'Добрый день';//letter_txt;
            await timeout(2000);

            // Send letter and check if there is confirmation
            document.querySelectorAll("[data-qa='vacancy-response-letter-informer']")[0].getElementsByTagName('button')[0].click();
            await timeout(2000);
            let confirmation = document.querySelectorAll("[data-qa='vacancy-response-letter-informer']")[0].textContent;
                        
            // Log
            if (confirmation.includes("отправлено")) {
                await forwardRequest({method: "add_log", data: "Letter sent"});
            } else {
                await forwardRequest({method: "add_log", data: "Couldn't send a letter"});
            }
        }

        // Get current url and save to logs
        let current_url = window.location.href;
        await forwardRequest({method: "add_log", data: `Applied to ${current_url}`});
        await forwardRequest({method: "add_log", data: "", split: true});
        
        // Set state to 1 and close tab
        await forwardRequest({method: "state", set: true, state: 1});
        window.close();
    }
}, 5000);