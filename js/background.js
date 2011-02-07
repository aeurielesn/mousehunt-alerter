/**
* Provides MouseHunt Alerter methods. 
*/
MouseHuntAlerter = {};

/**
* Error notifications constants. 
*/
var NETWORK_ERROR = 0;
var WRONG_PAGE_ERROR = 1;
var MUST_LOG_IN = 2;
var OUT_OF_BAIT = 3;
var UNEXPECTED_ERROR = 255;

/**
* Constants.
*/
var DEFAULT_RETRY_MILLISECONDS = 120000;
var NOTIFICATION_DEFAULT_DELAY = 10000;
var NOTIFICATION_MANUAL_CLOSE = -1;

/**
* Shows a notification.
*/
MouseHuntAlerter.showNotification = function(msg) {
    var notification = webkitNotifications.createNotification(
        '/icons/mouse-and-cheese-48.png',
        chrome.i18n.getMessage('notification_title'),
        chrome.i18n.getMessage(msg)
    );
    notification.show();
};

/**
* Shows an error notification.
*/
MouseHuntAlerter.showError = function(status) {
    var icon = '/icons/dialog-error-48.png';
    var message = 'unexpected_error';
    var delay = NOTIFICATION_DEFAULT_DELAY;

    switch(status)
    {
    case NETWORK_ERROR:
        icon = '/icons/network-error-48.png';
        message = 'network_error';
        break;
    case WRONG_PAGE_ERROR:
        message = 'wrong_page_error';
        break;
    case MUST_LOG_IN:
        message = 'must_log_in';
        delay = NOTIFICATION_MANUAL_CLOSE;
        break;
    case OUT_OF_BAIT:
        message = 'out_of_bait';
        delay = NOTIFICATION_MANUAL_CLOSE;
        break;
    }

    var notification = webkitNotifications.createNotification(
        icon,
        chrome.i18n.getMessage('notification_error_title'),
        chrome.i18n.getMessage(message)
    );
    if(delay !== NOTIFICATION_MANUAL_CLOSE) {
        notification.ondisplay = function() {
            setTimeout(function() { notification.cancel(); }, delay);
        };
    }
    notification.show();
};

/**
* Fetch the remaining time until the player can sound the Hunter's Horn. 
*/
MouseHuntAlerter.getUserObject = function(response) {
    var start = response.indexOf("user =");
    var user = {};
    if(start !== -1) {
        start += "user =".length;
        user = json_parse(response.substr(start));
    } else {
        user = { "is_online": false };
    }
    return user;
};

/**
* Check whether the player can sound the Hunter's Horn at the moment.
* Otherwise schedules a new check.
*/
MouseHuntAlerter.checkNextActiveTurn = function() {
    var xhr = new XMLHttpRequest();
    //var url = "http://apps.facebook.com/mousehunt/index.php";
    var url = "http://www.mousehuntgame.com/index.php";
    xhr.onreadystatechange = function() {
        var delay = DEFAULT_RETRY_MILLISECONDS;
        if(xhr.readyState !== 4) {
            return;
        } else if(xhr.status === 200) {
            if(xhr.responseText.match(/appname = 'MouseHunt'/)) {
                var user = MouseHuntAlerter.getUserObject(xhr.responseText);
                if(user.is_online) {
                    if(user.next_activeturn_seconds <= 0) {
                        if(user.has_puzzle === false) {
                            if(user.bait_quantity > 0) {
                                MouseHuntAlerter.showNotification('sound_hunter_horn');
                            } else {
                                MouseHuntAlerter.showError(OUT_OF_BAIT);
                            }
                        } else {
                            MouseHuntAlerter.showNotification('kings_reward');
                        }
                        delay = user.activeturn_wait_seconds * 1000;
                    } else {
                        delay = user.next_activeturn_seconds * 1000;
                    }
                } else {
                    MouseHuntAlerter.showError(MUST_LOG_IN);
                }
            } else {
                MouseHuntAlerter.showError(WRONG_PAGE_ERROR);
            }
        } else if(xhr.status === 404) {
            MouseHuntAlerter.showError(NETWORK_ERROR);
        } else {
            MouseHuntAlerter.showError(UNEXPECTED_ERROR);
        }
        setTimeout(MouseHuntAlerter.checkNextActiveTurn, delay);
    };
    try {
        xhr.open("GET", url, true);
        xhr.send(null);
    } catch(e) {
        MouseHuntAlerter.showError(UNEXPECTED_ERROR);
    }
};

/**
* Called when page is loaded.
*/
function init() {
    MouseHuntAlerter.checkNextActiveTurn();
}

/**
* Entry point.
*/
window.addEventListener('load', init, false);
