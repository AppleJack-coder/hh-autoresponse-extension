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

async function detectPageType() {
    var marker1 = document.getElementsByClassName('ResumeProfileFront-ReactRoot')[0];
    var marker2 = document.querySelectorAll("[data-qa='vacancy-response-letter-toggle']")[0];
    var marker3 = document.querySelectorAll("[data-qa='vacancy-response-submit-popup']")[0];
    if (marker1) {
        return 2;
    } else if (marker2) {
        return 0;
    } else if (marker3) {
        return 1;
    }
    return 3;
}

function waitBtnCase2(resumeElem) {
    return new Promise((resolve) => {
        setInterval(()=>{
            try {
                resumeElem.getElementsByTagName('button')[6].click();
                return resolve();
            } catch (error) {
                console.log(error);
            }
        }, 5000)
    })
}

async function applyAndInsertLetter(page_type) {
    // Get letter from settings
    var response = await forwardRequest({method: "settings", get: true});
    var letter_txt = response.settings.letter;
    switch (page_type) {
        case 0:

            var letter_btn_list = document.querySelectorAll("[data-qa='vacancy-response-letter-toggle']");
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

            break;
        
        case 1:
            let letter_textarea = document.querySelectorAll("[data-qa='vacancy-response-popup-form-letter-input']")[0];
            letter_textarea
            document.querySelectorAll("[data-qa='vacancy-response-popup-form-letter-input']")[0].value = letter_txt;
            await timeout(2000);

            // Send letter and check if there is confirmation
            document.querySelectorAll("[data-qa='vacancy-response-submit-popup']")[0].click();

            // Log
            await forwardRequest({method: "add_log", data: "Letter sent"});

            break;

        case 2:
            var resumeElem = document.getElementsByClassName('ResumeProfileFront-ReactRoot')[0];
            resumeElem.getElementsByTagName('button')[0].click();
            await timeout(5000);
            let error_msg = document.querySelectorAll("[data-qa='field-error-title']")[0];
            if (error_msg) {
                return applyAndInsertLetter(3);
            }
            await waitBtnCase2(resumeElem);
            await applyAndInsertLetter(0);
            break;
        
        case 3:
            await forwardRequest({method: "add_log", data: "Couldn't apply to vacancy"});
            break;

        default:
            break;
    }
}

async function confirmRelocation() {
    var relocation_warning = document.querySelectorAll("[data-qa='relocation-warning-confirm']");
    if (relocation_warning.length != 0) {
        relocation_warning[0].click();
        await timeout(5000);
    }
}

async function apply() {
    var response = await forwardRequest({method: "state", get: true});
    if (response.state == 2) {
        // Confirm Relocation
        await confirmRelocation();

        // Detect page type
        // 0 - standart page with add letter button
        // 1 - page just with letter field without a button
        // 2 - page with "Save and continue" button
        // 3 - None above
        let pageType = await detectPageType();
        await forwardRequest({method: "add_log", data: `PageType ${pageType}`});

        await applyAndInsertLetter(pageType);
        
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
        await apply();
    } catch (ex) {
        // Log
        await forwardRequest({method: "add_log", data: "Something went horribly wrong... Anyways, continue)"});
        await forwardRequest({method: "add_log", data: "", split: true});

        // Set state to 1 and close tab
        await forwardRequest({method: "state", set: true, state: 1});
        window.close();
    }
    
}, 5000);