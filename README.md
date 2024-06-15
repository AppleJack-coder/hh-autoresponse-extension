# hh autoresponse extension
Google Chrome extension for sending applications for multiple vacancies on hh website

# Description
The hh (HeadHunter) website allows their users to apply for up to 200 vacancies per day. This extension tries to automate this process to save your time.

# Install
1. Turn on developer mode in google chrome extension tab
2. Unpack extension and "Install unpacked"
![Installation instructions](https://github.com/AppleJack-coder/hh-autoresponse-extension/blob/main/instructions/install.gif)
3. Go to hh.ru website
4. Open side panel and configure extension
![Configuration instructions](https://github.com/AppleJack-coder/hh-autoresponse-extension/blob/main/instructions/configure.gif)
5. Click on "Start"

# TODO
- [x] 1. Add service worker for handling requests from side panel and content scripts
- [x] 2. Add settings
- [x] 3. Display logs in side panel
- [x] 4. Add "Start" and "Stop" buttons to side panel
- [ ] 5. Add commands
- [x] 6. Add functions to itterate through vacancies and hide them once they where checked
- [x] 7. Send to every vacancy letter from settings
- [x] 8. Avoid stucking on popups and additional confirmations
- [ ] 9. Go to next page if needed and continue there