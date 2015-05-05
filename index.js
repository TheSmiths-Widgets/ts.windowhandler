/**
 * @class WindowHandler
 * **WindowHandler library** creates and handles Titanium windows, modal and navigation.
 *
 * Can be used to open/close a new window, being modal or part of a navigation group or window (iOS).
 * All windows will be stored and the latest is available via `getCurrent()`
 *
 * An embedded live example:
 *
 *     @example
 *     var WH = require("libs/WindowHandler");
 *     WH.openWin($.getView()); // Will open a new modal window.
 *     WH.openNav($.getView()); // Will open a new nav, or a new window in the current nav.
 *     WH.closeWin(); // Will close the latest window.
 *
 */

var log = require("libs/logController"),
    TAG = "windowHandler";

/**
 * @property {Array} navWindows
 * @private
 * Contains currently opened windows:
 * navWindows: navigation windows
 */
/**
 * @property {Array} childWindows
 * @private
 * Contains currently opened windows:
 * childWindows: children in navigation windows
 */
/**
 * @property {Array} modalWindows
 * @private
 * Contains currently opened windows:
 * modalWindows: single windows and all android windows.
 */
var navWindows = [],
    childWindows = [],
    modalWindows = [];

var windowHandler = module.exports = {
    /**
     * @method openWin
     * Opens a single window (modal).
     * @param {appcelerator: Window} win The window object to be opened.
     * @return {appcelerator: Window} Opened window.
     */
    openWin: _openWin,
    /**
     * @method openNav
     * Opens Window in a (new) navigation window.
     * @param {appcelerator: Window} win The window object to be opened.
     * @return {appcelerator: Window} Opened window.
     */
    openNav: function(win) {
        if(OS_ANDROID) {
            return _openWin(win);
        } else {
            // TODO: add 'new' parameter to create a new nav
            // TODO: add 'nav' parameter to open in a given nav
            return _openWinInNavWindow(win);
        }
    },
    /**
     * @method closeWin
     * Close a given window or the current one.
     * @param {appcelerator: Window} win
     */
    closeWin: function(win) {
        if(win) {
            win.close();
        } else {
            windowHandler.getCurrent().close();
        }
    },
    /**
     * @method getCurrent
     * Returns the most recent window, considered as the 'current' window.
     * @return {appcelerator: Window} Current window.
     */
    getCurrent: function() {
        if(OS_ANDROID || modalWindows.length > 0) {
            return _.last(modalWindows);
        }
        if(childWindows.length > 0) {
            return _.last(childWindows);
        }
        return _.last(navWindows);
    },
}

/**
 * @method _openWin
 * @private
 * Opens a single window (modal) after registering events to configure.
 * @param {appcelerator: Window} win The window object that was opened.
 */
function _openWin(win) {
    log.info(TAG, "openWin");

    if(OS_ANDROID) {
        win.addEventListener('open', onOpenAndroidWin);
    }
    win.addEventListener('close', onModalClose);
    /* TODO: usecases
        if(modalWindows.length > 0 && navWindows.length > 0)
        On iOS this can lead the windowHandler to fail
        as it doesn't remember in which order windows were opened
        NOTE: a modal should be closed ASAP.
    */
    modalWindows.push(win);
    win.open();

    return win;
}
/**
 * @method _openNewNavWindow
 * @private
 * Creates and opens a navigation window (iOS).
 * @param {appcelerator: Window} win The window object to be included in nav.
 */
function _openNewNavWindow(win) {
    log.info(TAG, "openNewNavWindow");
    var navWindow = Ti.UI.iOS.createNavigationWindow({
        window: win
    });

    navWindow.addEventListener('close', onNavClose);
    navWindows.push(navWindow);
    navWindow.open();

    return navWindow;
}
/**
 * @method _openWinInNavWindow
 * @private
 * Opens a window in navigation. Opens a navigation window if necessary.
 * Adds control to the child window on iOS.
 * @param {appcelerator: Window} win The window object that was opened.
 */
function _openWinInNavWindow(win) {
    log.info(TAG, "openWinInNavWindow", navWindows.length);

    // Create main nav window if does not exist yet
    if(!navWindows.length) {
        return _openNewNavWindow(win);
    }

    // If there're no nav buttons yet, let's create one
    if (!win.leftNavButton) {
        log.error(TAG, "openWinInNavWindow - adding Back button");

        var backButton = Ti.UI.createButton({
            backgroundColor: "#7f8c8d",
            height: 50, width: 75,
            title: "back"
        });
        backButton.addEventListener('click', function(){
            windowHandler.closeWin(win)
        });
        win.setLeftNavButton(backButton);
    }

    win.addEventListener('close', onChildClose);
    childWindows.push(win);
    _.last(navWindows).openWindow(win);
    return win;
}
/**
 * @method onOpenAndroidWin
 * @private
 * Opens a window on Android. This is a callback for the window's `open` event.
 */
function onOpenAndroidWin(evt) {
    log.info(TAG, "onOpenAndroidWin");

    this.removeEventListener('open', onOpenAndroidWin);
    if (!this.getActivity()) {
        return;
    }

    var actionBar = this.getActivity().actionBar;
    if(actionBar) {
        log.info(TAG, 'displayHomeAsUp: true');

        actionBar.displayHomeAsUp = true;
        actionBar.onHomeIconItemSelected = function() {
            return windowHandler.closeWin();
        };
        this.getActivity().invalidateOptionsMenu();
    }
};
/**
 * @method onNavClose
 * @private
 * Closes a window according to its type. This is a callback for the window's `close` event.
 */
function onNavClose(evt) {
    log.info(TAG, "onNavClose");
    this.removeEventListener('close', onNavClose);
    navWindows.pop();
};
/**
 * @method onChildClose
 * @private
 * Closes a window according to its type. This is a callback for the window's `close` event.
 */
function onChildClose(evt) {
    log.info(TAG, "onChildClose");
    this.removeEventListener('close', onChildClose);
    childWindows.pop();
};
/**
 * @method onModalClose
 * @private
 * Closes a window according to its type. This is a callback for the window's `close` event.
 */
function onModalClose(evt) {
    log.info(TAG, "onModalClose");
    this.removeEventListener('close', onModalClose);
    modalWindows.pop();
};
