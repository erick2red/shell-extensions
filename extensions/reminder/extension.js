const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const ModalDialog = imports.ui.modalDialog;

const Gettext = imports.gettext.domain('shell-extensions');
const _ = Gettext.gettext;

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.reminder';
const SETTINGS_KEY = 'reminderss';

function AddReminderDialog() {
	this._init();
}

AddReminderDialog.prototype = {
__proto__: ModalDialog.ModalDialog.prototype,
	_init : function() {
		ModalDialog.ModalDialog.prototype._init.call(this);

		let label = new St.Label({ text: _("Add Reminder:") });

		this.contentLayout.add(label, { y_align: St.Align.START });
		this.contentLayout.add_style_class_name('main-box');

		let on_date = new St.BoxLayout({ vertical: false });
		on_date.add(new St.Label({ text: _("On Date")}), { x_align: St.Align.START } );
		on_date.add(new St.Entry({ style_class: 'date-entry' }), { x_align: St.Align.START } );
		on_date.add(new St.Label({ text: "/" }), { x_align: St.Align.START } );
		on_date.add(new St.Entry({ style_class: 'date-entry' }), { x_align: St.Align.START } );
		this.contentLayout.add(on_date, { y_align: St.Align.START });

		let buttons_box = new St.BoxLayout({ vertical: false });
		buttons_box.add(new St.Button({ label: 'Cancel',
										can_focus: true,
										reactive: true,
										x_align: St.Align.START,
										x_fill: true}),  { x_align: St.Align.START });
		buttons_box.add(new St.Button({ label: 'Ok',
										can_focus: true,
										reactive: true,
										x_align: St.Align.START,
										x_fill: true}),  { x_align: St.Align.START });
		this.contentLayout.add(buttons_box, { y_align: St.Align.START });
		
		let entry = new St.Entry();

		this._entryText = entry.clutter_text;
		this.contentLayout.add(entry, { y_align: St.Align.START });
		this.setInitialKeyFocus(this._entryText);

		this._errorBox = new St.BoxLayout();

		this.contentLayout.add(this._errorBox, { expand: true });

		let errorIcon = new St.Icon({ icon_name: 'dialog-error', icon_size: 24 });

		this._errorBox.add(errorIcon, { y_align: St.Align.MIDDLE });

		this._commandError = false;

		this._errorMessage = new St.Label();
		this._errorMessage.clutter_text.line_wrap = true;

		this._errorBox.add(this._errorMessage, { expand: true,
												 y_align: St.Align.MIDDLE,
												 y_fill: false });

		this._errorBox.hide();

		this._entryText.connect('key-press-event', Lang.bind(this, function(o, e) {
			let symbol = e.get_key_symbol();
			if (symbol == Clutter.Return || symbol == Clutter.KP_Enter) {
				this.popModal();
				this._run(o.get_text());
				if (!this._commandError)
					this.close();
				else {
					if (!this.pushModal())
						this.close();
				}
				return true;
			}
			if (symbol == Clutter.Escape) {
				this.close();
				return true;
			}
			return false;
		}));
	},

	_run : function(input) {
		let command = input;

		this._commandError = false;
		if (input) {
			//process
		} else {
			this._commandError = true;
			//TODO fix error message
			this._errorMessage.set_text('Sample Error Message');

			if (!this._errorBox.visible) {
				let [errorBoxMinHeight, errorBoxNaturalHeight] = this._errorBox.get_preferred_height(-1);
				
				let parentActor = this._errorBox.get_parent();
				Tweener.addTween(parentActor, { height: parentActor.height + errorBoxNaturalHeight,
					time: DIALOG_GROW_TIME,
					transition: 'easeOutQuad',
					onComplete: Lang.bind(this, function() {
						parentActor.set_height(-1);
						this._errorBox.show();
					})
				});
			}
		}
	},

	open: function() {
		this._errorBox.hide();
		this._entryText.set_text('');
		this._commandError = false;

		ModalDialog.ModalDialog.prototype.open.call(this);
	},

};

function ReminderNotification() {
	this._init.apply(this, arguments);
}

ReminderNotification.prototype = {
	__proto__: MessageTray.Notification.prototype,

	_init: function(source, msg) {
		MessageTray.Notification.prototype._init.call(this, source, msg);

		this.setUrgency(MessageTray.Urgency.CRITICAL);
		this.setResident(true);

		this.addButton('back-in-five', _('Be back in 5 min'));
		this.addButton('close', _('Close'));

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
		MessageTray.Source.prototype._init.call(this, _('Reminder Notification'));

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
		
		this.dialog = null;
//		this._settings = new Gio.Settings({ schema: SETTINGS_SCHEMA });
	},
	
	_createReminderSection : function() {
		this._reminderSection.removeAll();
		this.reminderItems = [];
		
		this.reminderItems[0] = new PopupMenu.PopupMenuItem(_('Add'));
		let icon = new St.Icon({ icon_name: 'list-add', style_class: 'popup-menu-icon' });
		this.reminderItems[0].addActor(icon, { align: St.Align.END});
		this._reminderSection.addMenuItem(this.reminderItems[0]);
		this.reminderItems[0].connect('activate', function(actor, event){
			Panel.mymenu.getDialog().open()
		});

		this.reminderItems[1] = new PopupMenu.PopupMenuItem('Test Notification');
		let icon = new St.Icon({ icon_name: 'system-run', style_class: 'popup-menu-icon' });
		this.reminderItems[1].addActor(icon, { align: St.Align.END});
		this._reminderSection.addMenuItem(this.reminderItems[1]);
		this.reminderItems[1].connect('activate', function(actor, event){
			let notification = new ReminderNotification(Panel.mymenu.reminderSource, 'Testing notification emmitt');
			Panel.mymenu.reminderSource.notify(notification);
		});
	},
	
	getDialog: function() {
		if (this.dialog == null) {
			this.dialog = new AddReminderDialog();
		}
		return this.dialog;
	}	
}

function main() {
	Panel.STANDARD_TRAY_ICON_ORDER.unshift('reminder-indicator');
	Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['reminder-indicator'] = ReminderIndicator;
}
