/**
* Provides MouseHunt Alerter methods. 
*/
MouseHuntAlerter = {};

/**
* Error notifications constants. 
*/
var NETWORK_ERROR = 0;
var WRONG_PAGE_ERROR = 1;
var UNEXPECTED_ERROR = 255;

/**
* Constants.
*/
var DEFAULT_RETRY_MILLISECONDS = 120000;

/**
* Shows a notification.
*/
MouseHuntAlerter.showNotification = function(msg) {
    var notification = webkitNotifications.createNotification(
        '/icons/mouse-and-cheese-48.png',
        chrome.i18n.getMessage('notification_title'),
        chrome.i18n.getMessage(msg)
    );
//	notification.ondisplay = function() {
//		setTimeout(function() { notification.cancel(); }, 15000);
//	}
    notification.show();
};

/**
* Shows an error notification.
*/
MouseHuntAlerter.showError = function(status) {
    var icon = '/icons/dialog-error-48.png';
    var message = chrome.i18n.getMessage('unexpected_error');

    switch(status)
    {
    case NETWORK_ERROR:
        icon = '/icons/network-error-48.png';
        message = chrome.i18n.getMessage('network_error');
        break;
    case WRONG_PAGE_ERROR:
        message = chrome.i18n.getMessage('wrong_page_error');
        break;
    }

    var notification = webkitNotifications.createNotification(
        icon,
        chrome.i18n.getMessage('notification_error_title'),
        message
    );
    notification.ondisplay = function() {
        setTimeout(function() { notification.cancel(); }, 15000);
    };
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
        // What to do in case of not find an user object?
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
                if(user.next_activeturn_seconds <= 0) {
                    MouseHuntAlerter.showNotification('sound_hunter_horn');
                    delay = user.activeturn_wait_seconds * 1000;
                } else {
                    delay = user.next_activeturn_seconds * 1000;
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
