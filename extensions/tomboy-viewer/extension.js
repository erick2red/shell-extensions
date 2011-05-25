const DBus = imports.dbus;
const Lang = imports.lang;

const St = imports.gi.St;
const Main = imports.ui.main;

const BUS_NAME = 'org.gnome.Tomboy';
const OBJECT_PATH = '/org/gnome/Tomboy/RemoteControl';

const TomboyRemoteInterface = {
    name: 'org.gnome.Tomboy.RemoteControl',
    methods: [
        { name: 'ListAllNotes', inSignature: '', outSignature: 'as' },
        { name: 'GetNoteTitle', inSignature: 's', outSignature: 's' }
        ]
};
let TomboyManagerProxy = DBus.makeProxyClass(TomboyRemoteInterface);

function TomboyManagerUI() {
	this._init();
}

TomboyManagerUI.prototype = {
    _init: function() {
		this.bigLabel = new St.Label({ text: 'Big Label' });
        this.actor = new St.Bin({ child: this.bigLabel, x_fill: true, y_fill: true });

        this._workId = Main.initializeDeferredWork(this.actor, Lang.bind(this, this._redisplay));
    },

    _redisplay: function() {
        //here re display
        this.bigLabel.set_text('Very Big Label');
    }
}


function main() {
	log('Entring Here');
	let tomboy_proxy = new TomboyManagerProxy(DBus.session, BUS_NAME, OBJECT_PATH);
	tomboy_proxy.ListAllNotesRemote(Lang.bind(this, function(results, err){
		log('Executing this');
		if(err) {
			log(err);
			log('Returning because of an error');
			return;
		}
		for(let j = 0; j < results.length; j++) {
			let note_uri = results[j];
			tomboy_proxy.GetNoteTitleRemote(note_uri, function(result, err){
				log('Note: ' + result);
			});
			
		}
	}));
	
	//setting view
	let tomboy_ui = new TomboyManagerUI();
	Main.overview.viewSelector.addViewTab('tomboy', 'Tomboy', tomboy_ui.actor);
}
