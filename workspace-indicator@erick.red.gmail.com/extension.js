const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;

const Main = imports.ui.main;

PanelMenu.SystemStatusButton.prototype.updateActor = function(_newActor){
	this._iconActor = _newActor;
	this.actor.set_child(this._iconActor);
}

function WorkspaceIndicator() {
	this._init.apply(this, arguments);
}

WorkspaceIndicator.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,
	
	_init: function(){
		//debugging
		Panel.mymenu = this;

		PanelMenu.SystemStatusButton.prototype._init.call(this, 'folder', 'Workspace Indicator');
		
		this.statusLabel = new St.Label({ text: this._labelText() });
		this.updateActor(this.statusLabel);

		this.workspacesItems = [];
		this._workspaceSection = new PopupMenu.PopupMenuSection();
		this.menu.addMenuItem(this._workspaceSection);
		global.screen.connect_after('workspace-added', Lang.bind(this,this._createWorkspacesSection));
		global.screen.connect_after('workspace-removed', Lang.bind(this,this._createWorkspacesSection));
		global.screen.connect_after('workspace-switched', Lang.bind(this,this._updateIndicator));
		this.actor.connect('scroll-event', Lang.bind(this, this._onScrollEvent));
		this._createWorkspacesSection();

		//styling
		this.menu.actor.add_style_class_name('shorter');
		this.menu.actor.remove_style_class_name('popup-menu');
	},
	
	_updateIndicator: function() {
		this.statusLabel.set_text(this._labelText());
	},

	_labelText : function(workspaceIndex) {
		if(workspaceIndex == undefined) {
			workspaceIndex = global.screen.get_active_workspace().index();
		}
		return "Workspace " + ((workspaceIndex + 1).toString());
	},
	
	_createWorkspacesSection : function() {
		this._workspaceSection.removeAll();
		this.workspacesItems = [];
		
		for(let i = 0; i < global.screen.n_workspaces; i++) {
			this.workspacesItems[i] = new PopupMenu.PopupMenuItem(this._labelText(i));
			this._workspaceSection.addMenuItem(this.workspacesItems[i]);
			this.workspacesItems[i].workspaceId = i;
			this.workspacesItems[i].label_actor = this.statusLabel;
			let self = this;
			this.workspacesItems[i].connect('activate', Lang.bind(this, function(actor, event) {
				this._activate(actor.workspaceId);
			}));
		}
	},

	_activate : function (index) {
		let item = this.workspacesItems[index];
		if(!item) return;
		let metaWorkspace = global.screen.get_workspace_by_index(index);
		metaWorkspace.activate(true);
		this._updateIndicator();
	},

	_onScrollEvent : function(actor, event) {
		let direction = event.get_scroll_direction();
		let diff = 0;
		if (direction == Clutter.ScrollDirection.DOWN) {
			diff = 1;
		} else if (direction == Clutter.ScrollDirection.UP) {
			diff = -1;
		} else {
			return;
		}

		let newIndex = global.screen.get_active_workspace().index() + diff;
		this._activate(newIndex);
	},
}

function main() {
	Panel.STANDARD_TRAY_ICON_ORDER.unshift('workspace-indicator');
	Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['workspace-indicator'] = WorkspaceIndicator;
}
