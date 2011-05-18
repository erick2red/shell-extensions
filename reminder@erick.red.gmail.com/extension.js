const St = imports.gi.St;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.reminder';
const SETTINGS_KEY = 'reminderss';

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
	},
	
}

function main() {
	Panel.STANDARD_TRAY_ICON_ORDER.unshift('reminder-indicator');
	Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['reminder-indicator'] = ReminderIndicator;
}
