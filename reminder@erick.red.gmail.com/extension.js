const St = imports.gi.St;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.reminder';
const SETTINGS_KEY = 'reminderss';

function ReminderNotification() {
    this._init.apply(this, arguments);
}

ReminderNotification.prototype = {
    __proto__: MessageTray.Notification.prototype,

    _init: function(source, msg) {
        MessageTray.Notification.prototype._init.call(this, source, msg);

        this.setUrgency(MessageTray.Urgency.HIGH);
        this.setResident(true);
        this.setTransient(false);

        this.addButton('back-in-five', 'Be back in 5 min');
        this.addButton('close', 'Close');

        this.connect('action-invoked', Lang.bind(this, function(self, action) {
            switch (action) {
		        case 'back-in-five':
		            log('Relaunch notification in five');
		            break;
		        case 'close':
		            log('closing');
		            this.destroy();
		            break;
            }
            this.destroy();
        }));
    }
}

function ReminderNotificationSource() {
    this._init();
}

ReminderNotificationSource.prototype = {
    __proto__:  MessageTray.Source.prototype,

    _init: function() {
        MessageTray.Source.prototype._init.call(this, "Reminder Notification");

        this._setSummaryIcon(this.createNotificationIcon());
    },

    createNotificationIcon: function() {
        return new St.Icon({ icon_name: 'dialog-information',
                             icon_type: St.IconType.SYMBOLIC,
                             icon_size: this.ICON_SIZE });
    }
}

function ReminderIndicator() {
	this._init.apply(this, arguments);
}

ReminderIndicator.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,
	
	_init: function(){
		//debugging
		Panel.mymenu = this;

		PanelMenu.SystemStatusButton.prototype._init.call(this, 'software-update-available', 'Reminder Indicator');
		
		this.reminderItems = [];
		this._reminderSection = new PopupMenu.PopupMenuSection();
		this.menu.addMenuItem(this._reminderSection);
		this._createReminderSection();
		
		this.reminderSource = new ReminderNotificationSource();
		Main.messageTray.add(this.reminderSource);
//		this._settings = new Gio.Settings({ schema: SETTINGS_SCHEMA });
	},
	
	_createReminderSection : function() {
		this._reminderSection.removeAll();
		this.reminderItems = [];
		
		this.reminderItems[0] = new PopupMenu.PopupMenuItem('Add');
		let icon = new St.Icon({ icon_name: 'list-add', style_class: 'popup-menu-icon' });
		this.reminderItems[0].addActor(icon, { align: St.Align.END});
		this._reminderSection.addMenuItem(this.reminderItems[0]);

		this.reminderItems[1] = new PopupMenu.PopupMenuItem('Test Notification');
		let icon = new St.Icon({ icon_name: 'system-run', style_class: 'popup-menu-icon' });
		this.reminderItems[1].addActor(icon, { align: St.Align.END});
		this._reminderSection.addMenuItem(this.reminderItems[1]);
		this.reminderItems[1].connect('activate', function(actor, event){
			let notification = new ReminderNotification(Panel.mymenu.reminderSource, 'Testing notification emmitt');
			Panel.mymenu.reminderSource.notify(notification);
		});
	},
	
}

function main() {
	Panel.STANDARD_TRAY_ICON_ORDER.unshift('reminder-indicator');
	Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['reminder-indicator'] = ReminderIndicator;
}
