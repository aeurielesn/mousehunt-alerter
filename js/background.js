/**
* Provides MouseHunt Alerter methods. 
*/
MouseHuntAlerter = {};

/**
* Shows a notification.
*/
MouseHuntAlerter.showNotification = function(msg) {
	var notification = webkitNotifications.createNotification(
		'/icons/text-html-48.png',
		'Next Active Turn',
		msg
	);
	notification.show();
}

/**
* Fetch the remaining time until the player can sound the Hunter's Horn. 
*/
MouseHuntAlerter.getNextActiveTurn = function() {
	var xhr = new XMLHttpRequest();
    var url = "http://www.mousehuntgame.com/index.php";
    xhr.onreadystatechange = function() {
        if(xhr.readyState != 4) return;
        if(xhr.status == 200) {
            if(xhr.responseText.match(/appname = 'MouseHunt'/)) {
            	var nextActiveTurn = xhr.responseText.match(/"next_activeturn_seconds":(\d+)/i);
            	nextActiveTurn = nextActiveTurn[1] * 1000;
            	if(nextActiveTurn <= 0) {
            		MouseHuntAlerter.showNotification("You can sound the Hunter's Horn now!");
            		var activeTurnWait = xhr.responseText.match(/"activeturn_wait_seconds":(\d+)/i);
            		activeTurnWait = activeTurnWait[1] * 1000;
            		setTimeout(MouseHuntAlerter.getNextActiveTurn, activeTurnWait);
            	} else {
            		setTimeout(MouseHuntAlerter.getNextActiveTurn, nextActiveTurn);
            	}
            } else {
            	MouseHuntAlerter.showNotification("Something went wrong.");
                return;
            }
        } else if(xhr.status == 404) {
        	MouseHuntAlerter.showNotification("Server not found.");
            return;
        } else {
        	MouseHuntAlerter.showNotification("Unexpected error while fetching MH.");
        	return;
        }
    }
    try {
        xhr.open("GET", url, true);
        xhr.send(null);
    } catch(e) {
    	// Unknown error
    }
}

/**
* Called when page is loaded.
*/
function init() {
	MouseHuntAlerter.getNextActiveTurn();
}

/**
* Entry point.
*/
window.addEventListener('load', init, false);
