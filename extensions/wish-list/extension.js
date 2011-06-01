// Sample extension code, makes clicking on the panel show a message
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Shell = imports.gi.Shell;
const Signals = imports.signals;
const Lang = imports.lang;
const Main = imports.ui.main;

let UUID = '';

function PopupEntryMenuItem() {
    this._init.apply(this, arguments);
}

PopupEntryMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function (style) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, { activate: false });

        this.entry = new St.Entry({ style_class: style });

		this.entry.clutter_text.connect('key-press-event', Lang.bind(this, this._onKeyPress));
        this.addActor(this.entry, { span: -1, expand: true });

		this.actor.add_style_class_name('menu-entry');
    },

    _onKeyPress: function(actor, event){
		let key = event.get_key_symbol();
		if (key == Clutter.Return || key == Clutter.KP_Enter) {
			this.emit('value-changed', this.entry.text);
			return true;
		} else if(key == Clutter.KEY_Escape) {
			this.entry.text = '';
			this.emit('value-changed', this.entry.text);
			return true;
		}
		return false;
	}

}
Signals.addSignalMethods(PopupEntryMenuItem.prototype)

function WishList() {
	this._init.apply(this, arguments);
}

WishList.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,
	
	_init: function(){
		//debugging
		Panel.wish_list = this;

		PanelMenu.SystemStatusButton.prototype._init.call(this, 'view-list-compact', 'Wish List');

		let dir = Gio.file_new_for_path(Main.ExtensionSystem.extensionMeta[UUID].path);
		let listFile = dir.get_child('lists.json');
		let listContents;
		try {
		    listContents = Shell.get_file_contents_utf8_sync(listFile.get_path());
		} catch (e) {
		    global.logError(baseErrorString + 'Failed to load metadata.json: ' + e);
		    return;
		}
		this.list = [];
		try {
		    this.list = JSON.parse(listContents);
		} catch (e) {
		    global.logError(baseErrorString + 'Failed to parse metadata.json: ' + e);
		    return;
		}		

		this._listSection = new PopupMenu.PopupMenuSection();
		this.menu.addMenuItem(this._listSection);
		
		this._createListSection();
	},
	
	_createListSection : function() {
		this._listSection.removeAll();
		this.listItems = [];
		
		this.listItems[0] = new PopupMenu.PopupMenuItem('Wish List');
		this._listSection.addMenuItem(this.listItems[0]);
		this._listSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		for(let i = 0; i < this.list.length; i++){
			this.listItems[i + 1] = new PopupMenu.PopupMenuItem(this.list[i]);
			this.listItems[i + 1].index = i;
			let icon = new St.Icon({ icon_name: 'gtk-close', icon_size: 22, icon_type: St.IconType.FULLCOLOR });
			this.listItems[i + 1].addActor(icon, { align: St.Align.END});
			this.listItems[i + 1].connect('activate', Lang.bind(this, this._remove_item));
            this._listSection.addMenuItem(this.listItems[i + 1]);
		}
		this._listSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		let new_entry = new PopupEntryMenuItem('wish-list-entry');
		this._listSection.addMenuItem(new_entry);
		new_entry.connect('value-changed', Lang.bind(this, this._new_item));
	},
	
	_remove_item: function(actor, event){
		this.list.splice(actor.index, 1);
		this.update_file_list();
		this._createListSection();
		return false;
	},
	
	_new_item: function(entry, value){
		if(value != '') {
			this.list.push(value);
			this._createListSection();
			this.update_file_list();
		}
	},
	
	update_file_list: function() {
		let dir = Gio.file_new_for_path(Main.ExtensionSystem.extensionMeta[UUID].path);
		let listFile = dir.get_child('lists.json');
        
        let raw = listFile.replace(null, false,
                            Gio.FileCreateFlags.NONE,
                            null);
        let out = Gio.BufferedOutputStream.new_sized (raw, 4096);
        Shell.write_string_to_stream (out, JSON.stringify(this.list));
		out.close(null);
	}
}

// Put your extension initialization code here
function main(meta) {
	UUID = meta.uuid;
	Panel.STANDARD_TRAY_ICON_ORDER.unshift('wish-list');
	Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['wish-list'] = WishList;
}
