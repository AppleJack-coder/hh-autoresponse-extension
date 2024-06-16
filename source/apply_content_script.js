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

async function applyLetter() {
    var response = await forwardRequest({method: "state", get: true});
    if (response.state == 2) {
        var relocation_warning = document.querySelectorAll("[data-qa='relocation-warning-confirm']");
        if (relocation_warning.length != 0) {
            relocation_warning[0].click();
            await timeout(5000);
        }
        // Click if there is a button for applying letter
        var letter_btn_list = document.querySelectorAll("[data-qa='vacancy-response-letter-toggle']");
        var apply_btn = document.querySelectorAll("[data-qa='vacancy-response-submit-popup']");
        if (apply_btn.length != 0 && letter_btn_list.length != 0) {
            await forwardRequest({method: "add_log", data: "Couldn't apply to vacancy"});
        } else {
            // Get letter from settings and insert into textarea
            var response = await forwardRequest({method: "settings", get: true});
            var letter_txt = response.settings.letter;

            if (letter_btn_list && letter_btn_list.length > 0) {
                letter_btn = letter_btn_list[0];
    
                letter_btn.click();
                await timeout(2000);
                document.querySelectorAll("[data-qa='vacancy-response-letter-informer']")[0].getElementsByTagName('textarea')[0].value = letter_txt;
                await timeout(2000);
    
                // Send letter and check if there is confirmation
                document.querySelectorAll("[data-qa='vacancy-response-letter-informer']")[0].getElementsByTagName('button')[0].click();
                await timeout(2000);
                let confirmation = document.querySelectorAll("[data-qa='vacancy-response-letter-informer']")[0].textContent;
                            
                // Log
                if (confirmation.includes("отправлено") || confirmation.includes("has been sent")) {
                    await forwardRequest({method: "add_log", data: "Letter sent"});
                } else {
                    await forwardRequest({method: "add_log", data: "Couldn't send a letter"});
                }
            } else if (letter_btn_list.length == 0) {
                document.querySelectorAll("[data-qa='vacancy-response-popup-form-letter-input']")[0].value = letter_txt;
                await timeout(2000);
    
                // Send letter and check if there is confirmation
                document.querySelectorAll("[data-qa='vacancy-response-submit-popup']")[0].click();
                            
                // Log
                await forwardRequest({method: "add_log", data: "Letter sent"});
            }
        }
        
        await forwardRequest({method: "add_log", data: "", split: true});
        
        // Set state to 1 and close tab
        await forwardRequest({method: "state", set: true, state: 1});
        window.close();
    }
}

setTimeout(async () => {
    // Get current url and save to logs
    let current_url = window.location.href;
    await forwardRequest({method: "add_log", data: `${current_url}`});

    try {
        await applyLetter();
    } catch (ex) {
        // Log
        await forwardRequest({method: "add_log", data: "Something went horribly wrong... Anyways, continue)"});
        await forwardRequest({method: "add_log", data: "", split: true});

        // Set state to 1 and close tab
        await forwardRequest({method: "state", set: true, state: 1});
        window.close();
    }
    
}, 5000);